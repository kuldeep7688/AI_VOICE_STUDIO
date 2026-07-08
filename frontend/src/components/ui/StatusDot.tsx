export type Color = 'green' | 'blue' | 'purple' | 'orange';

const colorMap: Record<Color, string> = {
  green: 'var(--voice-green)',
  blue: 'var(--voice-blue)',
  purple: 'var(--voice-purple)',
  orange: 'var(--voice-orange)',
};

interface Props {
  color?: Color;
  pulse?: boolean;
  size?: number;
}

export function StatusDot({ color = 'green', pulse = false, size = 6 }: Props) {
  return (
    <span
      className={`inline-block rounded-full shrink-0 ${
        pulse ? 'animate-[pulse-dot_2s_ease-in-out_infinite]' : ''
      }`}
      style={{
        width: size,
        height: size,
        backgroundColor: colorMap[color],
      }}
    />
  );
}
