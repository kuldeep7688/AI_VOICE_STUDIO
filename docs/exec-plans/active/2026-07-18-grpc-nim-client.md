# gRPC NIM Client Implementation Plan

> **Status:** Planned | **Depends on:** feat-log-* | **Source:** NVIDIA skills repo (riva-tts, riva-asr)

## Context

All Nvidia audio NIM models (TTS, ASR, BNR) use **gRPC** via `grpc.nvcf.nvidia.com:443` with NVCF function IDs — NOT REST HTTP. The current `nvidia_client.py` uses `httpx` (REST) but receives 404s because audio models don't expose REST on `integrate.api.nvidia.com/v1`. That endpoint only supports LLM chat completions.

### Architecture

```
AI Voice Studio Backend
    │
    ├── nvidia-riva-client (pip package — includes grpcio, protobuf stubs)
    │
    ▼
grpc.nvcf.nvidia.com:443 (SSL/TLS)
    │
    ├── Metadata headers: function-id, authorization: Bearer $NVIDIA_API_KEY
    │
    ├── riva.client.ASRService            → offline_recognize() for Canary-1B
    ├── riva.client.SpeechSynthesisService → synthesize() for Magpie TTS
    └── (BNR: separate MaxineBNR proto — Phase 3+)
```

### RFVP Function IDs (dynamic — fetch at startup)

Function IDs rotate per release. Never hardcode. Fetch from NVCF API:

```bash
curl -H "Authorization: Bearer $NVIDIA_API_KEY" \
  "https://api.nvcf.nvidia.com/v2/nvcf/functions?visibility=public,authorized"
```

Filter by name pattern:

| Model | NVCF name pattern |
|---|---|
| Magpie TTS Multilingual | `ai-magpie-tts-multilingual` |
| Magpie TTS Zeroshot | `ai-magpie-tts-zeroshot` |
| Canary-1B ASR | `ai-canary-1b-asr` |
| Nemotron ASR (fallback) | `ai-nemotron-asr` |
| BNR | `bnr` |

---

## How `riva.client` Works

The `nvidia-riva-client` package provides pre-built gRPC stubs through a simple Python API. Key concepts:

```python
import riva.client

# Authentication — for cloud (NVCF), pass metadata_args
auth = riva.client.Auth(
    uri="grpc.nvcf.nvidia.com:443",
    use_ssl=True,
    metadata_args=[
        ["function-id", function_id],
        ["authorization", f"Bearer {nvidia_api_key}"],
    ],
)

# For self-hosted, omit metadata_args:
# auth = riva.client.Auth(uri="0.0.0.0:50051")
```

The `Auth` object manages the gRPC channel internally. Service stubs are created from it:

```python
asr = riva.client.ASRService(auth)           # for ASR
tts = riva.client.SpeechSynthesisService(auth) # for TTS
```

**Canary-1B is offline-only** — uses `offline_recognize()`, NOT streaming. Streaming models use `streaming_response_generator()`. The support matrix at `https://docs.nvidia.com/nim/speech/latest/reference/support-matrix/asr.html` classifies each model.

---

## Phase 1: Dependencies + Config

### Task 1.1: Add `nvidia-riva-client`

**File:** `backend/requirements.txt`

```
nvidia-riva-client>=2.17
```

`nvidia-riva-client` includes `grpcio` and `protobuf` transitively — no separate grpcio entry needed.

**Verification:**
```bash
pip install -r requirements.txt
python -c "import riva.client; print('OK')"
```

### Task 1.2: Add function ID + gRPC config

**File:** `backend/config.py`

```python
grpc_server: str = "grpc.nvcf.nvidia.com:443"
tts_function_id: str = ""       # fetched at startup
asr_function_id: str = ""       # fetched at startup
bnr_function_id: str = ""       # fetched at startup
```

### Task 1.3: Function ID auto-discovery at startup

**File:** `backend/nvidia_client.py`

At module init or `__init__`, call NVCF Functions API to resolve function IDs:

