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
    throw new Error(`API ${resp.status}: ${text}`);
  }
  return resp.json();
}

export async function ttsClone(voiceId: string, text: string): Promise<string> {
  const resp = await fetch(`${BASE}/tts/clone`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ voice_id: voiceId, text }),
  });
  const data = await handleResponse<{ job_id: string }>(resp);
  return data.job_id;
}

export async function transcribe(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append('audio', audio, 'recording.wav');
  const resp = await fetch(`${BASE}/asr`, { method: 'POST', body: form });
  const data = await handleResponse<{ job_id: string }>(resp);
  return data.job_id;
}

export async function translate(audio: Blob, targetLanguage: string): Promise<string> {
  const form = new FormData();
  form.append('audio', audio, 'recording.wav');
  form.append('target_language', targetLanguage);
  const resp = await fetch(`${BASE}/asr/translate`, { method: 'POST', body: form });
  const data = await handleResponse<{ job_id: string }>(resp);
  return data.job_id;
}

export async function cleanAudio(audio: Blob): Promise<string> {
  const form = new FormData();
  form.append('audio', audio, 'recording.wav');
  const resp = await fetch(`${BASE}/clean`, { method: 'POST', body: form });
  const data = await handleResponse<{ job_id: string }>(resp);
  return data.job_id;
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
  const resp = await fetch(`${BASE}/studio/pipeline`, { method: 'POST', body: form });
  const data = await handleResponse<{ job_id: string }>(resp);
  return data.job_id;
}

export async function getJob(jobId: string): Promise<JobResponse> {
  const resp = await fetch(`${BASE}/jobs/${jobId}`);
  return handleResponse<JobResponse>(resp);
}

export async function saveVoice(name: string, audio: Blob): Promise<Voice> {
  const form = new FormData();
  form.append('name', name);
  form.append('audio', audio, 'voice.wav');
  const resp = await fetch(`${BASE}/voices`, { method: 'POST', body: form });
  return handleResponse<Voice>(resp);
}

export async function getVoices(): Promise<Voice[]> {
  const resp = await fetch(`${BASE}/voices`);
  const data = await handleResponse<{ voices: Voice[] }>(resp);
  return data.voices;
}

export async function deleteVoice(voiceId: string): Promise<void> {
  const resp = await fetch(`${BASE}/voices/${voiceId}`, { method: 'DELETE' });
  if (!resp.ok) throw new Error(`Delete failed: ${resp.status}`);
}

export async function getClips(): Promise<Clip[]> {
  const resp = await fetch(`${BASE}/clips`);
  const data = await handleResponse<{ clips: Clip[] }>(resp);
  return data.clips;
}

export async function deleteClip(clipId: string): Promise<void> {
  const resp = await fetch(`${BASE}/clips/${clipId}`, { method: 'DELETE' });
  if (!resp.ok) throw new Error(`Delete failed: ${resp.status}`);
}
