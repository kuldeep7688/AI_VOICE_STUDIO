import asyncio
import uuid
from typing import Any, Callable, Coroutine, Optional
from datetime import datetime, timezone
from models import JobStatus, JobResponse, JobResult, JobError

JobTask = Callable[..., Coroutine[Any, Any, JobResult]]


class Job:
    def __init__(self, job_id: str, total_steps: int = 1):
        self.job_id = job_id
        self.status = JobStatus.queued
        self.progress = 0
        self.step: Optional[str] = None
        self.steps_completed = 0
        self.total_steps = total_steps
        self.result: Optional[JobResult] = None
        self.error: Optional[JobError] = None
        self.created_at = datetime.now(timezone.utc).isoformat()

    def to_response(self) -> JobResponse:
        return JobResponse(
            job_id=self.job_id,
            status=self.status,
            progress=self.progress,
            step=self.step,
            steps_completed=self.steps_completed,
            total_steps=self.total_steps,
            result=self.result,
            error=self.error,
            created_at=self.created_at,
        )


class JobManager:
    def __init__(self, expiry_seconds: int = 3600, cleanup_interval: int = 900):
        self._jobs: dict[str, Job] = {}
        self._expiry_seconds = expiry_seconds
        self._cleanup_task: Optional[asyncio.Task] = None

    def create_job(self, total_steps: int = 1) -> str:
        job_id = f"j_{uuid.uuid4().hex[:12]}"
        self._jobs[job_id] = Job(job_id, total_steps)
        return job_id

    def get_job(self, job_id: str) -> Optional[Job]:
        return self._jobs.get(job_id)

    def update_job(
        self,
        job_id: str,
        status: Optional[JobStatus] = None,
        progress: Optional[int] = None,
        step: Optional[str] = None,
        steps_completed: Optional[int] = None,
        result: Optional[JobResult] = None,
        error: Optional[JobError] = None,
    ):
        job = self._jobs.get(job_id)
        if not job:
            return
        if status:
            job.status = status
        if progress is not None:
            job.progress = progress
        if step:
            job.step = step
        if steps_completed is not None:
            job.steps_completed = steps_completed
        if result:
            job.result = result
        if error:
            job.error = error

    def start_cleanup(self):
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def _cleanup_loop(self):
        while True:
            await asyncio.sleep(self._expiry_seconds // 4)
            now = datetime.now(timezone.utc)
            expired = [
                jid
                for jid, j in self._jobs.items()
                if j.status in (JobStatus.done, JobStatus.failed)
                and (now - datetime.fromisoformat(j.created_at)).total_seconds()
                > self._expiry_seconds
            ]
            for jid in expired:
                del self._jobs[jid]

    async def run_job(
        self,
        job_id: str,
        task: JobTask,
        *args,
        **kwargs,
    ):
        self.update_job(job_id, status=JobStatus.processing)
        try:
            result = await task(job_id, *args, **kwargs)
            self.update_job(
                job_id,
                status=JobStatus.done,
                progress=100,
                steps_completed=kwargs.get("total_steps", 1),
                result=result,
            )
        except Exception as e:
            self.update_job(
                job_id,
                status=JobStatus.failed,
                error=JobError(stage=self._jobs[job_id].step, message=str(e)),
            )


job_manager = JobManager()
