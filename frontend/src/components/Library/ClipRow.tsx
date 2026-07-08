import { Panel } from '../ui/Panel';
import { IconButton } from '../ui/IconButton';
import { VoiceTag } from '../ui/VoiceTag';
import { Play, Trash2 } from 'lucide-react';
import type { Color } from '../ui/StatusDot';

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

const COLORS: Color[] = ['green', 'blue', 'purple', 'orange'];

export function ClipRow({ id, name, filename, duration_secs, created_at, colorIndex, onPlay, onDelete }: Props) {
  const audioUrl = `/audio/clips/${filename}`;
  const voiceColor = COLORS[colorIndex % COLORS.length];
  const ts = new Date(created_at).toLocaleString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });

  return (
    <Panel className="px-4 py-3 space-y-2 hover:bg-[--surface-hover] transition-colors duration-150">
      <div className="flex items-center gap-3">
        <IconButton label="Play clip" size={32} onClick={() => onPlay(audioUrl)}>
          <Play className="w-3.5 h-3.5" strokeWidth={1.8} />
        </IconButton>
        <div className="flex-1 min-w-0">
          <p className="text-[16px] text-[--text] truncate">{name}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <VoiceTag name={`Voice ${colorIndex + 1}`} color={voiceColor} />
            <span className="font-mono text-[10px] text-[--text-muted]">{duration_secs.toFixed(1)}s</span>
            <span className="font-mono text-[10px] text-[--text-subtle]">{ts}</span>
          </div>
        </div>
        <button
          onClick={() => onDelete(id)}
          className="btn-press text-[--text-subtle] hover:text-[--danger] transition-colors shrink-0"
          aria-label="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </Panel>
  );
}
