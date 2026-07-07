import pytest
from job_manager import JobManager
from models import JobStatus


@pytest.fixture
def manager():
    return JobManager(expiry_seconds=3600)


def test_create_job(manager):
    job_id = manager.create_job()
    assert job_id.startswith("j_")
    assert len(job_id) > 2


def test_get_job_nonexistent(manager):
    job = manager.get_job("j_nonexistent")
    assert job is None


def test_create_and_get_job(manager):
    job_id = manager.create_job(total_steps=3)
    job = manager.get_job(job_id)
    assert job is not None
    assert job.status == JobStatus.queued
    assert job.total_steps == 3


def test_update_job(manager):
    job_id = manager.create_job()
    manager.update_job(job_id, status=JobStatus.processing, progress=50, step="transcribe")
    job = manager.get_job(job_id)
    assert job.status == JobStatus.processing
    assert job.progress == 50
    assert job.step == "transcribe"


def test_update_nonexistent_job(manager):
    manager.update_job("j_nonexistent", status=JobStatus.done)


def test_job_to_response(manager):
    job_id = manager.create_job()
    job = manager.get_job(job_id)
    resp = job.to_response()
    assert resp.job_id == job_id
    assert resp.status == JobStatus.queued
    assert resp.progress == 0
