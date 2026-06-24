# NLP Service Troubleshooting

## Service Won't Start (Exits Immediately)

### Problem: Exit code 1
The service crashes on startup and exits immediately.

### Causes & Solutions

#### 1. Missing Dependencies
**Symptom**: `ModuleNotFoundError: No module named 'spacy'` or similar

**Fix**:
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

#### 2. Model Download Fails
**Symptom**: Connection timeouts, no model files downloaded

**Fix - Use Lightweight Mode**:
```bash
export NLP_LIGHTWEIGHT=1
python app.py
```

Or for Windows:
```powershell
$env:NLP_LIGHTWEIGHT=1
python app.py
```

#### 3. Insufficient Memory
**Symptom**: Process killed or Out of Memory error (especially on Render free tier)

**Fix - Enable Lightweight Mode**:
```bash
export NLP_LIGHTWEIGHT=1
python app.py
```

Lightweight mode uses:
- TF-IDF for keyword extraction (no transformer models)
- Rule-based question generation (no T5)
- ~150MB vs ~2GB memory usage

#### 4. Python Version Mismatch
**Symptom**: `SyntaxError` or incompatible package versions

**Fix**:
```bash
python --version  # Should be 3.9+
python -m venv .venv
.venv\Scripts\activate  # Windows
# or source .venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

#### 5. Port Already in Use
**Symptom**: `Address already in use` error

**Fix**:
```bash
# Windows - find process using port 8000
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000
```

---

## Debugging Steps

### 1. Check Imports
```bash
cd nlp-service
python -c "from app import app; print('OK')"
```

### 2. Test Models Loading
```bash
python -c "from nlp_service.keyword_extractor import preload_keyword_models; preload_keyword_models(); print('Keywords OK')"
python -c "from nlp_service.sentence_ranker import get_model; get_model(); print('Ranker OK')"
python -c "from nlp_service.question_generator import get_t5; get_t5(); print('T5 OK')"
```

### 3. Test NLP Pipeline
```bash
python -c "from nlp_service.pipeline import generate_flashcards_from_input; print(generate_flashcards_from_input('test', 1))"
```

### 4. Check Health Endpoint (while running)
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "models_loaded": true,
  "mode": "full",
  "uptime_seconds": 123,
  "request_count": 5,
  "failure_count": 0,
  "last_error": null,
  "memory": {"rss_mb": 1234.56}
}
```

---

## Running the Service

### Development (Full Mode with All Models)
```bash
export NLP_LIGHTWEIGHT=0
python app.py
```

### Production on Render (Lightweight Mode)
```bash
export NLP_LIGHTWEIGHT=1
export PYTHONUNBUFFERED=1
gunicorn -w 2 -b 0.0.0.0:8000 app:app
```

### With Docker
```bash
docker build -t nlp-service .
docker run -e NLP_LIGHTWEIGHT=1 -p 8000:8000 nlp-service
```

---

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `NLP_LIGHTWEIGHT` | `0` | Use lightweight TF-IDF mode (for memory-constrained environments) |
| `PYTHONUNBUFFERED` | `0` | Stream logs immediately (recommended for production) |
| `PORT` | `8000` | Port to listen on |

---

## Common Issues on Render

### Issue: Service starts then immediately stops
**Cause**: Model downloading times out or memory exceeded
**Solution**: Enable lightweight mode in Render environment variables:
```
NLP_LIGHTWEIGHT=1
PYTHONUNBUFFERED=1
```

### Issue: 503 Service Unavailable
**Cause**: Models not loaded (still downloading or failed)
**Solution**: Wait for first startup to complete, or use lightweight mode

### Issue: Memory usage exceeds 512MB
**Cause**: Full mode requires large models
**Solution**: Use lightweight mode (NLP_LIGHTWEIGHT=1)

---

## Performance Tips

- **Lightweight mode**: ~150MB RAM, ~500ms response time
- **Full mode**: ~2GB RAM, ~200ms response time
- **Model cache**: First request takes longer (downloads models)
- **Timeout on Render**: Set timeout to 300+ seconds for first deployment
