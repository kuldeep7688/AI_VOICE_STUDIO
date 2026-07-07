from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings, get_voices_dir, get_clips_dir, get_recordings_dir
from routers import tts, asr, cleanup, studio, library, jobs

for d in [get_voices_dir(), get_clips_dir(), get_recordings_dir()]:
    d.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="AI Voice Studio", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/audio", StaticFiles(directory=str(Path(settings.storage_dir))), name="audio")

app.include_router(tts.router, prefix="/api")
app.include_router(asr.router, prefix="/api")
app.include_router(cleanup.router, prefix="/api")
app.include_router(studio.router, prefix="/api")
app.include_router(library.router, prefix="/api")
app.include_router(jobs.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/models")
def list_models():
    return [
        {"id": "magpie-tts-zeroshot", "name": "Magpie TTS Zero-Shot", "type": "tts", "status": "available"},
        {"id": "canary-1b-asr", "name": "Canary 1B ASR", "type": "asr", "status": "available"},
        {"id": "bnr", "name": "Background Noise Removal", "type": "cleanup", "status": "available"},
    ]
