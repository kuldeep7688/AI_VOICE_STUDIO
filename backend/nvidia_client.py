import asyncio
import io
import logging
import tempfile
import time
import wave
from pathlib import Path

import grpc
import httpx
import riva.client
from google.protobuf import descriptor_pool as _descriptor_pool
from google.protobuf import runtime_version as _runtime_version
from google.protobuf.internal import builder as _builder

from config import settings

logger = logging.getLogger(__name__)

# Canary-1B requires full BCP-47 locale codes ("fr-FR"), not bare ISO-639-1
# codes ("fr") — a bare code is silently accepted but translates into an
# unrelated language instead of erroring, so app-level short codes (matching
# models.Language) are normalized here before every ASR/translate call.
_LANGUAGE_LOCALE_MAP = {
    "en": "en-US",
    "fr": "fr-FR",
    "es": "es-US",
    "de": "de-DE",
    "hi": "hi-IN",
}


def _to_locale(language: str) -> str:
    return _LANGUAGE_LOCALE_MAP.get(language, language)


_RUNTIME_VERSION_VALIDATED = False


def _ensure_bnr_proto():
    global _RUNTIME_VERSION_VALIDATED
    if _RUNTIME_VERSION_VALIDATED:
        return
    _runtime_version.ValidateProtobufRuntimeVersion(
        _runtime_version.Domain.PUBLIC, 5, 27, 2, "", "bnr.proto"
    )
    _RUNTIME_VERSION_VALIDATED = True


_BNR_DESCRIPTOR = _descriptor_pool.Default().AddSerializedFile(
    b"\n\tbnr.proto\x12\x12nvidia.ai4m.bnr.v1\"F\n\x12EnhanceAudioConfig\x12\x1c\n\x0fintensity_ratio\x18\x01 \x01(\x02H\x00\x88\x01\x01B\x12\n\x10_intensity_ratio\"|\n\x13EnhanceAudioRequest\x12\x1b\n\x11audio_stream_data\x18\x01 \x01(\x0cH\x00\x12\x38\n\x06config\x18\x02 \x01(\x0b\x32&.nvidia.ai4m.bnr.v1.EnhanceAudioConfigH\x00B\x0e\n\x0cstream_input\"~\n\x14EnhanceAudioResponse\x12\x1b\n\x11audio_stream_data\x18\x01 \x01(\x0cH\x00\x12\x38\n\x06config\x18\x02 \x01(\x0b\x32&.nvidia.ai4m.bnr.v1.EnhanceAudioConfigH\x00B\x0f\n\rstream_output2n\n\x03BNR\x12g\n\x0cEnhanceAudio\x12'.nvidia.ai4m.bnr.v1.EnhanceAudioRequest\x1a(.nvidia.ai4m.bnr.v1.EnhanceAudioResponse\"\x00(\x01\x30\x01b\x06proto3"
)

_bnr_globals = globals()
_builder.BuildMessageAndEnumDescriptors(_BNR_DESCRIPTOR, _bnr_globals)
_builder.BuildTopDescriptorsAndMessages(_BNR_DESCRIPTOR, "bnr_pb2", _bnr_globals)
_EnhanceAudioConfig = _bnr_globals["EnhanceAudioConfig"]
_EnhanceAudioRequest = _bnr_globals["EnhanceAudioRequest"]
_EnhanceAudioResponse = _bnr_globals["EnhanceAudioResponse"]
_ENHANCE_AUDIO_METHOD = "/nvidia.ai4m.bnr.v1.BNR/EnhanceAudio"


def _wav_pcm_and_rate(wav_bytes: bytes) -> tuple[bytes, int]:
    """Strip the RIFF/WAVE header and return (raw_pcm_frames, sample_rate).

    riva.client's offline_recognize expects raw PCM samples, not a WAV file —
    the ASR server errors on nothing but silently returns empty results if you
    feed it a full WAV (the header bytes get parsed as garbage lead-in audio).
    """
    with wave.open(io.BytesIO(wav_bytes), "rb") as w:
        sample_rate = w.getframerate()
        pcm = w.readframes(w.getnframes())
    return pcm, sample_rate


def _bnr_request_iterator(wav_bytes: bytes, intensity_ratio: float | None = None):
    if intensity_ratio is not None:
        config = _EnhanceAudioConfig()
        config.intensity_ratio = intensity_ratio
        yield _EnhanceAudioRequest(config=config)
    CHUNK = 64 * 1024
    for i in range(0, len(wav_bytes), CHUNK):
        yield _EnhanceAudioRequest(audio_stream_data=wav_bytes[i : i + CHUNK])


