import { useState, useRef, useCallback } from 'react';
import { createLogger } from '../lib/logger';

const log = createLogger('recorder');

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
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000,
      });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const durationSecs = Math.floor((Date.now() - startTimeRef.current) / 1000);
        log.info(`Recording stopped: duration=${durationSecs}s size=${blob.size}b`);
        setState(prev => ({ ...prev, isRecording: false, audioBlob: blob }));
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setState(prev => ({ ...prev, duration: Math.floor((Date.now() - startTimeRef.current) / 1000) }));
      }, 1000);

      log.info('Recording started');
      setState(prev => ({ ...prev, isRecording: true, audioBlob: null, error: null }));
    } catch (err) {
      const message = err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Microphone access denied'
        : `Recording error: ${err instanceof Error ? err.message : String(err)}`;
      log.error(message, err);
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
