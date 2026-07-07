import pytest


@pytest.mark.asyncio
async def test_transcribe_returns_job_id(async_client, sample_wav_1s):
    resp = await async_client.post(
        "/api/asr",
        files={"audio": ("test.wav", sample_wav_1s, "audio/wav")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "job_id" in data


@pytest.mark.asyncio
async def test_translate_returns_job_id(async_client, sample_wav_1s):
    resp = await async_client.post(
        "/api/asr/translate",
        files={"audio": ("test.wav", sample_wav_1s, "audio/wav")},
        data={"target_language": "fr"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "job_id" in data
