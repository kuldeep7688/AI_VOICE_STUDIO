import { useAudioPlayer } from '../../hooks/useAudioPlayer';
import { formatDuration } from '../../lib/blobUtils';

interface Props {
  audioUrl: string | null;
}

export function AudioPlaybackBar({ audioUrl }: Props) {
  const { isPlaying, duration, currentTime, play, pause, seek } = useAudioPlayer(audioUrl);

  if (!audioUrl) return null;

  return (
    <div className="flex items-center gap-4 p-3 bg-[--bg] rounded-[8px] border border-[--border]">
      <button
        onClick={isPlaying ? pause : play}
        className="btn-press w-10 h-10 flex items-center justify-center bg-[--accent] hover:bg-[--accent-hover] rounded-full text-black shrink-0"
      >
        {isPlaying ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
        )}
      </button>
      <div className="flex-1">
        <input
          type="range"
          min={0}
          max={duration || 0}
          value={currentTime}
          onChange={e => seek(Number(e.target.value))}
          className="w-full h-1 bg-[--border] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[--accent]"
        />
      </div>
      <span className="font-mono text-[11px] text-[--text-muted] tabular-nums w-20 text-right shrink-0">
        {formatDuration(currentTime)} / {formatDuration(duration)}
      </span>
    </div>
  );
}
