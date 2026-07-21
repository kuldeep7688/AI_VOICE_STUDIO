import { Icon } from '../ui/Icon';

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

export function ClipRow({ id, name, filename, duration_secs, created_at, onPlay, onDelete }: Props) {
  const audioUrl = `/audio/clips/${filename}`;
  const date = new Date(created_at).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <tr className="border-b border-outline/10 hover:bg-surface-container/50 transition-colors group">
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <Icon name="audio_file" size={18} className="text-on-surface-variant shrink-0" />
          <span className="text-[13px] text-on-surface truncate max-w-[200px]">{name}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-[12px] text-on-surface-variant tabular-nums">
          {duration_secs.toFixed(1)}s
        </span>
      </td>
      <td className="px-4 py-3">
        <span className="font-mono text-[12px] text-on-surface-variant">{date}</span>
      </td>
      <td className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onPlay(audioUrl)}
            className="btn-press w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
            aria-label="Play"
          >
            <Icon name="play_circle" size={18} />
          </button>
          <a
            href={audioUrl}
            download
            className="btn-press w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
            aria-label="Download"
          >
            <Icon name="download" size={18} />
          </a>
          <button
            onClick={() => onDelete(id)}
            className="btn-press w-8 h-8 flex items-center justify-center rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors"
            aria-label="Delete"
          >
            <Icon name="delete" size={18} />
          </button>
        </div>
      </td>
    </tr>
  );
}
