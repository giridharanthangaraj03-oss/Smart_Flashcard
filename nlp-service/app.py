import datetime
import logging
import os
import time
import traceback
from typing import Any

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from nlp_service.pipeline import generate_flashcards_from_input
from nlp_service.settings import is_lightweight_mode

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("smart-flashcard-nlp")

app = FastAPI(title="Smart Flashcard NLP Service", version="1.0.0")

MAX_INPUT_CHARACTERS = 120_000
_startup_time = datetime.datetime.utcnow()
_models_loaded = False
_last_error: str | None = None
_request_count = 0
_failure_count = 0
_last_request_timestamp: datetime.datetime | None = None
_last_success_timestamp: datetime.datetime | None = None


class GenerateRequest(BaseModel):
    text: str = Field(default="", description="Study notes text")
    topic: str = Field(default="", description="Topic name for topic-based generation")
    max_cards: int = Field(default=8, ge=1, le=15, description="Number of flashcards to generate")


class FlashcardItem(BaseModel):
    question: str
    answer: str


class GenerateResponse(BaseModel):
    flashcards: list[FlashcardItem]
    count: int


def get_memory_usage() -> dict[str, float | None]:
    memory = {"rss_mb": None, "vms_mb": None}

    try:
        import resource

        usage = resource.getrusage(resource.RUSAGE_SELF)
        memory["rss_mb"] = round(usage.ru_maxrss / 1024, 2)
    except Exception as error:  # pragma: no cover
        logger.debug("resource memory probe failed: %s", error)

    if memory["rss_mb"] is None and os.path.exists("/proc/self/statm"):
        try:
            with open("/proc/self/statm", "r", encoding="utf-8") as handle:
                parts = handle.read().split()
            if len(parts) >= 2:
                page_size_mb = os.sysconf("SC_PAGE_SIZE") / 1024 / 1024
                memory["rss_mb"] = round(int(parts[1]) * page_size_mb, 2)
        except Exception as error:  # pragma: no cover
            logger.debug("/proc/self/statm memory probe failed: %s", error)

    return memory


@app.middleware("http")
async def log_requests(request: Request, call_next):
    global _request_count, _failure_count, _last_request_timestamp, _last_error

    start_time = time.time()
    _request_count += 1
    _last_request_timestamp = datetime.datetime.utcnow()
    request_path = request.url.path
    client_ip = request.client.host if request.client else "unknown"

    logger.info(
        "Request start: %s %s from %s",
        request.method,
        request_path,
        client_ip,
    )

    try:
        response = await call_next(request)
    except Exception as error:
        _failure_count += 1
        _last_error = str(error)
        logger.exception(
            "Request failed: %s %s error=%s",
            request.method,
            request_path,
            error,
        )
        raise

    duration_ms = round((time.time() - start_time) * 1000, 2)
    memory = get_memory_usage()

    logger.info(
        "Request completed: %s %s status=%s duration_ms=%s rss_mb=%s",
        request.method,
        request_path,
        response.status_code,
        duration_ms,
        memory.get("rss_mb"),
    )

    return response


@app.on_event("startup")
async def load_models():
    global _models_loaded, _last_error

    logger.info("Startup: lightweight=%s", is_lightweight_mode())

    if is_lightweight_mode():
        _models_loaded = True
        logger.info("NLP service started in lightweight mode (TF-IDF + rule-based generation)")
        return

    try:
        from nlp_service.keyword_extractor import preload_keyword_models
        from nlp_service.question_generator import get_t5
        from nlp_service.sentence_ranker import get_model

        preload_keyword_models()
        get_model()
        get_t5()

        _models_loaded = True
        logger.info("All NLP models loaded successfully")
    except Exception as error:
        _models_loaded = False
        _last_error = str(error)
        logger.exception("Model loading failed")
        raise


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutdown: smart flashcard NLP service is stopping")


@app.get("/")
async def root() -> dict[str, Any]:
    return {
        "service": "smart-flashcard-nlp",
        "status": "ok",
        "mode": "lightweight" if is_lightweight_mode() else "full",
        "models_loaded": _models_loaded,
    }


@app.get("/health")
async def healthz() -> JSONResponse:
    memory = get_memory_usage()
    uptime_seconds = int((datetime.datetime.utcnow() - _startup_time).total_seconds())
    response = {
        "status": "healthy" if _models_loaded else "unhealthy",
        "models_loaded": _models_loaded,
        "mode": "lightweight" if is_lightweight_mode() else "full",
        "uptime_seconds": uptime_seconds,
        "request_count": _request_count,
        "failure_count": _failure_count,
        "last_error": _last_error,
        "memory": memory,
    }
    status_code = status.HTTP_200_OK if _models_loaded else status.HTTP_503_SERVICE_UNAVAILABLE
    return JSONResponse(status_code=status_code, content=response)


@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    global _failure_count, _last_error, _last_success_timestamp

    source_text = request.topic.strip() or request.text.strip()
    if len(source_text) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please provide a topic or study notes with at least 2 characters.",
        )

    if len(request.text) > MAX_INPUT_CHARACTERS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Study notes are too long. Please reduce input to {MAX_INPUT_CHARACTERS} characters.",
        )

    if not _models_loaded and not is_lightweight_mode():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="NLP models failed to load during startup. Check /health for diagnostics.",
        )

    try:
        cards = generate_flashcards_from_input(
            request.text,
            max_cards=request.max_cards,
            topic=request.topic,
        )
        if not cards:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Could not generate flashcards. Please provide more detailed study notes.",
            )

        _last_success_timestamp = datetime.datetime.utcnow()
        return GenerateResponse(flashcards=cards, count=len(cards))
    except HTTPException:
        raise
    except Exception as error:
        _failure_count += 1
        _last_error = str(error)
        logger.exception("Flashcard generation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="NLP processing error. Check service logs for details.",
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        log_level="info",
        workers=1,
        loop="asyncio",
        http="h11",
    )
