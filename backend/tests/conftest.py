import struct
import wave
import io
import pytest
from httpx import AsyncClient, ASGITransport
from main import app


def sample_wav(duration_secs: float = 1.0, sample_rate: int = 16000) -> bytes:
    """Generate a simple WAV file with silence for testing."""
    num_samples = int(sample_rate * duration_secs)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(b"\x00\x00" * num_samples)
    return buf.getvalue()


@pytest.fixture
def sample_wav_1s() -> bytes:
    return sample_wav(1.0)


@pytest.fixture
def sample_wav_20s() -> bytes:
    return sample_wav(20.0)


@pytest.fixture
async def async_client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
