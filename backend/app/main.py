import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import ALLOWED_ORIGINS, FRAMES_DIR, THUMBNAILS_DIR
from app.core.database import init_db
from app.retrieval.vector_index import vector_index
from app.demo_data import seed_demo_dataset
from app.api.videos import router as videos_router
from app.api.search import router as search_router
from app.api.system import router as system_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: initialize database and load vector index
    init_db()
    # Seed demo videos if first run
    try:
        seed_demo_dataset()
    except Exception as e:
        print(f"[Warning] Failed to auto-seed demo videos: {e}")
    vector_index.load_from_db()
    print("[OmniRoute] Backend initialized and ready for on-device semantic search.")
    yield
    print("[OmniRoute] Backend shutting down.")

app = FastAPI(
    title="Omni-Search Video Gallery",
    description="Natural language semantic search across personal videos using on-device multimodal AI.",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(videos_router)
app.include_router(search_router)
app.include_router(system_router)

@app.get("/")
def health_check():
    return {
        "status": "online",
        "app": "OMNI SEARCH",
        "subtitle": "Find any moment. Instantly.",
        "label": "Private • On-Device AI",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
