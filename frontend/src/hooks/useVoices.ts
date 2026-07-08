import { useState, useEffect, useCallback } from 'react';
import { getVoices, saveVoice, deleteVoice } from '../lib/api';

interface Voice {
  id: string;
  name: string;
  filename: string;
  duration_secs: number;
  created_at: string;
}

export function useVoices() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVoices();
      setVoices(data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (name: string, audio: Blob): Promise<Voice | null> => {
    try {
      const voice = await saveVoice(name, audio);
      setVoices(prev => [voice, ...prev]);
      return voice;
    } catch { return null; }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      await deleteVoice(id);
      setVoices(prev => prev.filter(v => v.id !== id));
    } catch { /* ignore */ }
  }, []);

  return { voices, loading, add, remove, refresh: fetch };
}
