import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { formatDuration } from '../../lib/blobUtils';
import { Icon } from '../ui/Icon';

interface Props {
  audioUrl: string | null;
}

export function AudioPlayer({ audioUrl }: Props) {
  const { isPlaying, duration, currentTime, volume, play, pause, seek, setVolume } = useAudioPlayer(audioUrl);

  if (!audioUrl) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="space-y-3">
        {/* Seek bar */}
        <div className="relative h-1 bg-outline/30 rounded-full cursor-pointer group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            seek(pct * duration);
          }}
        >
          <div
            className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-primary shadow-[0_0_6px_rgba(148,218,50,0.6)] opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 6px)` }}
          />
        </div>

        {/* Controls row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="btn-press text-on-surface-variant hover:text-on-surface transition-colors">
              <Icon name="skip_previous" size={20} filled />
            </button>
            <button
              onClick={isPlaying ? pause : play}
              className="btn-press w-10 h-10 flex items-center justify-center bg-primary hover:brightness-110 rounded-full text-on-primary transition-all"
            >
              <Icon name={isPlaying ? 'pause' : 'play_arrow'} size={22} filled />
            </button>
            <button className="btn-press text-on-surface-variant hover:text-on-surface transition-colors">
              <Icon name="skip_next" size={20} filled />
            </button>
          </div>

          <span className="font-mono text-[11px] text-on-surface-variant tabular-nums">
            {formatDuration(currentTime)} / {formatDuration(duration)}
          </span>

          <div className="flex items-center gap-2">
            <Icon name="volume_up" size={16} className="text-on-surface-variant" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={e => setVolume(Number(e.target.value))}
              className="w-20 h-1 bg-outline/30 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary"
            />
          </div>

          <button className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-outline/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors text-[12px] font-mono">
            <Icon name="download" size={14} />
            Export Test Clip
          </button>
        </div>
      </div>
    </div>
  );
}
