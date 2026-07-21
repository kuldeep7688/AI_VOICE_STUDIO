interface Props {
  title: string;
  modelPill?: string;
}

export function ScreenHeader({ title, modelPill }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <h2 className="font-heading text-[20px] font-bold text-on-surface">
          {title}
        </h2>
        {modelPill && (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary-container/30 border border-primary/20 font-mono text-[10px] tracking-[0.1em] uppercase text-primary">
            {modelPill}
          </span>
        )}
      </div>
    </div>
  );
}
