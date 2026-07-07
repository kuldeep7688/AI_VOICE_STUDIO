import pytest


@pytest.mark.asyncio
async def test_tts_clone_endpoint_returns_job_id(async_client, sample_wav_1s):
    # First save a voice to get a voice_id
    resp = await async_client.post(
        "/api/voices",
        files={"audio": ("test.wav", sample_wav_1s, "audio/wav")},
        data={"name": "Test Voice"},
    )
    assert resp.status_code == 200
    voice_id = resp.json()["id"]

    # Clone TTS
    resp = await async_client.post(
        "/api/tts/clone",
        json={"voice_id": voice_id, "text": "Hello world"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "job_id" in data
    assert data["status"] == "queued"
