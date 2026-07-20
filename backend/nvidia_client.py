import asyncio
import time
import logging
import httpx
from typing import Optional
from config import settings

logger = logging.getLogger(__name__)


class NvidiaAPIError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"NIM API {status_code}: {message}")


class NvidiaClient:
    def __init__(self):
        self._client: Optional[httpx.AsyncClient] = None
        self._headers = {
            "Authorization": f"Bearer {settings.nvidia_api_key}",
            "Content-Type": "application/json",
        }
        logger.debug("NvidiaClient ready: key=%s... base=%s", settings.nvidia_api_key[:8], settings.api_base_url)

    async def _ensure_client(self):
        if self._client is None:
            self._client = httpx.AsyncClient(timeout=httpx.Timeout(120.0))

    async def close(self):
        if self._client:
            await self._client.aclose()
            self._client = None

    async def _call(
        self,
        endpoint: str,
        data: Optional[dict] = None,
        files: Optional[dict] = None,
        method: str = "POST",
    ):
        await self._ensure_client()
        headers = self._headers.copy()
        if files:
            headers.pop("Content-Type", None)
        url = f"{settings.api_base_url.rstrip('/')}/{endpoint.lstrip('/')}"
        audio_size = sum(len(v) for v in (files or {}).values() if isinstance(v, bytes)) if files else 0
        text_len = len(str(data or {}))
        logger.debug("NIM call: method=%s endpoint=%s audio_size=%d text_len=%d", method, endpoint, audio_size, text_len)
        start = time.monotonic()
        for attempt in range(2):
            try:
                if method == "POST":
                    resp = await self._client.post(url, headers=headers, json=data, files=files)
                else:
                    resp = await self._client.get(url, headers=headers)
                elapsed = time.monotonic() - start
                if resp.status_code == 429 or resp.status_code >= 500:
                    logger.warning("NIM retry: endpoint=%s status=%d attempt=%d/%d elapsed=%.2fs",
                                   endpoint, resp.status_code, attempt + 1, 2, elapsed)
                    if attempt == 0:
                        await asyncio.sleep(1)
                        continue
                resp.raise_for_status()
                logger.debug("NIM success: endpoint=%s status=%d elapsed=%.2fs", endpoint, resp.status_code, elapsed)
                return resp
            except httpx.HTTPStatusError as e:
                elapsed = time.monotonic() - start
                logger.error("NIM error: endpoint=%s status=%d elapsed=%.2fs body=%.200s",
                             endpoint, e.response.status_code, elapsed, e.response.text[:200])
                raise NvidiaAPIError(e.response.status_code, str(e))
        logger.error("NIM failed after retries: endpoint=%s", endpoint)
        return None

    async def tts_clone(self, voice_audio: bytes, text: str) -> bytes:
        logger.info("NIM tts_clone: audio_size=%d text_len=%d", len(voice_audio), len(text))
        result = await self._call(
            "nim/tts/magpie-tts-zeroshot",
            data={"text": text},
            files={"audio": ("reference.wav", voice_audio, "audio/wav")},
        )
        logger.info("NIM tts_clone done: output_size=%d", len(result.content))
        return result.content

    async def asr_transcribe(self, audio: bytes, language: str = "en") -> str:
        logger.info("NIM asr_transcribe: audio_size=%d lang=%s", len(audio), language)
        result = await self._call(
            "nim/asr/canary-1b-asr",
            files={"audio": ("audio.wav", audio, "audio/wav")},
            data={"language": language},
        )
        data = result.json()
        text = data.get("text", "")
        logger.info("NIM asr_transcribe done: text_len=%d text=%.100s", len(text), text)
        return text

    async def asr_translate(self, audio: bytes, target_language: str = "en") -> tuple[str, str]:
        logger.info("NIM asr_translate: audio_size=%d target=%s", len(audio), target_language)
        result = await self._call(
            "nim/asr/canary-1b-asr/translate",
            files={"audio": ("audio.wav", audio, "audio/wav")},
            data={"target_language": target_language},
        )
        data = result.json()
        text = data.get("text", "")
        translated = data.get("translated_text", "")
        logger.info("NIM asr_translate done: text_len=%d translated_len=%d", len(text), len(translated))
        return text, translated

    async def bnr_denoise(self, audio: bytes) -> bytes:
        logger.warning("NIM bnr_denoise: BNR model not available yet (requires self-hosted gRPC NIM)")
        raise NvidiaAPIError(503, "BNR model not yet available. Requires self-hosted NIM (gRPC).")


nvidia_client = NvidiaClient()
