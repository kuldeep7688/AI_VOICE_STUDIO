import { Panel } from '../ui/Panel';
import { Button } from '../ui/Button';
import { WaveformBars } from '../ui/WaveformBars';
import { Play, Trash2 } from 'lucide-react';

interface Props {
  id: string;
  name: string;
  filename: string;
  duration_secs: number;
  created_at: string;
  colorIndex: number;
  onPlay: (url: string) => void;
  onDelete: (id: string) => void;
}

const COLOR_VALUES = ['var(--voice-green)', 'var(--voice-blue)', 'var(--voice-purple)', 'var(--voice-orange)'];

const DUMMY_WAVEFORM = Array.from({ length: 16 }, () => Math.random() * 0.7 + 0.15);

export function VoiceCard({ id, name, filename, duration_secs, created_at, colorIndex, onPlay, onDelete }: Props) {
  const color = COLOR_VALUES[colorIndex % COLOR_VALUES.length];
  const audioUrl = `/audio/voices/${filename}`;
  const date = new Date(created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <Panel className="overflow-hidden">
      <div className="flex">
        <div className="w-[2px] shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[16px] font-semibold text-[--text]">{name}</h4>
            <button
              onClick={() => onDelete(id)}
              className="btn-press text-[--text-subtle] hover:text-[--danger] transition-colors"
              aria-label={`Delete ${name}`}
            >
              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
            </button>
          </div>
          <p className="font-mono text-[10px] text-[--text-muted]">
            {duration_secs.toFixed(1)}s · {date} · zero-shot
          </p>
          <WaveformBars bars={DUMMY_WAVEFORM} color={color} height={32} />
          <Button variant="secondary" fullWidth onClick={() => onPlay(audioUrl)}>
            <Play className="w-3 h-3" strokeWidth={1.8} />
            Play
          </Button>
        </div>
      </div>
    </Panel>
  );
}
