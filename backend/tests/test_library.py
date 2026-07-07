import pytest


@pytest.mark.asyncio
async def test_save_voice(async_client, sample_wav_1s):
    resp = await async_client.post(
        "/api/voices",
        files={"audio": ("test.wav", sample_wav_1s, "audio/wav")},
        data={"name": "My Voice"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "My Voice"
    assert "id" in data
    assert data["duration_secs"] > 0


@pytest.mark.asyncio
async def test_list_voices(async_client, sample_wav_1s):
    await async_client.post(
        "/api/voices",
        files={"audio": ("test.wav", sample_wav_1s, "audio/wav")},
        data={"name": "Voice 1"},
    )
    resp = await async_client.get("/api/voices")
    assert resp.status_code == 200
    data = resp.json()
    assert "voices" in data
    assert len(data["voices"]) > 0


@pytest.mark.asyncio
async def test_delete_voice(async_client, sample_wav_1s):
    create = await async_client.post(
        "/api/voices",
        files={"audio": ("test.wav", sample_wav_1s, "audio/wav")},
        data={"name": "Delete Me"},
    )
    voice_id = create.json()["id"]
    resp = await async_client.delete(f"/api/voices/{voice_id}")
    assert resp.status_code == 204


@pytest.mark.asyncio
async def test_delete_nonexistent_voice(async_client):
    resp = await async_client.delete("/api/voices/nonexistent")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_health_endpoint(async_client):
    resp = await async_client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_models_endpoint(async_client):
    resp = await async_client.get("/api/models")
    assert resp.status_code == 200
    models = resp.json()
    assert len(models) == 3
    assert models[0]["id"] == "magpie-tts-zeroshot"
