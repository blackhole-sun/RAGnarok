import os
from app.config import settings

# Must be set BEFORE importing routers — langsmith client initializes at import time
if settings.langsmith_api_key:
    os.environ["LANGCHAIN_API_KEY"] = settings.langsmith_api_key
    os.environ["LANGCHAIN_TRACING_V2"] = settings.langsmith_tracing_v2
    os.environ["LANGCHAIN_PROJECT"] = settings.langsmith_project

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, threads, messages, chat, ingestion

app = FastAPI(title="Rangarok RAG API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(threads.router)
app.include_router(messages.router)
app.include_router(chat.router)
app.include_router(ingestion.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
