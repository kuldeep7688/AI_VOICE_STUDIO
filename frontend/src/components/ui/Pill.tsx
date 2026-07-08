interface Props {
  children: string;
}

export function Pill({ children }: Props) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[--accent-bg] border border-[--accent]/20 font-mono text-[10px] tracking-[0.1em] uppercase text-[--accent]">
      {children}
    </span>
  );
}
