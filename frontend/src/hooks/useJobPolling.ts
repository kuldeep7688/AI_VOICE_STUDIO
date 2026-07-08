import { useState, useEffect, useRef } from 'react';
import { getJob } from '../lib/api';

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
        if (job.status === 'done' || job.status === 'failed') {
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      } catch {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setState(s => ({ ...s, status: 'failed', error: 'Polling failed' }));
      }
    };

    poll();
    intervalRef.current = setInterval(poll, 2000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [jobId]);

  return state;
}
