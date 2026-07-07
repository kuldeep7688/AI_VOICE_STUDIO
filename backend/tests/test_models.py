from models import (
    TTSCloneRequest,
    JobStatus,
    PipelineStep,
    Language,
    VoiceCreateRequest,
    JobResponse,
    JobResult,
    JobError,
)


def test_tts_clone_request():
    req = TTSCloneRequest(voice_id="v_test", text="Hello world")
    assert req.voice_id == "v_test"
    assert req.text == "Hello world"


def test_tts_clone_request_text_length():
    req = TTSCloneRequest(voice_id="v_test", text="a" * 5000)
    assert len(req.text) == 5000


def test_job_status_values():
    assert JobStatus.queued.value == "queued"
    assert JobStatus.processing.value == "processing"
    assert JobStatus.done.value == "done"
    assert JobStatus.failed.value == "failed"


def test_pipeline_step_values():
    assert PipelineStep.clean.value == "clean"
    assert PipelineStep.transcribe.value == "transcribe"
    assert PipelineStep.translate.value == "translate"
    assert PipelineStep.revoice.value == "revoice"


def test_language_values():
    assert Language.en.value == "en"
    assert Language.fr.value == "fr"
    assert Language.es.value == "es"
    assert Language.de.value == "de"
    assert Language.hi.value == "hi"


def test_voice_create_request():
    req = VoiceCreateRequest(name="My Voice")
    assert req.name == "My Voice"


def test_job_response():
    resp = JobResponse(
        job_id="j_test",
        status=JobStatus.queued,
        progress=0,
        step=None,
        steps_completed=0,
        total_steps=1,
        result=None,
        error=None,
        created_at="2026-01-01T00:00:00",
    )
    assert resp.job_id == "j_test"
    assert resp.status == JobStatus.queued


def test_job_result():
    result = JobResult(audio_url="/audio/clips/test.wav", text="hello")
    assert result.audio_url == "/audio/clips/test.wav"
    assert result.text == "hello"
    assert result.translated_text is None


def test_job_result_with_translation():
    result = JobResult(text="hola", translated_text="hello")
    assert result.text == "hola"
    assert result.translated_text == "hello"


def test_job_error():
    err = JobError(stage="tts", message="NIM API 500: Server error")
    assert err.stage == "tts"
    assert err.message == "NIM API 500: Server error"
