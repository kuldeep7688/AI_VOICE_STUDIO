import httpx
from typing import Optional
from config import settings


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
        for attempt in range(2):
            try:
                if method == "POST":
                    resp = await self._client.post(url, headers=headers, json=data, files=files)
                else:
                    resp = await self._client.get(url, headers=headers)
                if resp.status_code == 429 or resp.status_code >= 500:
                    if attempt == 0:
                        import asyncio
                        await asyncio.sleep(1)
                        continue
                resp.raise_for_status()
                return resp
            except httpx.HTTPStatusError as e:
                raise NvidiaAPIError(e.response.status_code, str(e))
        return None

    async def tts_clone(self, voice_audio: bytes, text: str) -> bytes:
        result = await self._call(
            "nim/tts/magpie-tts-zeroshot",
            data={"text": text},
            files={"audio": ("reference.wav", voice_audio, "audio/wav")},
        )
        return result.content

    async def asr_transcribe(self, audio: bytes, language: str = "en") -> str:
        result = await self._call(
            "nim/asr/canary-1b-asr",
            files={"audio": ("audio.wav", audio, "audio/wav")},
            data={"language": language},
        )
        data = result.json()
        return data.get("text", "")

    async def asr_translate(self, audio: bytes, target_language: str = "en") -> tuple[str, str]:
        result = await self._call(
            "nim/asr/canary-1b-asr/translate",
            files={"audio": ("audio.wav", audio, "audio/wav")},
            data={"target_language": target_language},
        )
        data = result.json()
        return data.get("text", ""), data.get("translated_text", "")

    async def bnr_denoise(self, audio: bytes) -> bytes:
        result = await self._call(
            "nim/audio/bnr",
            files={"audio": ("noisy.wav", audio, "audio/wav")},
        )
        return result.content


nvidia_client = NvidiaClient()
