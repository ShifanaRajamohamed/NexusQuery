<div align="center">

# 🔮 NexusQuery AI
### Enterprise Knowledge Discovery Platform

**An intelligent, AI-powered knowledge operating system for modern organizations.**  
Built with FastAPI · React · FAISS · RAG · HuggingFace Transformers

[![Build](https://img.shields.io/badge/build-passing-brightgreen?style=flat-square)](.)
[![Backend](https://img.shields.io/badge/backend-FastAPI%201.0-009688?style=flat-square)](.)
[![Frontend](https://img.shields.io/badge/frontend-React%2019%20%2B%20Vite-61DAFB?style=flat-square)](.)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](.)
[![Python](https://img.shields.io/badge/python-3.12-3776AB?style=flat-square)](.)
[![TypeScript](https://img.shields.io/badge/typescript-5.2-3178C6?style=flat-square)](.)

</div>

---

## 📖 Table of Contents

1. [Project Overview](#-project-overview)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [System Architecture](#-system-architecture)
5. [Project Structure](#-project-structure)
6. [Database Schema](#-database-schema)
7. [API Reference](#-api-reference)
8. [Prerequisites](#-prerequisites)
9. [Installation & Setup](#-installation--setup)
   - [Option A — Local Development](#option-a--local-development)
   - [Option B — Docker (Full Stack)](#option-b--docker-full-stack)
10. [Environment Variables](#-environment-variables)
11. [Running the Application](#-running-the-application)
12. [Default Credentials](#-default-credentials)
13. [Pages & Routes](#-pages--routes)
14. [AI Pipeline Deep Dive](#-ai-pipeline-deep-dive)
15. [Role-Based Access Control](#-role-based-access-control)
16. [Troubleshooting](#-troubleshooting)
17. [Contributing](#-contributing)

---

## 🌐 Project Overview

**NexusQuery AI** is a production-grade **Enterprise Knowledge Operating System** that enables organizations to centralize, index, and query knowledge from multiple sources — documents, GitHub repositories, Confluence wikis, and web pages — using state-of-the-art **Retrieval-Augmented Generation (RAG)**, **Hybrid Search (FAISS + BM25)**, and **Large Language Models**.

Think of NexusQuery AI as your organization's **intelligent search brain** — instead of employees digging through SharePoint folders, Slack history, or GitHub PRs, they ask a question in plain English and get a cited, accurate answer in seconds.

> Inspired by enterprise products like **Glean**, **Microsoft Copilot**, **Atlassian Intelligence**, and **Notion AI**.

---

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **RAG-Powered AI Chat** | Streaming AI answers with cited sources from your knowledge base |
| 🔍 **Hybrid Search** | FAISS vector search + BM25 lexical search with rank fusion |
| 📄 **Multi-Format Ingestion** | PDF, DOCX, PPTX, TXT, Web URLs |
| 🐙 **GitHub Integration** | Clone and index entire Git repositories with code-aware chunking |
| 📚 **Wiki/Confluence Query** | Scrape and index Confluence, Notion, or any HTML wiki page |
| 🛡️ **JWT Authentication** | Secure login, registration, refresh token rotation |
| 👥 **Role-Based Access Control** | Three-tier RBAC: Employee → Team Lead → Admin |
| 📊 **Analytics Dashboard** | Query trends, search coverage gaps, department breakdown |
| 🗞️ **Community Feed** | Internal knowledge posts with upvoting, bookmarking, comments |
| 📥 **Contribution Review** | Document contribution pipeline with Admin approval workflow |
| 🔔 **Notifications** | Real-time system and knowledge event notifications |
| 🌙 **Dark Mode UI** | Premium enterprise dark UI built with Tailwind CSS |

---

## 🛠️ Tech Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| **FastAPI** | ≥ 0.110 | REST API framework with OpenAPI docs |
| **SQLAlchemy** | ≥ 2.0 | ORM for database management |
| **PyMySQL** | ≥ 1.1 | MySQL driver (production) |
| **SQLite** | built-in | Database fallback for development |
| **PyJWT** | ≥ 2.8 | JWT access & refresh tokens (HS256) |
| **Passlib + bcrypt** | ≥ 1.7 | Password hashing |
| **FAISS-CPU** | ≥ 1.8 | High-performance vector similarity search |
| **rank_bm25** | ≥ 0.2 | BM25 sparse lexical retrieval |
| **sentence-transformers** | ≥ 2.5 | `all-MiniLM-L6-v2` text embeddings |
| **PyPDF** | ≥ 4.1 | PDF text extraction |
| **python-docx** | ≥ 1.1 | DOCX text extraction |
| **python-pptx** | ≥ 0.6 | PPTX text extraction |
| **BeautifulSoup4** | ≥ 4.12 | HTML scraping for wiki/web pages |
| **Uvicorn** | ≥ 0.28 | ASGI server |
| **OpenAI** | ≥ 1.14 | Optional LLM synthesis via GPT |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19 | UI component framework |
| **TypeScript** | 5.2 | Type-safe JavaScript |
| **Vite** | 5.2 | Ultra-fast build tool and dev server |
| **Tailwind CSS** | 3.4 | Utility-first CSS framework |
| **React Router DOM** | 6.22 | Client-side routing with protected routes |
| **Axios** | 1.6 | HTTP client with JWT interceptors |
| **Framer Motion** | 11 | Smooth page animations |
| **Recharts** | 2.12 | Analytics charts and graphs |
| **Lucide React** | 0.363 | Consistent icon library |

### Infrastructure / DevOps

| Technology | Purpose |
|------------|---------|
| **Docker** | Container images for backend and frontend |
| **Docker Compose** | Multi-service orchestration (DB + Backend + Frontend) |
| **MySQL 8.0** | Production-grade relational database |
| **FAISS Index** | Persistent vector index stored on disk |

---

## 🏗️ System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                     BROWSER (React SPA)                     │
│  Login · Dashboard · KnowledgeHub · GitQuery · WikiQuery   │
│  AIAssistant · Feed · Contribute · Analytics · Admin       │
└────────────────┬───────────────────────────────────────────┘
                 │  REST API / SSE Streaming
                 ▼
┌────────────────────────────────────────────────────────────┐
│              FastAPI Backend  (port 8000)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │   Auth   │ │Knowledge │ │   Git    │ │    Wiki      │  │
│  │  Router  │ │  Router  │ │  Router  │ │   Router     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐  │
│  │   Chat   │ │   Feed   │ │Analytics │ │    Admin     │  │
│  │  Router  │ │  Router  │ │  Router  │ │   Router     │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              AI Processing Pipeline                  │   │
│  │  Document  →  Chunk  →  Embed  →  FAISS + BM25     │   │
│  │  Ingestion    (500t)    (MiniLM)   Hybrid Search    │   │
│  └─────────────────────────────────────────────────────┘   │
└──────┬──────────────────────────┬──────────────────────────┘
       │                          │
       ▼                          ▼
┌─────────────┐        ┌──────────────────────┐
│  MySQL/     │        │  FAISS Vector Index  │
│  SQLite DB  │        │  (disk: /data/)      │
│             │        │  + BM25 (in-memory)  │
└─────────────┘        └──────────────────────┘
```

### RAG Pipeline Flow

```
User Query
    │
    ▼
Embed Query (MiniLM-L6-v2, dim=384)
    │
    ├──► FAISS Similarity Search  ──┐
    │                               ├──► Reciprocal Rank Fusion
    └──► BM25 Lexical Search  ──────┘
                                    │
                                    ▼
                         Top-K Chunks Retrieved
                                    │
                                    ▼
                    Prompt Assembly (Query + Context)
                                    │
                                    ▼
                     LLM Synthesis (Streaming SSE)
                                    │
                                    ▼
                     Answer + Citations + Confidence
```

---

## 📁 Project Structure

```
NexusQuery/
├── docker-compose.yml          # Full stack orchestration
│
├── backend/
│   ├── Dockerfile              # Python 3.12 slim image
│   ├── requirements.txt        # Python dependencies
│   ├── verify_backend.py       # Health check & verification script
│   └── app/
│       ├── main.py             # FastAPI app entry point, CORS, router registration
│       ├── config.py           # All environment settings (JWT, DB, AI model)
│       ├── database.py         # SQLAlchemy engine, session factory, DB fallback
│       ├── models.py           # All SQLAlchemy ORM models (10 tables)
│       ├── schemas.py          # Pydantic request/response schemas
│       ├── auth.py             # bcrypt hashing, JWT creation & verification
│       ├── pipeline.py         # AI ingestion: chunk → embed → FAISS index
│       ├── search.py           # Hybrid search: FAISS + BM25 + rank fusion
│       ├── gitquery.py         # GitHub repo cloning and code file indexing
│       ├── wikiquery.py        # Confluence/Wiki HTML scraping and indexing
│       └── routers/
│           ├── auth.py         # POST /register, /login, /refresh, /reset-password, GET /me
│           ├── dashboard.py    # GET /metrics, /activity
│           ├── knowledge.py    # POST /upload, /add-url; GET /search, /list, DELETE /delete
│           ├── git.py          # POST /add-repo; GET /list, /query
│           ├── wiki.py         # POST /add-source; GET /list, /query
│           ├── chat.py         # POST /query (SSE streaming RAG)
│           ├── contribute.py   # POST /submit; GET /pending; PATCH /review
│           ├── feed.py         # CRUD for posts, upvotes, bookmarks, comments
│           ├── notifications.py# GET /list; PATCH /mark-read
│           ├── analytics.py    # GET /overview, /trends, /coverage-gaps
│           └── admin.py        # User management, deactivation, audit logs
│
└── frontend/
    ├── Dockerfile              # Node 22 Alpine image
    ├── package.json            # NPM dependencies and scripts
    ├── vite.config.ts          # Vite bundler config
    ├── tailwind.config.js      # Tailwind design tokens
    ├── tsconfig.app.json       # TypeScript compiler options
    ├── index.html              # HTML entry point
    └── src/
        ├── main.tsx            # React DOM root
        ├── App.tsx             # Router, ProtectedRoute, layout wrapper
        ├── index.css           # Global styles, CSS variables, animations
        ├── context/
        │   └── AuthContext.tsx # JWT auth state, Axios instance, token refresh
        ├── components/
        │   ├── Sidebar.tsx     # Navigation sidebar with route links
        │   └── Header.tsx      # Top header with user info and notifications
        └── pages/
            ├── Login.tsx       # Login form with JWT auth
            ├── Register.tsx    # Registration with role/dept selection
            ├── Dashboard.tsx   # Global metrics, AI search, trending
            ├── KnowledgeHub.tsx# Document upload, URL indexing, hybrid search
            ├── GitQuery.tsx    # GitHub repo management and NL query
            ├── WikiQuery.tsx   # Confluence/wiki indexing and query
            ├── AIAssistant.tsx # Full SSE streaming chat with citations
            ├── Contribute.tsx  # Document contribution submission & review
            ├── Feed.tsx        # Community posts, upvotes, bookmarks
            ├── Analytics.tsx   # Charts: query trends, coverage, dept breakdown
            ├── AdminConsole.tsx# User management, RBAC, audit logs
            └── Settings.tsx    # Profile, password, notification preferences
```

---

## 🗄️ Database Schema

NexusQuery uses **10 relational tables** managed by SQLAlchemy ORM:

```
users
├── id, username, email, hashed_password
├── role (Employee | Team Lead | Admin)
├── department, is_active, created_at
│
knowledge_items          ← Indexed documents / URLs
├── id, title, type (file | git | wiki | web)
├── file_path, source_url, department, tags
├── status (Pending | Approved | Rejected)
├── permission (Public | Department | Admin)
└── owner_id → users.id
│
document_chunks          ← RAG chunked text with vector IDs
├── id, document_id → knowledge_items.id
├── content, summary, keywords, topic
├── named_entities, faiss_id
│
git_repositories         ← Indexed GitHub repos
├── id, name, clone_url, status, last_synced
│
wiki_sources             ← Indexed wiki/confluence URLs
├── id, title, type, source_url, status, last_synced
│
contributions            ← Community submission queue
├── id, title, item_type, contributor_id, reviewer_id
├── status (Pending | Approved | Rejected)
│
feed_posts               ← Community knowledge posts
├── id, title, content, type (Post | Announcement | Question)
├── author_id, upvotes, bookmarks, tags
│
comments                 ← Post comment threads
│
feed_votes               ← Upvote/downvote tracking (dedup)
│
audit_logs               ← Full action audit trail
├── user_id, action, target_type, target_id, details, timestamp
│
search_logs              ← Query history for analytics
├── user_id, query, answer, response_time_ms, confidence_score, failed_search
│
notifications            ← Per-user notification inbox
└── user_id, title, message, type, is_read
```

---

## 📡 API Reference

All API endpoints are available at **`http://localhost:8000`**  
Interactive Swagger UI: **`http://localhost:8000/docs`**  
ReDoc: **`http://localhost:8000/redoc`**

### 🔐 Authentication — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | None | Register a new user |
| `POST` | `/api/auth/login` | None | Login, receive JWT access + refresh token |
| `POST` | `/api/auth/refresh` | None | Refresh access token using refresh token |
| `POST` | `/api/auth/reset-password` | None | Reset password by email |
| `GET` | `/api/auth/me` | Bearer | Get current authenticated user profile |

**Login Request Body:**
```json
{
  "username_or_email": "admin@nexusquery.ai",
  "password": "admin123"
}
```

**Login Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "eyJ...",
  "token_type": "bearer"
}
```

---

### 📊 Dashboard — `/api/dashboard`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/dashboard/metrics` | Bearer | Global platform metrics |
| `GET` | `/api/dashboard/activity` | Bearer | Recent platform activity feed |

---

### 📄 Knowledge Hub — `/api/knowledge`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/knowledge/upload` | Bearer | Upload PDF/DOCX/PPTX/TXT file for indexing |
| `POST` | `/api/knowledge/add-url` | Bearer | Index a web URL |
| `GET` | `/api/knowledge/search` | Bearer | Hybrid search (`?q=query&top_k=5`) |
| `GET` | `/api/knowledge/list` | Bearer | List all indexed knowledge items |
| `DELETE` | `/api/knowledge/delete/{id}` | Bearer | Remove a document and its chunks |

**Upload Request:** `multipart/form-data` with fields: `file`, `title`, `department`, `tags`, `permission`

---

### 🐙 Git Query — `/api/git`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/git/add-repo` | Bearer | Clone and index a GitHub repository |
| `GET` | `/api/git/list` | Bearer | List all connected repositories |
| `POST` | `/api/git/query` | Bearer | Natural language query over a repo |

**Add Repo Body:**
```json
{
  "name": "my-backend",
  "clone_url": "https://github.com/username/repo.git"
}
```

---

### 📚 Wiki Query — `/api/wiki`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/wiki/add-source` | Bearer | Scrape and index a wiki/Confluence URL |
| `GET` | `/api/wiki/list` | Bearer | List all wiki sources |
| `POST` | `/api/wiki/query` | Bearer | Natural language query over wiki sources |

---

### 🤖 AI Chat — `/api/chat`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/chat/query` | Bearer | RAG query with SSE streaming response |

**Request Body:**
```json
{
  "query": "How do I deploy the application?",
  "conversation_history": [],
  "top_k": 5
}
```

**SSE Response Events:**
```
data: {"type": "chunk", "content": "To deploy..."}
data: {"type": "citations", "citations": [...]}
data: {"type": "done", "confidence_score": 0.87}
```

---

### 📥 Contributions — `/api/contribute`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/contribute/submit` | Bearer | Submit a document for admin review |
| `GET` | `/api/contribute/my` | Bearer | Get your own submissions |
| `GET` | `/api/contribute/pending` | Admin | Get all pending submissions |
| `PATCH` | `/api/contribute/review/{id}` | Admin | Approve or reject a submission |

---

### 🗞️ Feed — `/api/feed`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/feed/posts` | Bearer | Create a new community post |
| `GET` | `/api/feed/posts` | Bearer | List posts (filter: trending, bookmarks) |
| `POST` | `/api/feed/posts/{id}/upvote` | Bearer | Toggle upvote on a post |
| `POST` | `/api/feed/posts/{id}/bookmark` | Bearer | Toggle bookmark on a post |
| `POST` | `/api/feed/posts/{id}/comments` | Bearer | Add a comment |
| `GET` | `/api/feed/posts/{id}/comments` | Bearer | Get comments for a post |

---

### 📈 Analytics — `/api/analytics`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/analytics/overview` | Bearer | Total queries, success rate, avg confidence |
| `GET` | `/api/analytics/trends` | Bearer | Query volume by date (last 30 days) |
| `GET` | `/api/analytics/coverage-gaps` | Bearer | Top unanswered/failed queries |

---

### 🛡️ Admin Console — `/api/admin`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/admin/users` | Admin | List all users |
| `PATCH` | `/api/admin/users/{id}/toggle-active` | Admin | Activate/deactivate a user |
| `PATCH` | `/api/admin/users/{id}/role` | Admin | Update user role |
| `GET` | `/api/admin/audit-logs` | Admin | Full audit trail |
| `GET` | `/api/admin/system-health` | Admin | DB, FAISS, model status |

---

## ✅ Prerequisites

Before running NexusQuery AI, ensure you have:

| Requirement | Minimum Version | Notes |
|-------------|----------------|-------|
| **Python** | 3.10+ | 3.12 recommended |
| **Node.js** | 18+ | 22 LTS recommended |
| **npm** | 9+ | Included with Node.js |
| **Git** | 2.x | Required for GitQuery feature |
| **Docker** *(optional)* | 24+ | For Docker deployment |
| **Docker Compose** *(optional)* | 2.x | For full-stack container setup |
| **MySQL** *(optional)* | 8.0 | SQLite is used as fallback |

---

## ⚙️ Installation & Setup

### Option A — Local Development

#### Step 1 — Clone the Repository

```bash
git clone https://github.com/yourorg/nexusquery-ai.git
cd nexusquery-ai
```

#### Step 2 — Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate

# Install all dependencies
pip install -r requirements.txt
```

> **Note:** The first run will download the `all-MiniLM-L6-v2` embedding model (~90MB). This is automatic and happens once.

#### Step 3 — Frontend Setup

```bash
cd frontend

# Install Node dependencies (use --legacy-peer-deps for React 19 compatibility)
npm install --legacy-peer-deps
```

---

### Option B — Docker (Full Stack)

```bash
# From the project root
docker-compose up --build
```

This will spin up **3 containers**:

| Container | Image | Port | Service |
|-----------|-------|------|---------|
| `nexus_db` | `mysql:8.0` | `3306` | MySQL database |
| `nexus_backend` | Built from `./backend/Dockerfile` | `8000` | FastAPI API |
| `nexus_frontend` | Built from `./frontend/Dockerfile` | `3000` | React frontend |

> The backend waits for MySQL to pass a health check before starting.

---

## 🔧 Environment Variables

All configuration is set via environment variables with sensible defaults for local development.

### Backend (`backend/app/config.py`)

| Variable | Default | Description |
|----------|---------|-------------|
| `JWT_SECRET_KEY` | `nexus-query-ai-super-secret-key-...` | JWT signing secret — **change in production!** |
| `MYSQL_HOST` | `localhost` | MySQL host (use `db` in Docker) |
| `MYSQL_PORT` | `3306` | MySQL port |
| `MYSQL_USER` | `nexus_user` | MySQL username |
| `MYSQL_PASSWORD` | `nexus_password` | MySQL password |
| `MYSQL_DB` | `nexusquery_db` | MySQL database name |
| `EMBEDDING_MODEL_NAME` | `all-MiniLM-L6-v2` | HuggingFace embedding model |
| `CHUNK_SIZE` | `500` | Text chunk size in tokens |
| `CHUNK_OVERLAP` | `100` | Overlap between consecutive chunks |
| `OPENAI_API_KEY` | *(empty)* | Optional — enables OpenAI GPT synthesis |
| `DEFAULT_ADMIN_EMAIL` | `admin@nexusquery.ai` | Bootstrap admin email |
| `DEFAULT_ADMIN_PASSWORD` | `admin123` | Bootstrap admin password |

> If MySQL is unavailable, the backend **automatically falls back to SQLite** at `backend/data/nexusquery.db`.

---

## 🚀 Running the Application

### Start the Backend

```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

- API is available at: **http://localhost:8000**
- Swagger UI: **http://localhost:8000/docs**
- ReDoc: **http://localhost:8000/redoc**

### Start the Frontend

```bash
cd frontend
npm run dev
```

- App is available at: **http://localhost:5173**

### Build for Production

```bash
cd frontend
npm run build
# Output is in frontend/dist/
```

### Verify Backend Health

```bash
cd backend
python verify_backend.py
```

This script tests all API endpoints and verifies the AI pipeline is operational.

---

## 🔑 Default Credentials

The backend **automatically creates a default Admin user** on first launch:

| Field | Value |
|-------|-------|
| Email | `admin@nexusquery.ai` |
| Password | `admin123` |
| Role | Admin |
| Department | Engineering |

> ⚠️ **Security Warning:** Change the default admin password and `JWT_SECRET_KEY` before any production deployment.

---

## 🗺️ Pages & Routes

| Route | Page | Auth Required | Role |
|-------|------|---------------|------|
| `/login` | Login | No | — |
| `/register` | Register | No | — |
| `/` | Dashboard | Yes | Any |
| `/knowledge` | Knowledge Hub | Yes | Any |
| `/gitquery` | Git Query | Yes | Any |
| `/wikiquery` | Wiki Query | Yes | Any |
| `/chat` | AI Assistant | Yes | Any |
| `/contribute` | Contribute | Yes | Any |
| `/feed` | Community Feed | Yes | Any |
| `/trending` | Trending Posts | Yes | Any |
| `/bookmarks` | Saved Posts | Yes | Any |
| `/analytics` | Analytics | Yes | Any |
| `/admin` | Admin Console | Yes | **Admin only** |
| `/settings` | Settings | Yes | Any |

---

## 🧠 AI Pipeline Deep Dive

### Document Ingestion

When a document is uploaded, the following processing steps occur:

1. **Text Extraction** — format-specific extraction (PyPDF, python-docx, python-pptx, BeautifulSoup)
2. **Chunking** — text split into 500-token chunks with 100-token overlap for context continuity
3. **Embedding** — each chunk encoded into a 384-dimensional float32 vector using `all-MiniLM-L6-v2`
4. **FAISS Indexing** — vectors stored in a flat L2 FAISS index, persisted to disk at `backend/data/faiss_index`
5. **BM25 Indexing** — tokenized chunk text registered with BM25 for lexical retrieval
6. **DB Storage** — chunk content, FAISS ID, keywords, and metadata stored in `document_chunks` table

### Retrieval (Hybrid Search)

For every user query:

1. Query is embedded using the same MiniLM model
2. **FAISS** retrieves top-K semantically similar chunks
3. **BM25** retrieves top-K lexically matching chunks
4. Results merged using **Reciprocal Rank Fusion (RRF)** for balanced re-ranking
5. Final top-K chunks passed as context to the LLM

### Answer Generation

1. System prompt assembled with organization context
2. Retrieved chunks injected as numbered citations
3. LLM generates a streaming answer via **Server-Sent Events (SSE)**
4. Response includes: answer text, source citations, confidence score, related questions

### Fallback Mode

If `sentence-transformers` fails to load, the pipeline switches to a **deterministic mock embedding generator** — ensuring the system stays operational even without GPU/model access.

---

## 👥 Role-Based Access Control

NexusQuery implements a **3-tier RBAC** system:

| Role | Permissions |
|------|-------------|
| **Employee** | Search, query AI, upload documents, view feed, contribute |
| **Team Lead** | Everything above + view department analytics |
| **Admin** | Everything above + manage users, review contributions, access Admin Console, view all audit logs |

Roles are enforced:
- **Backend**: FastAPI dependency injection (`get_current_active_user`, role checks in routers)
- **Frontend**: `ProtectedRoute` component redirects unauthorized users

---

## 🔧 Troubleshooting

### `npm install` fails with peer dependency errors
```bash
npm install --legacy-peer-deps
```

### Backend fails to start — database error
The backend automatically falls back to SQLite. Ensure the `backend/data/` directory is writable. Check `backend/data/nexusquery.db` exists after first launch.

### `sentence-transformers` import error
The pipeline includes a fallback mock embedding generator. The system will still function for basic RAG queries. To fix:
```bash
pip install --upgrade sentence-transformers transformers huggingface_hub
```

### FAISS `libgomp` error on Linux
```bash
apt-get install libgomp1
```

### Frontend build fails — TypeScript errors
TypeScript strict mode for `noUnusedLocals` and `noUnusedParameters` is disabled in `tsconfig.app.json` for build compatibility. Run:
```bash
npm run build
```

### Docker — backend cannot connect to MySQL
The `depends_on` with `service_healthy` condition ensures MySQL is ready before the backend starts. If issues persist, increase the healthcheck `retries` in `docker-compose.yml`.

### Viewing API logs
```bash
# Local
cd backend
python -m uvicorn app.main:app --reload --log-level debug

# Docker
docker logs nexus_backend -f
```

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'feat: add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

All contributions go through the **Contribution Review** pipeline built into NexusQuery AI itself!

---

## 📄 License

This project is licensed under the **MIT License**.

---

<div align="center">

Built with ❤️ for enterprise teams who deserve better knowledge tools.

**NexusQuery AI** · Enterprise Knowledge Discovery Platform · v1.0.0

</div>
