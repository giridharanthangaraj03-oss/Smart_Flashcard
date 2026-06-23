from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from nlp_service.pipeline import generate_flashcards_from_input

app = FastAPI(title="Smart Flashcard NLP Service", version="1.0.0")

_models_loaded = False


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


@app.on_event("startup")
async def load_models():
    global _models_loaded
    try:
        from nlp_service.keyword_extractor import preload_keyword_models
        from nlp_service.sentence_ranker import get_model
        from nlp_service.question_generator import get_t5
        preload_keyword_models()
        get_model()
        get_t5()
        _models_loaded = True
        print("All NLP models loaded successfully")
    except Exception as e:
        print(f"Warning: Model loading issue: {e}")
        _models_loaded = False


@app.get("/health")
async def health():
    return {
        "status": "healthy" if _models_loaded else "degraded",
        "models_loaded": _models_loaded,
    }


@app.post("/generate", response_model=GenerateResponse)
async def generate(request: GenerateRequest):
    try:
        source_text = request.topic.strip() or request.text.strip()
        if len(source_text) < 2:
            raise HTTPException(
                status_code=400,
                detail="Please provide a topic or study notes with at least 2 characters.",
            )

        cards = generate_flashcards_from_input(
            request.text,
            max_cards=request.max_cards,
            topic=request.topic,
        )
        if not cards:
            raise HTTPException(
                status_code=400,
                detail="Could not generate flashcards. Please provide more detailed study notes.",
            )
        return GenerateResponse(flashcards=cards, count=len(cards))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"NLP processing error: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
