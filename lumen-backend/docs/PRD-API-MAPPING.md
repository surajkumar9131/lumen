# Lumen PRD → API Mapping & Flow

This document maps PRD requirements to backend APIs, explains the end-to-end flow, and identifies coverage gaps.

---

## 1. Feature Coverage Matrix

| PRD Feature | Priority | API / Flow | Status |
|-------------|----------|------------|--------|
| **3.1 Book Cover Recognition** | P0 | `POST /api/books` (cover image), `POST /api/books/lookup` (manual fallback) | ✅ Covered |
| **3.2 Smart Crop & OCR** | P0 | `POST /api/snippets` (image → OCR), client handles crop/dewarp | ⚠️ Partial* |
| **3.3 AI Personal Summarizer** | P1 | `POST /api/ai/summarize` | ✅ Covered |
| **3.4 Audio Insight (TTS)** | P1 | `POST /api/ai/tts` | ✅ Covered |
| **Refined: Semantic Search** | P0 | `GET /api/search` | ✅ Covered |
| **Refined: Export to Second Brain** | P1 | `GET /api/export` | ✅ Covered |

\* OCR is server-side; dewarp/deskew is recommended on client (OpenCV) before upload. See Section 4.

---

## 2. API Responsibilities

### 2.1 Books API (`/api/books`)

| Endpoint | PRD Mapping | What It Does |
|----------|-------------|--------------|
| `POST /api/books` | 3.1 Library Management | Accepts cover image (multipart), uploads to Firebase Storage, fetches metadata via Google Books API, creates book record. **90% mainstream books** → lookup by ISBN/cover. |
| `POST /api/books/lookup` | 3.1 Manual Entry Fallback | Lookup by ISBN, title, or author when cover recognition fails (indie/rare books). Creates book without image. |
| `GET /api/books` | — | List all books in user library. |
| `GET /api/books/:id` | — | Get single book details. |

### 2.2 Snippets API (`/api/snippets`)

| Endpoint | PRD Mapping | What It Does |
|----------|-------------|--------------|
| `POST /api/snippets` | 3.2 Snippet Capture & OCR | Accepts **image** (OCR path) or **text** (manual entry). Uses Google Vision for OCR. Saves as editable text under `User_ID/Book_ID/Snippet_ID`. Vector index for semantic search. |
| `GET /api/snippets` | — | List snippets (optional `?bookId=` filter). |
| `PATCH /api/snippets/:id` | 3.2 Editable Markdown | Update snippet text (OCR corrections). |
| `DELETE /api/snippets/:id` | — | Remove snippet. |

### 2.3 Search API (`/api/search`)

| Endpoint | PRD Mapping | What It Does |
|----------|-------------|--------------|
| `GET /api/search?q=&limit=` | Refined: Semantic Search | Keyword search (Firestore) + semantic/fuzzy search (Pinecone). Finds by meaning, not just exact words. |

### 2.4 Export API (`/api/export`)

| Endpoint | PRD Mapping | What It Does |
|----------|-------------|--------------|
| `GET /api/export?format=&bookId=` | Refined: Second Brain Sync | Export snippets to Markdown, Notion, or Obsidian. Preserves formatting and metadata (page #, book title). |

### 2.5 AI API (`/api/ai`)

| Endpoint | PRD Mapping | What It Does |
|----------|-------------|--------------|
| `POST /api/ai/summarize` | 3.3 Synthesis Engine | Processes **only user-captured snippets** (not whole book). Returns: 1) **3-point executive summary**, 2) **Thematic Map** (cognitive connections linking ideas across books/chapters). |
| `POST /api/ai/tts` | 3.4 Audio Insight | Converts summary or snippets to high-quality .mp3. **3 narrator voices**: `academic`, `conversational`, `calming`. Input: raw text, or `source: summary/snippets` + optional bookId/snippetIds. Output: signed audio URL. |

---

## 3. End-to-End Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                           LUMEN FLOW: Physical → Digital                             │
└─────────────────────────────────────────────────────────────────────────────────────┘

PHASE 1: INGESTION (Client)
┌──────────────┐     ┌─────────────────────────┐     ┌──────────────┐
│ Camera       │ ──► │ Pre-process (optional)   │ ──► │ Upload       │
│ • Cover snap │     │ • Greyscale, Deskew,     │     │ to backend   │
│ • Page snap  │     │   Dewarp (spine fix)     │     │              │
└──────────────┘     └─────────────────────────┘     └──────┬───────┘
                                                             │
