import { useState, useRef, useCallback } from 'react';

interface RecorderState {
  isRecording: boolean;
  duration: number;
  audioBlob: Blob | null;
  error: string | null;
}

export function useRecorder() {
  const [state, setState] = useState<RecorderState>({
    isRecording: false,
    duration: 0,
    audioBlob: null,
    error: null,
  });
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setState(prev => ({ ...prev, isRecording: false, audioBlob: blob }));
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: Math.floor((Date.now() - startTimeRef.current) / 1000) }));
      }, 1000);

      setState(prev => ({ ...prev, isRecording: true, audioBlob: null, error: null }));
    } catch {
      setState(prev => ({ ...prev, error: 'Microphone access denied' }));
    }
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  return { ...state, start, stop };
}
