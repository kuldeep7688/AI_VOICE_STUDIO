interface Props {
  value: number;
  label: string;
  display: string;
}

export function Knob({ value, label, display }: Props) {
  const angle = -135 + (value / 100) * 270;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div
        className="relative w-12 h-12 rounded-full"
        style={{
          background: `conic-gradient(from ${angle}deg, var(--primary) 0deg, var(--primary) ${value * 2.7}deg, var(--surface-container-high) ${value * 2.7}deg, var(--surface-container-high) 360deg)`,
          border: '1px solid var(--outline-variant)',
        }}
      >
        <div
          className="absolute top-1/2 left-1/2 w-1 h-3 rounded-full bg-primary"
          style={{
            transform: `translate(-50%, -100%) rotate(${angle}deg)`,
            transformOrigin: '50% 100%',
          }}
        />
      </div>
      <span className="text-[10px] font-mono text-on-surface-variant">{label}</span>
      <span className="text-[11px] font-mono text-on-surface">{display}</span>
    </div>
  );
}
