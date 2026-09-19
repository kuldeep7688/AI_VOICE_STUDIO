import io
import struct
import wave
import logging
from config import settings

logger = logging.getLogger(__name__)


class AudioValidationError(Exception):
    pass


def _walk_chunks(audio_bytes: bytes) -> dict:
    """Parse a RIFF/WAVE file by walking its chunks (rather than assuming a
    fixed 44-byte header). Real-world WAV files commonly carry extra chunks
    before `data` — e.g. macOS afconvert inserts a `FLLR` padding chunk —
    which shifts everything after it. Reading channels/sample_rate/etc. at
    hardcoded byte offsets silently returns garbage in that case instead of
    erroring, corrupting duration validation and mono downmixing.
    """
    if len(audio_bytes) < 12 or audio_bytes[:4] != b"RIFF" or audio_bytes[8:12] != b"WAVE":
        raise AudioValidationError("Not a valid WAV file")

    channels = sample_rate = bits_per_sample = None
    data_offset = data_size = None
    pos = 12
    while pos + 8 <= len(audio_bytes):
        chunk_id = audio_bytes[pos:pos + 4]
        chunk_size = struct.unpack("<I", audio_bytes[pos + 4:pos + 8])[0]
        chunk_start = pos + 8
        if chunk_id == b"fmt " and chunk_start + 16 <= len(audio_bytes):
            fmt = audio_bytes[chunk_start:chunk_start + 16]
            channels = struct.unpack("<H", fmt[2:4])[0]
            sample_rate = struct.unpack("<I", fmt[4:8])[0]
            bits_per_sample = struct.unpack("<H", fmt[14:16])[0]
        elif chunk_id == b"data":
            data_offset = chunk_start
            data_size = chunk_size
        pos = chunk_start + chunk_size + (chunk_size % 2)  # chunks are word-aligned

    if channels is None or sample_rate is None or bits_per_sample is None:
        raise AudioValidationError("Missing or malformed fmt chunk")
    if data_offset is None:
        raise AudioValidationError("Missing data chunk")
    return {
        "channels": channels,
        "sample_rate": sample_rate,
        "bits_per_sample": bits_per_sample,
        "data_offset": data_offset,
        "data_size": min(data_size, len(audio_bytes) - data_offset),
    }


def validate_wav(audio_bytes: bytes, max_duration_secs: int = -1) -> tuple[int, int, int]:
    if len(audio_bytes) < 44:
        raise AudioValidationError("File too small to be a WAV")
    info = _walk_chunks(audio_bytes)
    sample_rate, channels, bits_per_sample = info["sample_rate"], info["channels"], info["bits_per_sample"]
    if bits_per_sample == 0:
        raise AudioValidationError("Invalid bits_per_sample")
    duration_secs = info["data_size"] / (sample_rate * channels * (bits_per_sample // 8))
    if max_duration_secs > 0 and duration_secs > max_duration_secs:
        raise AudioValidationError(
            f"Audio too long: {duration_secs:.1f}s (max {max_duration_secs}s)"
        )
    logger.debug("WAV validated: rate=%d channels=%d bits=%d duration=%.2fs", sample_rate, channels, bits_per_sample, duration_secs)
    return sample_rate, channels, bits_per_sample


def get_duration_secs(audio_bytes: bytes) -> float:
    try:
        info = _walk_chunks(audio_bytes)
    except AudioValidationError:
        logger.warning("Duration calc failed: invalid WAV, returning 0.0")
        return 0.0
    if info["bits_per_sample"] == 0:
        return 0.0
    return info["data_size"] / (info["sample_rate"] * info["channels"] * (info["bits_per_sample"] // 8))


def convert_to_mono_wav(audio_bytes: bytes) -> bytes:
    info = _walk_chunks(audio_bytes)
    sample_rate, channels, bits_per_sample = info["sample_rate"], info["channels"], info["bits_per_sample"]
    if channels == 1:
        return audio_bytes
    raw_data = audio_bytes[info["data_offset"]:info["data_offset"] + info["data_size"]]
    if bits_per_sample == 16:
        samples = struct.unpack(f"<{len(raw_data) // 2}h", raw_data)
        mono = struct.pack(f"<{len(samples) // channels}h", *[sum(samples[i::channels]) // channels for i in range(channels)])
    else:
        mono = raw_data
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(bits_per_sample // 8)
        w.setframerate(sample_rate)
        w.writeframes(mono)
    return buf.getvalue()
