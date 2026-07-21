import { GlassPanel } from '../ui/GlassPanel';
import { Icon } from '../ui/Icon';
import { WaveformBars } from '../ui/WaveformBars';

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
    <GlassPanel className="p-4 space-y-3 group relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '25' }}>
            <Icon name="graphic_eq" size={20} className="text-on-surface" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-on-surface">{name}</p>
            <span className="text-[10px] font-mono text-on-surface-variant uppercase tracking-wider">Voice Model</span>
          </div>
        </div>
        {/* Hover actions */}
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onDelete(id)}
            className="btn-press w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
            aria-label={`Delete ${name}`}
          >
            <Icon name="edit" size={14} />
          </button>
          <button
            onClick={() => onDelete(id)}
            className="btn-press w-7 h-7 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
            aria-label={`Delete ${name}`}
          >
            <Icon name="delete" size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onPlay(audioUrl)}
          className="btn-press w-10 h-10 rounded-full bg-primary flex items-center justify-center text-on-primary shrink-0 hover:brightness-110 transition-all"
        >
          <Icon name="play_arrow" size={20} filled />
        </button>
        <div className="flex-1">
          <WaveformBars bars={DUMMY_WAVEFORM} color={color} height={32} />
        </div>
      </div>

      <p className="text-[10px] font-mono text-on-surface-variant">
        {duration_secs.toFixed(1)}s · {date}
      </p>
    </GlassPanel>
  );
}