class NvidiaAPIError(Exception):
    def __init__(self, status_code: int, message: str):
        self.status_code = status_code
        self.message = message
        super().__init__(f"NIM API {status_code}: {message}")


class NvidiaClient:
    def __init__(self):
        self._asr_service = None
        self._tts_service = None
        self._asr_function_id = settings.asr_function_id
        self._tts_function_id = settings.tts_function_id
        self._bnr_function_id = settings.bnr_function_id
        logger.info(
            "NvidiaClient init: grpc_server=%s asr_fn=%s tts_fn=%s",
            settings.grpc_server,
            self._asr_function_id or "(pending discovery)",
            self._tts_function_id or "(pending discovery)",
        )

    async def resolve_function_ids(self):
        try:
            url = "https://api.nvcf.nvidia.com/v2/nvcf/functions?visibility=public,authorized"
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    url,
                    headers={"Authorization": f"Bearer {settings.nvidia_api_key}"},
                    timeout=15.0,
                )
                resp.raise_for_status()
                data = resp.json()

            for fn in data.get("functions", []):
                if fn.get("status") != "ACTIVE":
                    continue
                name = fn["name"].lower()
                fid = fn["id"]
                if "canary" in name and "asr" in name:
                    if not self._asr_function_id:
                        self._asr_function_id = fid
                        logger.info("Discovered ASR function-id=%s name=%s", fid, fn["name"])
                elif "magpie" in name and "tts" in name and "zeroshot" in name:
                    # tts_clone() does voice cloning via zero_shot_audio_prompt_file,
                    # which only the zero-shot model supports — "magpie"+"tts" alone
                    # also matches ai-magpie-tts-multilingual, which rejects our
                    # voice_name and fails every clone request.
                    if not self._tts_function_id:
                        self._tts_function_id = fid
                        logger.info("Discovered TTS function-id=%s name=%s", fid, fn["name"])
                elif "bnr" in name and not self._bnr_function_id:
                    self._bnr_function_id = fid
                    logger.info("Discovered BNR function-id=%s name=%s", fid, fn["name"])

            if not self._asr_function_id:
                logger.warning("ASR function-id not discovered — set ASR_FUNCTION_ID in .env")
            if not self._tts_function_id:
                logger.warning("TTS function-id not discovered — set TTS_FUNCTION_ID in .env")
        except Exception as exc:  # noqa: BLE001
            logger.error("Function ID discovery failed: %s", exc)

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
        if not self._asr_function_id:
            raise NvidiaAPIError(503, "ASR function-id not configured")
        if self._asr_service is None:
            self._asr_service = riva.client.ASRService(self._get_auth(self._asr_function_id))
        return self._asr_service

    def _get_tts(self):
        if not self._tts_function_id:
            raise NvidiaAPIError(503, "TTS function-id not configured")
        if self._tts_service is None:
            self._tts_service = riva.client.SpeechSynthesisService(
                self._get_auth(self._tts_function_id)
            )
        return self._tts_service

    async def asr_transcribe(self, audio: bytes, language: str = "en-US") -> str:
        language = _to_locale(language)
        logger.info("NIM asr_transcribe: audio_size=%d lang=%s", len(audio), language)
        start = time.monotonic()

        pcm, sample_rate = _wav_pcm_and_rate(audio)
        cfg = riva.client.RecognitionConfig(
            encoding=riva.client.AudioEncoding.LINEAR_PCM,
            sample_rate_hertz=sample_rate,
            language_code=language,
            audio_channel_count=1,
            enable_automatic_punctuation=True,
            max_alternatives=1,
        )

        asr = self._get_asr()
        try:
            result = await asyncio.to_thread(asr.offline_recognize, pcm, cfg)
        except Exception as exc:  # noqa: BLE001
            elapsed = time.monotonic() - start
            logger.error("NIM asr_transcribe failed: elapsed=%.2fs error=%s", elapsed, exc)
            raise NvidiaAPIError(502, str(exc))

        elapsed = time.monotonic() - start
        if not result.results or not result.results[0].alternatives:
            logger.info("NIM asr_transcribe done: elapsed=%.2fs text=(empty)", elapsed)
            return ""

        text = result.results[0].alternatives[0].transcript
        logger.info("NIM asr_transcribe done: elapsed=%.2fs text_len=%d", elapsed, len(text))
        return text

    async def asr_translate(self, audio: bytes, target_language: str = "en-US") -> tuple[str, str]:
        target_language = _to_locale(target_language)
        logger.info("NIM asr_translate: audio_size=%d target=%s", len(audio), target_language)
        start = time.monotonic()

        pcm, sample_rate = _wav_pcm_and_rate(audio)
        cfg = riva.client.RecognitionConfig(
            encoding=riva.client.AudioEncoding.LINEAR_PCM,
            sample_rate_hertz=sample_rate,
            language_code="en-US",
            audio_channel_count=1,
            enable_automatic_punctuation=True,
            max_alternatives=1,
        )
        riva.client.add_custom_configuration_to_config(
            cfg, f"target_language:{target_language},task:translate"
        )

        asr = self._get_asr()
        try:
            result = await asyncio.to_thread(asr.offline_recognize, pcm, cfg)
        except Exception as exc:  # noqa: BLE001
            elapsed = time.monotonic() - start
            logger.error("NIM asr_translate failed: elapsed=%.2fs error=%s", elapsed, exc)
            raise NvidiaAPIError(502, str(exc))

        elapsed = time.monotonic() - start
        if not result.results or not result.results[0].alternatives:
            logger.info("NIM asr_translate done: elapsed=%.2fs text=(empty)", elapsed)
            return "", ""

        alt = result.results[0].alternatives[0]
        translated = alt.transcript
        # Canary's translate-mode response only carries the translated text —
        # there's no separate original-language transcript field to read here.
        # Returning "" (rather than duplicating `translated` under the wrong
        # label) is safe: callers that need both already run a plain
        # asr_transcribe() first and only fall back to this text when unset.
        text = ""
        logger.info(
            "NIM asr_translate done: elapsed=%.2fs translated_len=%d",
            elapsed, len(translated),
        )
        return text, translated

    async def tts_clone(self, voice_audio: bytes, text: str) -> bytes:
        logger.info("NIM tts_clone: voice_size=%d text_len=%d", len(voice_audio), len(text))
        start = time.monotonic()

        tts = self._get_tts()

        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(voice_audio)
            tmp.flush()
            tmp_path = tmp.name

        try:
            resp = await asyncio.to_thread(
                tts.synthesize,
                text=text,
                voice_name="Magpie-ZeroShot-Multilingual",
                language_code="en-US",
                sample_rate_hz=48000,
                zero_shot_audio_prompt_file=Path(tmp_path),
                zero_shot_quality=20,
            )
        except Exception as exc:  # noqa: BLE001
            elapsed = time.monotonic() - start
            logger.error("NIM tts_clone failed: elapsed=%.2fs error=%s", elapsed, exc)
            raise NvidiaAPIError(502, str(exc))
        finally:
            import os
            os.unlink(tmp_path)

        if not resp.audio:
            raise NvidiaAPIError(502, "TTS returned no audio")

        buf = io.BytesIO()
        with wave.open(buf, "wb") as w:
            w.setnchannels(1)
            w.setsampwidth(2)
            w.setframerate(48000)
            w.writeframes(resp.audio)

        wav_bytes = buf.getvalue()
        elapsed = time.monotonic() - start
        logger.info("NIM tts_clone done: elapsed=%.2fs output_size=%d", elapsed, len(wav_bytes))
        return wav_bytes

    async def bnr_denoise(self, audio: bytes) -> bytes:
        if not self._bnr_function_id:
            raise NvidiaAPIError(503, "BNR function-id not configured")
        logger.info("NIM bnr_denoise: audio_size=%d fid=%s", len(audio), self._bnr_function_id)
        start = time.monotonic()

        _ensure_bnr_proto()

        metadata = (
            ("authorization", f"Bearer {settings.nvidia_api_key}"),
            ("function-id", self._bnr_function_id),
        )

        def _call_bnr() -> bytes:
            credentials = grpc.ssl_channel_credentials()
            with grpc.secure_channel(
                target=settings.grpc_server, credentials=credentials
            ) as channel:
                stream_method = channel.stream_stream(
                    _ENHANCE_AUDIO_METHOD,
                    _EnhanceAudioRequest.SerializeToString,
                    _EnhanceAudioResponse.FromString,
                )
                response = stream_method(
                    _bnr_request_iterator(audio),
                    metadata=metadata,
                )
                output = bytearray()
                for msg in response:
                    if hasattr(msg, "audio_stream_data") and msg.audio_stream_data:
                        output.extend(msg.audio_stream_data)
            return bytes(output)

        try:
            result = await asyncio.to_thread(_call_bnr)
        except Exception as exc:  # noqa: BLE001
            elapsed = time.monotonic() - start
            logger.error("NIM bnr_denoise failed: elapsed=%.2fs error=%s", elapsed, exc)
            raise NvidiaAPIError(502, str(exc))

        elapsed = time.monotonic() - start
        logger.info("NIM bnr_denoise done: elapsed=%.2fs output_size=%d", elapsed, len(result))
        return result

    async def close(self):
        self._asr_service = None
        self._tts_service = None


nvidia_client = NvidiaClient()
