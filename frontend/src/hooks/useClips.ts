import { useState, useEffect, useCallback } from 'react';
import { getClips, deleteClip } from '../lib/api';
import { createLogger } from '../lib/logger';

const log = createLogger('clips');

interface Clip {
  id: string;
  name: string;
  filename: string;
  duration_secs: number;
  created_at: string;
  source_job_id: string;
}

export function useClips() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClips();
      setClips(data);
    } catch (err) {
      log.error('Failed to fetch clips', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = useCallback(async (id: string) => {
    try {
      log.info('Delete clip: id=%s', id);
      await deleteClip(id);
      setClips(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      log.error('Delete clip failed', err);
    }
  }, []);

  return { clips, loading, remove, refresh: fetch };
}
