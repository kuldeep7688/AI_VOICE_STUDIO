import { useState, useEffect, useRef } from 'react';
import { getJob } from '../lib/api';
import { createLogger } from '../lib/logger';

const log = createLogger('job-polling');

interface JobResult {
  audio_url?: string;
  text?: string;
  translated_text?: string;
}

interface PollingState {
  status: 'idle' | 'queued' | 'processing' | 'done' | 'failed';
  progress: number;
  step: string | null;
  steps_completed: number;
  total_steps: number;
  result: JobResult | null;
  error: string | null;
}

export function useJobPolling(jobId: string | null) {
  const [state, setState] = useState<PollingState>({
    status: 'idle',
    progress: 0,
    step: null,
    steps_completed: 0,
    total_steps: 1,
    result: null,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!jobId) return;

    log.info(`Start polling job=${jobId}`);

    const poll = async () => {
      try {
        const job = await getJob(jobId);
        setState({
          status: job.status,
          progress: job.progress,
          step: job.step,
          steps_completed: job.steps_completed,
          total_steps: job.total_steps,
          result: job.result,
          error: job.error?.message || null,
        });
        log.debug(`Job ${jobId}: status=${job.status} progress=${job.progress}`);
        if (job.status === 'done') {
          log.info(`Job ${jobId}: done`);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
        if (job.status === 'failed') {
          log.error(`Job ${jobId}: failed`, job.error?.message);
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch (err) {
        log.error(`Job ${jobId}: poll error`, err);
        if (intervalRef.current) clearInterval(intervalRef.current);
        setState(s => ({ ...s, status: 'failed', error: 'Polling failed' }));
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) {
        log.info(`Stop polling job=${jobId}`);
        clearInterval(intervalRef.current);
      }
    };
  }, [jobId]);

  return state;
}
