import logging
import logging.config
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from config import settings, get_voices_dir, get_clips_dir, get_recordings_dir
from routers import tts, asr, cleanup, studio, library, jobs

for d in [get_voices_dir(), get_clips_dir(), get_recordings_dir()]:
    d.mkdir(parents=True, exist_ok=True)

LOGGING_CONFIG: dict = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "text": {
            "format": "%(asctime)s | %(levelname)-8s | %(name)s:%(lineno)d | %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
        "json": {
            "format": '{"timestamp":"%(asctime)s","level":"%(levelname)s","logger":"%(name)s","line":%(lineno)d,"message":"%(message)s"}',
            "datefmt": "%Y-%m-%dT%H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": settings.log_format,
            "stream": "ext://sys.stderr",
        },
    },
    "root": {
        "level": settings.log_level.upper(),
        "handlers": ["console"],
    },
    "loggers": {
        "uvicorn": {"level": "WARNING", "handlers": ["console"], "propagate": False},
        "httpx": {"level": "WARNING", "handlers": ["console"], "propagate": False},
    },
}

if settings.log_file:
    LOGGING_CONFIG["handlers"]["file"] = {
        "class": "logging.handlers.RotatingFileHandler",
        "filename": settings.log_file,
        "maxBytes": 10 * 1024 * 1024,
        "backupCount": 3,
        "formatter": settings.log_format,
    }
    LOGGING_CONFIG["root"]["handlers"].append("file")
    for logger_name in LOGGING_CONFIG["loggers"]:
        LOGGING_CONFIG["loggers"][logger_name]["handlers"].append("file")

logging.config.dictConfig(LOGGING_CONFIG)

logger = logging.getLogger(__name__)
logger.info("Starting AI Voice Studio v0.1.0, log_level=%s", settings.log_level)

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


@app.middleware("http")
async def log_errors_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as exc:
        logger.error("Unhandled exception: %s %s", request.method, request.url.path, exc_info=True)
        from fastapi.responses import JSONResponse
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/models")
def list_models():
    return [
        {"id": "magpie-tts-zeroshot", "name": "Magpie TTS Zero-Shot", "type": "tts", "status": "available"},
        {"id": "canary-1b-asr", "name": "Canary 1B ASR", "type": "asr", "status": "available"},
        {"id": "bnr", "name": "Background Noise Removal", "type": "cleanup", "status": "planned"},
    ]


@app.on_event("shutdown")
async def shutdown():
    logger.info("Shutting down AI Voice Studio")
