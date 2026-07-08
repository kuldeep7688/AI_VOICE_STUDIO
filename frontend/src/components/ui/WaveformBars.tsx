interface Props {
  bars: number[];
  color: string;
  height?: number;
  className?: string;
}

export function WaveformBars({
  bars,
  color,
  height = 32,
  className = '',
}: Props) {
  if (bars.length === 0) {
    return (
      <div
        className={`rounded-[4px] border border-dashed border-[--border] bg-[--bg] ${className}`}
        style={{ height }}
      >
        <div className="flex items-center justify-center h-full text-[--text-subtle] font-mono text-[10px] uppercase tracking-wider">
          No audio
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex items-end gap-[2px] ${className}`}
      style={{ height }}
    >
      {bars.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-[1px]"
          style={{
            height: `${Math.max(4, v * 100)}%`,
            backgroundColor: color,
            opacity: 0.6 + v * 0.4,
          }}
        />
      ))}
    </div>
  );
}
