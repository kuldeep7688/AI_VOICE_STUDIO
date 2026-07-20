import logging
from fastapi import APIRouter, HTTPException
from models import JobResponse
from job_manager import job_manager

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = job_manager.get_job(job_id)
    if not job:
        logger.warning("Job lookup failed: job=%s not found", job_id)
        raise HTTPException(404, "Job not found")
    logger.debug("Job poll: job=%s status=%s progress=%d", job_id, job.status.value, job.progress)
    return job.to_response()
