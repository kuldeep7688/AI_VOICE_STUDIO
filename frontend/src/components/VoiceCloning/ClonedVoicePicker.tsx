import { useVoices } from '../../hooks/useVoices';
import { SectionLabel } from '../ui/SectionLabel';
import { StatusDot } from '../ui/StatusDot';
import type { Color } from '../ui/StatusDot';

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
}

const VOICE_COLORS: Color[] = ['green', 'blue', 'purple', 'orange'];

export function ClonedVoicePicker({ selectedId, onSelect }: Props) {
  const { voices } = useVoices();

  return (
    <div className="space-y-3">
      <SectionLabel>CLONED VOICE</SectionLabel>
      <div className="grid grid-cols-2 gap-3">
        {voices.map((v, i) => {
          const voiceColor = VOICE_COLORS[i % VOICE_COLORS.length];
          const isSelected = selectedId === v.id;
          return (
            <button
              key={v.id}
              onClick={() => onSelect(v.id)}
              className={`btn-press flex items-center justify-between p-3 rounded-[6px] border text-left ${
                isSelected
                  ? 'border-accent bg-accent-solid'
                  : 'border-border bg-bg hover:border-border-strong'
              } transition-colors duration-200`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <StatusDot color={voiceColor} size={6} />
                <span className="text-[13px] text-[--text] truncate">{v.name}</span>
              </div>
              <span className="font-mono text-[10px] text-[--text-muted] shrink-0 ml-2">
                {v.duration_secs.toFixed(1)}s
              </span>
            </button>
          );
        })}
        {voices.length === 0 && (
          <p className="col-span-2 text-center text-xs text-[--text-subtle] py-4">
            No saved voices yet. Record and save a voice sample first.
          </p>
        )}
      </div>
    </div>
  );
}
