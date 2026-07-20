import { createLogger } from './logger';

const log = createLogger('api');
const BASE = 'http://localhost:8000/api';

interface JobResult {
  audio_url?: string;
  text?: string;
  translated_text?: string;
}

interface JobResponse {
  job_id: string;
  status: 'queued' | 'processing' | 'done' | 'failed';
  progress: number;
  step: string | null;
  steps_completed: number;
  total_steps: number;
  result: JobResult | null;
  error: { stage: string | null; message: string } | null;
  created_at: string;
}

interface Voice {
  id: string;
  name: string;
  filename: string;
  duration_secs: number;
  created_at: string;
}

interface Clip {
  id: string;
  name: string;
  filename: string;
  duration_secs: number;
  created_at: string;
  source_job_id: string;
}

async function handleResponse<T>(resp: Response): Promise<T> {
  if (!resp.ok) {
    const text = await resp.text();
    log.error(`${resp.url} -> ${resp.status}: ${text.slice(0, 200)}`);
    throw new Error(`API ${resp.status}: ${text}`);
  }
  if (resp.status === 204) return undefined as T;
  return resp.json();
}

async function apiCall<T>(
  url: string,
  options: RequestInit,
  bodySize?: number,
): Promise<T> {
  const method = options.method || 'GET';
  log.info(`${method} ${url}${bodySize ? ` (${bodySize}b)` : ''}`);
  const start = performance.now();
  try {
    const resp = await fetch(url, options);
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    log.debug(`${method} ${url} -> ${resp.status} (${elapsed}s)`);
    return handleResponse<T>(resp);
  } catch (err) {
    const elapsed = ((performance.now() - start) / 1000).toFixed(2);
    log.error(`${method} ${url} failed after ${elapsed}s:`, err);
    throw err;
  }
}

export async function ttsClone(voiceId: string, text: string): Promise<string> {
  const resp = await apiCall<{ job_id: string }>(`${BASE}/tts/clone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice_id: voiceId, text }),
  }, text.length);
  return resp.job_id;
}

export async function transcribe(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append('audio', audio, 'recording.wav');
  const resp = await apiCall<{ job_id: string }>(`${BASE}/asr`, { method: 'POST', body: form }, audio.size);
  return resp.job_id;
}

export async function translate(audio: Blob, targetLanguage: string): Promise<string> {
  const form = new FormData();
  form.append('audio', audio, 'recording.wav');
  form.append('target_language', targetLanguage);
  const resp = await apiCall<{ job_id: string }>(`${BASE}/asr/translate`, { method: 'POST', body: form }, audio.size);
  return resp.job_id;
}

export async function cleanAudio(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append('audio', audio, 'recording.wav');
  const resp = await apiCall<{ job_id: string }>(`${BASE}/clean`, { method: 'POST', body: form }, audio.size);
  return resp.job_id;
}

export async function runPipeline(
  audio: Blob,
  steps: string[],
  targetLanguage?: string,
  voiceId?: string
): Promise<string> {
  const form = new FormData();
  form.append('audio', audio, 'recording.wav');
  form.append('steps', steps.join(','));
  if (targetLanguage) form.append('target_language', targetLanguage);
  if (voiceId) form.append('voice_id', voiceId);
  const resp = await apiCall<{ job_id: string }>(`${BASE}/studio/pipeline`, { method: 'POST', body: form }, audio.size);
  return resp.job_id;
}

export async function getJob(jobId: string): Promise<JobResponse> {
  return apiCall<JobResponse>(`${BASE}/jobs/${jobId}`, { method: 'GET' });
}

export async function saveVoice(name: string, audio: Blob): Promise<Voice> {
  const form = new FormData();
  form.append('name', name);
  form.append('audio', audio, 'voice.wav');
  return apiCall<Voice>(`${BASE}/voices`, { method: 'POST', body: form }, audio.size);
}

export async function getVoices(): Promise<Voice[]> {
  const data = await apiCall<{ voices: Voice[] }>(`${BASE}/voices`, { method: 'GET' });
  return data.voices;
}

export async function deleteVoice(voiceId: string): Promise<void> {
  await apiCall<void>(`${BASE}/voices/${voiceId}`, { method: 'DELETE' });
}

export async function getClips(): Promise<Clip[]> {
  const data = await apiCall<{ clips: Clip[] }>(`${BASE}/clips`, { method: 'GET' });
  return data.clips;
}

export async function deleteClip(clipId: string): Promise<void> {
  await apiCall<void>(`${BASE}/clips/${clipId}`, { method: 'DELETE' });
}
