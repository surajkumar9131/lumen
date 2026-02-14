# Lumen Backend

AI-powered "Second Brain" API for physical book lovers. Transforms book snippets into searchable, AI-synthesized digital assets.

## Features

- **Books** – Cover/metadata ingestion via Google Books API
- **Snippets** – OCR from images (Google Vision), storage, vector indexing
- **Search** – Keyword + semantic (Pinecone) search across snippets
- **AI Synthesis** – 3-point summaries + cognitive connections (Gemini 1.5 Flash)
- **Export** – Markdown, Notion, Obsidian formats

## Tech Stack

| Component   | Technology            |
|------------|------------------------|
| Runtime    | Node.js 18+            |
| Framework  | Express + TypeScript   |
| Auth       | Firebase Auth          |
| Database   | Firestore              |
| Storage    | Firebase Storage       |
| OCR        | Google Cloud Vision    |
| Embeddings | Gemini text-embedding  |
| Vector DB  | Pinecone               |
| AI         | Gemini 1.5 Flash       |

## Setup

```bash
# Local: authenticate with ADC (no JSON keys)
gcloud auth application-default login

cp .env.example .env
# Edit .env: FIREBASE_PROJECT_ID, FIREBASE_STORAGE_BUCKET, GEMINI_API_KEY
npm install
npm run dev
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 3000) |
| `FIREBASE_PROJECT_ID` | Yes | Firebase project ID |
| `FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage bucket |
| `GEMINI_API_KEY` | Yes | Google AI API key (summaries + embeddings) |
| `PINECONE_API_KEY` | No | Pinecone API key (semantic search) |
| `PINECONE_INDEX_NAME` | No | Index name (default: lumen-snippets) |

**Auth:** Application Default Credentials only. No `FIREBASE_PRIVATE_KEY` or JSON keys.  
- **Local:** `gcloud auth application-default login`  
- **Cloud Run:** Grant default SA: Firebase Admin, Firestore Admin, Storage Admin. Vision & TTS use same ADC.

## API Endpoints

All `/api/*` routes require `Authorization: Bearer <Firebase ID token>`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check (no auth) |
| GET | `/api-docs` | Swagger UI (no auth) |
| POST | `/api/auth/signup` | Create user (email, password) – returns customToken |
| GET | `/api/auth/me` | Get current user (requires auth) |
| POST | `/api/books` | Create book from cover image (multipart) |
| POST | `/api/books/lookup` | Lookup book by ISBN/title+author |
| GET | `/api/books` | List user's books |
| GET | `/api/books/:id` | Get single book |
| POST | `/api/snippets` | Create snippet (text or image + bookId) |
| GET | `/api/snippets` | List snippets (?bookId=) |
| PATCH | `/api/snippets/:id` | Update snippet text |
| DELETE | `/api/snippets/:id` | Delete snippet |
| GET | `/api/search?q=` | Search snippets (keyword + semantic) |
| GET | `/api/export?format=` | Export to markdown/notion/obsidian |
| POST | `/api/ai/summarize` | Mirror synthesis (summary + connections) |
| POST | `/api/ai/tts` | Neural TTS (audio from summary/snippets, 3 voices) |

## Firestore Indexes

Create a composite index for filtered snippet listing:

- Collection: `snippets`
- Fields: `userId` (Asc), `bookId` (Asc), `createdAt` (Desc)

Run `npx firebase firestore:indexes` or create via Firebase Console.

## Pinecone Index

Create an index with:

- Dimensions: `768` (Gemini text-embedding-004)
- Metric: `cosine`
- Enable metadata filtering for `userId`
