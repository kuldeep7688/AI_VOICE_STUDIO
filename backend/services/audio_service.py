import io
import struct
import wave
from config import settings


class AudioValidationError(Exception):
    pass


def validate_wav(audio_bytes: bytes, max_duration_secs: int = -1) -> tuple[int, int, int]:
    if len(audio_bytes) < 44:
        raise AudioValidationError("File too small to be a WAV")
    if audio_bytes[:4] != b"RIFF" or audio_bytes[8:12] != b"WAVE":
        raise AudioValidationError("Not a valid WAV file")
    channels = struct.unpack("<H", audio_bytes[22:24])[0]
    sample_rate = struct.unpack("<I", audio_bytes[24:28])[0]
    bits_per_sample = struct.unpack("<H", audio_bytes[34:36])[0]
    data_size = struct.unpack("<I", audio_bytes[40:44])[0]
    if bits_per_sample == 0:
        raise AudioValidationError("Invalid bits_per_sample")
    duration_secs = data_size / (sample_rate * channels * (bits_per_sample // 8))
    if max_duration_secs > 0 and duration_secs > max_duration_secs:
        raise AudioValidationError(
            f"Audio too long: {duration_secs:.1f}s (max {max_duration_secs}s)"
        )
    return sample_rate, channels, bits_per_sample


def get_duration_secs(audio_bytes: bytes) -> float:
    try:
        validate_wav(audio_bytes)
    except AudioValidationError:
        return 0.0
    channels = struct.unpack("<H", audio_bytes[22:24])[0]
    sample_rate = struct.unpack("<I", audio_bytes[24:28])[0]
    bits_per_sample = struct.unpack("<H", audio_bytes[34:36])[0]
    data_size = struct.unpack("<I", audio_bytes[40:44])[0]
    if bits_per_sample == 0:
        return 0.0
    return data_size / (sample_rate * channels * (bits_per_sample // 8))


def convert_to_mono_wav(audio_bytes: bytes) -> bytes:
    sample_rate, channels, bits_per_sample = validate_wav(audio_bytes)
    if channels == 1:
        return audio_bytes
    raw_data = audio_bytes[44:]
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
