import { StatusDot } from './StatusDot';
import type { Color } from './StatusDot';

interface Props {
  name: string;
  color: Color;
}

export function VoiceTag({ name, color }: Props) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <StatusDot color={color} size={6} />
      <span className="font-mono text-[11px] text-[--text-muted] truncate">
        {name}
      </span>
    </span>
  );
}