PHASE 2: PROCESSING (Backend)                                │
                                                             ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  POST /api/books (cover)          POST /api/snippets (image)                          │
│         │                                    │                                        │
│         ▼                                    ▼                                        │
│  • Firebase Storage                • Google Vision OCR                                │
│  • Google Books lookup             • Firestore (User/Book/Snippet)                    │
│  • Firestore book record           • Pinecone vector index                            │
└─────────────────────────────────────────────────────────────────────────────────────┘

PHASE 3: SYNTHESIS (Backend)
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  GET /api/search?q=                POST /api/ai/summarize      GET /api/export       │
│         │                                    │                          │            │
│         ▼                                    ▼                          ▼            │
│  • Keyword (Firestore)              • Gemini 1.5 Flash          • Markdown/Notion/    │
│  • Semantic (Pinecone)              • 3-point summary           • Obsidian format     │
│                                    • Cognitive connections                           │
└─────────────────────────────────────────────────────────────────────────────────────┘

PHASE 3b: AUDIO (Backend)
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  POST /api/ai/tts                                                                     │
│         │                                                                             │
│         ▼                                                                             │
│  • Input: text, or source=summary|snippets + bookId/snippetIds                        │
│  • Voice: academic | conversational | calming                                         │
│  • Google Cloud TTS → .mp3 → Firebase Storage → Signed URL                            │
└─────────────────────────────────────────────────────────────────────────────────────┘

PHASE 4: CONSUMPTION (Client)
┌──────────────┐     ┌──────────────┐     ┌──────────────────────┐
│ Search UI    │     │ Summary UI   │     │ Export / Second Brain │
│ • Keyword    │     │ • Digest     │     │ • Notion, Obsidian    │
│ • Semantic   │     │ • Connections│     │ • Audio (TTS)         │
└──────────────┘     └──────────────┘     └──────────────────────┘
```

### 3.1 User Flow by Persona

| Persona | Flow | APIs Used |
|---------|------|-----------|
| **Alex (Researcher)** | Capture quotes → Export to Notion | `POST /api/books`, `POST /api/snippets`, `GET /api/export?format=notion` |
| **Sam (Growth Reader)** | Weekly digest of highlights | `POST /api/ai/summarize`, `GET /api/snippets`, `GET /api/search` |
| **Jordan (Busy Professional)** | Listen to notes as audio | `POST /api/ai/tts` (source: summary, voice: calming) |

---

## 4. Coverage Gaps & Recommendations

### 4.1 Not Implemented

| Gap | PRD Reference | Recommendation |
|-----|---------------|----------------|
| **Dewarp/Deskew** | 3.2 spine unwarp, 4. Ingestion pipeline | Implement on **client** (OpenCV/ML Kit) before upload for best latency. Optionally add server-side preprocessing if client can’t. |

### 4.2 Partially Covered

| Item | Current State | Notes |
|------|---------------|-------|
| **90% mainstream books** | Google Books API | Depends on API coverage; `lookup` provides manual fallback. |
| **>98% OCR accuracy** | Google Vision | Meets requirement; dewarp on client improves accuracy on curved pages. |
| **< 2s OCR latency** | Google Vision | Typically 1–2s; ensure image is preprocessed (resize, crop) before upload. |
| **Offline mode** | Backend always online | Client should queue photos and sync when online; backend supports async processing. |

---

## 5. Data Flow Summary

| Stage | Input | Backend Action | Output |
|-------|-------|----------------|--------|
| Book creation | Cover image | Store → Google Books → Firestore | Book record |
| Snippet capture | Page image or text | Vision OCR → Firestore → Pinecone | Snippet record |
| Search | Query string | Firestore keyword + Pinecone semantic | Ranked snippets |
| Summarize | bookId / snippetIds (optional) | Gemini on user snippets only | Summary + connections |
| Export | format, bookId (optional) | Format snippets | Markdown/Notion/Obsidian |
| TTS | text, or source+bookId/snippetIds | Google Cloud TTS → Firebase Storage | Signed audio URL (.mp3) |

---

## 6. Competitive Advantage Alignment

| PRD Differentiator | How APIs Support It |
|--------------------|---------------------|
| **Personalized** | `POST /api/ai/summarize` uses only user-captured snippets, not whole book. |
| **Physical-first** | Cover + page capture via `/api/books` and `/api/snippets`; client handles spine/crop ergonomics. |
| **Multimodal (Photo → Text → Audio)** | Photo → OCR (`/api/snippets`), Text → Summary (`/api/ai/summarize`), Audio → TTS (`/api/ai/tts`). |
