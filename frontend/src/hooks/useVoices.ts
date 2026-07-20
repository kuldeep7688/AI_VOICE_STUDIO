import { useState, useEffect, useCallback } from 'react';
import { getVoices, saveVoice, deleteVoice } from '../lib/api';
import { createLogger } from '../lib/logger';

const log = createLogger('voices');

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
    } catch (err) {
      log.error('Failed to fetch voices', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = useCallback(async (name: string, audio: Blob): Promise<Voice | null> => {
    try {
      log.info('Add voice: name=%s size=%d', name, audio.size);
      const voice = await saveVoice(name, audio);
      setVoices(prev => [voice, ...prev]);
      return voice;
    } catch (err) {
      log.error('Add voice failed', err);
      return null;
    }
  }, []);

  const remove = useCallback(async (id: string) => {
    try {
      log.info('Delete voice: id=%s', id);
      await deleteVoice(id);
      setVoices(prev => prev.filter(v => v.id !== id));
    } catch (err) {
      log.error('Delete voice failed', err);
    }
  }, []);

  return { voices, loading, add, remove, refresh: fetch };
}
