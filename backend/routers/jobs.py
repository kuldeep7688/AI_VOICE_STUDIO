from fastapi import APIRouter, HTTPException
from models import JobResponse
from job_manager import job_manager

router = APIRouter()


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    job = job_manager.get_job(job_id)
    if not job:
        raise HTTPException(404, "Job not found")
    return job.to_response()
