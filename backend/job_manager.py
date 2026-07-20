import asyncio
import traceback
import logging
import uuid
from typing import Any, Callable, Coroutine, Optional
from datetime import datetime, timezone
from models import JobStatus, JobResponse, JobResult, JobError

logger = logging.getLogger(__name__)

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
        logger.info("Job created: job=%s total_steps=%d", job_id, total_steps)
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
            logger.warning("Job update skipped: job=%s not found", job_id)
            return
        old_status = job.status.value
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
        params = [job_id, old_status]
        if status:
            params.append(job.status.value)
        else:
            params.append("")
        params.extend([job.progress, job.step, job.steps_completed, job.total_steps])
        logger.debug("Job updated: job=%s status=%s->%s progress=%d step=%s steps=%d/%d", *params)

    def start_cleanup(self):
        if self._cleanup_task is None:
            self._cleanup_task = asyncio.create_task(self._cleanup_loop())

    async def _cleanup_loop(self):
        logger.info("Cleanup loop started: expiry=%ds interval=%ds", self._expiry_seconds, self._expiry_seconds // 4)
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
            if expired:
                for jid in expired:
                    del self._jobs[jid]
                logger.info("Cleanup: removed %d expired jobs", len(expired))

    async def run_job(
        self,
        job_id: str,
        task: JobTask,
        *args,
        **kwargs,
    ):
        logger.info("Job start: job=%s", job_id)
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
            logger.info("Job done: job=%s", job_id)
        except Exception as e:
            tb = traceback.format_exc()
            logger.error("Job failed: job=%s error=%s\n%s", job_id, str(e), tb)
            job = self._jobs.get(job_id)
            self.update_job(
                job_id,
                status=JobStatus.failed,
                error=JobError(stage=job.step if job else None, message=str(e)),
            )


job_manager = JobManager()
