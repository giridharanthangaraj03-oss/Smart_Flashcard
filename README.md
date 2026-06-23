# Smart Flashcard Generator

Smart Flashcard Generator is a production-ready full-stack study tool that converts long-form notes into flashcards using local open-source NLP and transformer models. Students can authenticate, generate flashcard sets, review with spaced repetition, track progress, search saved sets, export cards to PDF, and inspect review history.

## Tech Stack

### Frontend
- React + Vite
- React Router
- Tailwind CSS
- Axios
- Chart.js
- jsPDF

### Backend
- Node.js
- Express.js
- MongoDB Atlas with Mongoose
- JWT authentication
- bcrypt password hashing

### Local AI / NLP
- FastAPI Python microservice
- spaCy
- NLTK
- scikit-learn TF-IDF
- sentence-transformers (`all-MiniLM-L6-v2`)
- Hugging Face Transformers (`t5-small`)

## Project Structure

```text
frontend/
  src/
    components/
    context/
    pages/
    services/
    utils/
backend/
  config/
  controllers/
  middleware/
  models/
  routes/
  services/
nlp-service/
  nlp_service/
```

## Features

- Signup and login with JWT authentication
- Protected dashboard, create, review, and profile pages
- AI flashcard generation from notes
- Spaced repetition review with weighted card ordering
- Search and sort flashcard sets
- Dark mode
- PDF export
- Progress charts
- Review history

## Installation

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run server
```

### NLP Service

```bash
cd nlp-service
python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
python app.py
```

On first run, Hugging Face models (`dslim/bert-base-NER`, `t5-small`, `all-MiniLM-L6-v2`) are downloaded automatically.

If you see a `SentencePiece` error for T5, install it explicitly:

```bash
pip install sentencepiece protobuf
```

Then restart the NLP service.

The backend expects the NLP service at `http://localhost:8000`.

### Deploy NLP Service on Render

Render uses **Python 3.14** by default. Use the versions in `requirements.txt` — they install from prebuilt wheels (no Rust/C++ compile step).

1. Create a **Web Service** with `Root Directory` set to `nlp-service`.
2. **Build Command:**
   ```bash
   pip install --upgrade pip && pip install --no-cache-dir --prefer-binary -r requirements.txt
   ```
3. **Start Command:**
   ```bash
   uvicorn app:app --host 0.0.0.0 --port $PORT
   ```
4. Do **not** run `python -m spacy download` — spaCy was removed.

If the build still fails on Python 3.14, set **Environment Variable** `PYTHON_VERSION` to `3.12.8` in Render and redeploy.

You can also deploy from `nlp-service/render.yaml`.

## Environment Variables

### Frontend

```env
VITE_API_URL=http://localhost:5000/api
```

### Backend

**Recommended Atlas format:**

```env
MONGO_USER=your_db_user
MONGO_PASSWORD=your_db_password
MONGO_CLUSTER=cluster0.xxxxx.mongodb.net
MONGO_DB_NAME=smart-flashcards
JWT_SECRET=
JWT_EXPIRE=7d
PORT=5000
NLP_SERVICE_URL=http://localhost:8000
FRONTEND_URL=http://localhost:5173
```

Or use a full URI:

```env
MONGO_URI=mongodb+srv://your_db_user:your_db_password@cluster0.xxxxx.mongodb.net/smart-flashcards?retryWrites=true&w=majority&authSource=admin
```

### MongoDB Atlas Setup

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a database user with username and password.
3. In **Network Access**, allow your IP (or `0.0.0.0/0` for development).
4. Click **Connect** → **Drivers** → copy the `mongodb+srv://` connection string.
5. Replace `<password>` with your database user password.
6. Set the database name in the URI path, for example `/smart-flashcards`.
7. Paste the final value into `backend/.env` as `MONGO_URI`.

Test the connection:

```bash
cd backend
npm run test:mongo
```

If successful, start the API:

```bash
npm run server
```

Then verify `GET http://localhost:5000/api/health` shows `"database": { "status": "connected" }`.

## API Endpoints

### Authentication
- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/auth/profile`

### Flashcards
- `POST /api/flashcards/generate`
- `GET /api/flashcards`
- `GET /api/flashcards/:id`
- `DELETE /api/flashcards/:id`

### Review
- `PUT /api/review/:cardId`
- `GET /api/review/history/:setId`

## AI / NLP Explanation

### 1. Keyword Extraction
The Python NLP service first cleans the notes, then uses spaCy noun chunks and named entities to identify concepts such as definitions, people, places, organizations, and domain-specific phrases.

### 2. TF-IDF
TF-IDF scoring highlights terms and phrases that are especially important within the submitted notes. This helps surface high-value concepts rather than relying on raw sentence splitting.

### 3. Sentence Ranking
`sentence-transformers` generates embeddings for the extracted concept summary and for each candidate sentence. Cosine similarity is used to score which sentences are most relevant to the important concepts.

### 4. Question Generation
The service prompts the local `t5-small` model with:

```text
Generate a question from: [important sentence]
```

The generated question is validated and a fallback rule-based question is used if the model output is too weak.

### 5. Answer Extraction
Answers are built from the ranked sentence and refined around the strongest keyword/entity spans so each card has a concise answer.

### 6. Spaced Repetition
- If the student clicks **Known**:
  - `knownCount += 1`
  - review interval becomes 3, 7, 14, then 30 days
- If the student clicks **Not Known**:
  - `notKnownCount += 1`
  - `nextReviewDate` becomes tomorrow

Cards are prioritized with:

```text
weight = (notKnownCount + 1) / (knownCount + 1)
```

Higher-weight cards appear earlier in review.

## Deployment

### Frontend on Vercel
- Root directory: `frontend`
- Build command: `npm run build`
- Output directory: `dist`
- Set `VITE_API_URL` to the deployed backend URL plus `/api`

### Backend on Render
- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`
- Set `MONGO_URI`, `JWT_SECRET`, `NLP_SERVICE_URL`, and `FRONTEND_URL`

### NLP Service
For best results, run the NLP service separately wherever Python model dependencies are supported. Free hosts can struggle with cold starts and model memory requirements, so local development is the most reliable environment.

## Deployment Links

- Frontend URL: add after Vercel deployment
- Backend URL: add after Render deployment

## Notes

- The app uses only open-source local models and no paid AI APIs.
- On first NLP-service startup, the required spaCy model and Hugging Face weights may take time to download.
