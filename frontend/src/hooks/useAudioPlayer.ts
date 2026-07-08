import { useState, useRef, useCallback, useEffect } from 'react';

interface AudioPlayerState {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
}

export function useAudioPlayer(url: string | null) {
  const [state, setState] = useState<AudioPlayerState>({
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: 1,
  });
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!url) return;
    const audio = new Audio(url);
    audioRef.current = audio;

    audio.onloadedmetadata = () => {
      setState(prev => ({ ...prev, duration: audio.duration }));
    };
    audio.ontimeupdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };
    audio.onended = () => {
      setState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    };

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [url]);

  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play();
      setState(prev => ({ ...prev, isPlaying: true }));
    }
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  }, []);

  const setVolume = useCallback((vol: number) => {
    if (audioRef.current) {
      audioRef.current.volume = vol;
      setState(prev => ({ ...prev, volume: vol }));
    }
  }, []);

  return { ...state, play, pause, seek, setVolume };
}