```python
async def _resolve_function_ids(self):
    """Fetch current function IDs from NVCF API."""
    url = "https://api.nvcf.nvidia.com/v2/nvcf/functions?visibility=public,authorized"
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers={
            "Authorization": f"Bearer {settings.nvidia_api_key}",
        })
        data = resp.json()
        for fn in data.get("functions", []):
            if fn.get("status") != "ACTIVE":
                continue
            name = fn["name"]
            fid = fn["id"]
            if "canary" in name.lower():
                self._asr_function_id = fid
            elif "magpie" in name.lower() and "zeroshot" in name.lower():
                self._tts_function_id = fid
            elif "bnr" in name.lower():
                self._bnr_function_id = fid
```

Fallback: if API call fails or no match found, use hardcoded defaults from config.

---

## Phase 2: gRPC NIM Client Rewrite

### Task 2.1: Rewrite `nvidia_client.py`

**File:** `backend/nvidia_client.py`

Complete rewrite from httpx REST → riva.client gRPC. The riva client handles channel management internally (no manual `grpc.secure_channel()` needed).

```python
import logging
import io
import wave
import riva.client
from config import settings

logger = logging.getLogger(__name__)

class NvidiaAPIError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"NIM API {status_code}: {message}")

class NvidiaClient:
    def __init__(self):
        self._asr_service = None
        self._tts_service = None
        logger.debug("NvidiaClient: gRPC server=%s", settings.grpc_server)

    def _get_auth(self, function_id: str):
        return riva.client.Auth(
            uri=settings.grpc_server,
            use_ssl=True,
            metadata_args=[
                ["function-id", function_id],
                ["authorization", f"Bearer {settings.nvidia_api_key}"],
            ],
        )

    def _get_asr(self):
        if self._asr_service is None:
            self._asr_service = riva.client.ASRService(
                self._get_auth(settings.asr_function_id)
            )
        return self._asr_service

    def _get_tts(self):
        if self._tts_service is None:
            self._tts_service = riva.client.SpeechSynthesisService(
                self._get_auth(settings.tts_function_id)
            )
        return self._tts_service
```

### ASR Methods

```python
    def asr_transcribe(self, audio: bytes, language: str = "en-US") -> str:
        """Canary-1B offline transcription. Audio must be mono 16-bit PCM WAV."""
        logger.info("NIM asr_transcribe: audio_size=%d lang=%s", len(audio), language)

        with wave.open(io.BytesIO(audio), "rb") as w:
            sr = w.getframerate()
            ch = w.getnchannels()
            sw = w.getsampwidth()
            if ch != 1:
                raise NvidiaAPIError(400, "Audio must be mono")
            if sw != 2:
                raise NvidiaAPIError(400, "Audio must be 16-bit PCM")
            pcm = w.readframes(w.getnframes())

        cfg = riva.client.RecognitionConfig(
            language_code=language,
            sample_rate_hertz=sr,
            audio_channel_count=1,
            encoding=riva.client.AudioEncoding.LINEAR_PCM,
            enable_automatic_punctuation=True,
            max_alternatives=1,
        )

        asr = self._get_asr()
        result = asr.offline_recognize(pcm, cfg)

        if not result.results or not result.results[0].alternatives:
            return ""

        text = result.results[0].alternatives[0].transcript
        logger.info("NIM asr_transcribe done: text=%.100s", text)
        return text

    def asr_translate(self, audio: bytes, target_language: str = "en-US") -> tuple[str, str]:
        """Canary-1B translation. Returns (transcribed, translated) tuple."""
        logger.info("NIM asr_translate: audio_size=%d target=%s", len(audio), target_language)
        # Canary-1B handles translation via language_code + target_language in config.
        # Source language auto-detected. See customization doc for per-model support.
        # ...
```

### TTS Methods

```python
    def tts_clone(self, voice_audio: bytes, text: str) -> bytes:
        """TTS synthesis. For zero-shot, voice_audio sent as audio_prompt."""
        logger.info("NIM tts_clone: audio_size=%d text_len=%d", len(voice_audio), len(text))

        tts = self._get_tts()

        # Magpie TTS Multilingual: voice_name from list
        # Magpie TTS Zeroshot: voice_name empty + audio_prompt in custom_configuration
        resp = tts.synthesize(
            text=text,
            voice_name="",          # empty for zero-shot
            language_code="en-US",
            encoding=riva.client.AudioEncoding.LINEAR_PCM,
            sample_rate_hz=22050,
        )

        # Wrap PCM in WAV header
        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(22050)
            w.writeframes(resp.audio)

        wav_bytes = buf.getvalue()
        logger.info("NIM tts_clone done: output_size=%d", len(wav_bytes))
        return wav_bytes
```

