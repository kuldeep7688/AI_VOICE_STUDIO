interface Props {
  children: string;
}

export function Pill({ children }: Props) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-primary-container/30 border border-primary/20 font-mono text-[10px] tracking-[0.1em] uppercase text-primary">
      {children}
    </span>
  );
}