### Protocol Notes

| Method | gRPC Service | Call Pattern |
|---|---|---|
| `asr_transcribe` | `riva.client.ASRService` | `offline_recognize(pcm, cfg)` — Canary is offline-only |
| `asr_translate` | `riva.client.ASRService` | `offline_recognize(pcm, cfg_with_translate_lang)` |
| `tts_clone` | `riva.client.SpeechSynthesisService` | `synthesize(text, voice, lang, encoding, sr)` |
| `bnr_denoise` | MaxineBNR (separate proto) | Phase 3+ — needs proto compilation from `nim-clients/bnr/` |

### Audio Format Requirements

- **WAV only** — 16-bit signed PCM, mono, little-endian
- Opus container also accepted for ASR, but WAV simpler for our use case
- Stereo → must downmix to mono before sending
- Sample rate: Canary/Parakeet accept flexible rates; resample to 16kHz if unsure

---

## Phase 3: Unblock Frontend + Backend

### Task 3.1: Mark models as "available"

**Files:** `backend/main.py`, `backend/routers/tts.py`, `backend/routers/asr.py`

- `main.py`: Change model statuses from `"planned"` to `"available"`
- `routers/tts.py`: Remove 503 placeholder, restore actual TTS dispatch (was returning 503)
- `routers/asr.py`: Remove 503 placeholder, restore actual endpoints
- `routers/cleanup.py`: Keep BNR as "planned" / 503 until Phase 3+

### Task 3.2: Remove COMING SOON badges

**File:** `frontend/src/components/StudioRecorder/StudioRecorderScreen.tsx`

- Remove `disabled: true` from Clean checkbox
- Remove COMING SOON badge from Clean
- Remove `disabled` prop from Clean input
- Keep Transcribe/Translate/Re-voice already enabled

---

## Phase 4: Verification

- [ ] `pip install -r requirements.txt` succeeds
- [ ] `python -c "import riva.client; print('OK')"` works
- [ ] `python -c "from main import app; print('OK')"` works
- [ ] `pytest -v` — all 25+ tests pass (mocked riva.client)
- [ ] `npx tsc -b` — TypeScript clean
- [ ] `npm run build` — Vite build succeeds
- [ ] Manual: record voice → save → generate speech (TTS)
- [ ] Manual: record audio → transcribe (ASR)

---

## Open Questions

1. **Zero-shot audio prompt field.** The `SynthesizeSpeechRequest` proto has an `audio_prompt` field for zero-shot models. Exact field path TBD: check `riva.client.proto.riva_tts_pb2.SynthesizeSpeechRequest` or use `custom_configuration` map. Zero-shot also requires access approval: `developer.nvidia.com/riva-tts-zeroshot-models`.

2. **Canary translation mode.** Canary-1B supports ASR+AST. The `RecognitionConfig` likely needs `target_language` or a custom config key. Verify with customization doc.

3. **BNR proto compilation.** BNR uses a different protobuf (MaxineBNR), not Riva. Would need to compile `.proto` from `nim-clients/bnr/` repo and generate Python stubs. Defer to separate session.

4. **gRPC connection lifecycle.** `riva.client.Auth` manages connections internally. Need to verify thread-safety in asyncio context — the service stubs are synchronous. Should wrap in `asyncio.to_thread()` or use a thread pool executor.

5. **Function ID startup dependency.** If NVCF API is unreachable at startup, fallback to hardcoded defaults. Config should allow explicit override.

## Risks

- **gRPC is synchronous** — riva.client calls block. Must use `asyncio.to_thread()` (Python 3.9+) or `loop.run_in_executor()` to avoid blocking the FastAPI event loop
- **Zero-shot access** — may not have approval → fallback to Magpie TTS Multilingual with predefined voices (different UX: user picks voice name instead of cloning)
- **Function ID rotation** — fetch-at-startup helps, but long-running server could get stale → re-fetch on 404/403 errors
- **4MB gRPC limit** — TTS output >4MB fails. For typical voice cloning (1-5s text), this shouldn't happen. For longer synthesis, switch to streaming `SynthesizeOnline`
