interface Props {
  icon: string;
  title: string;
  model: string;
  selected: boolean;
  onToggle: () => void;
}

export function PipelineStageCard({ icon, title, model, selected, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      className={`btn-press flex-1 flex flex-col gap-2 p-4 rounded-[8px] border text-left transition-colors duration-200 ${
        selected
          ? 'border-accent bg-accent-solid'
          : 'border-border bg-surface hover:border-border-strong'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className={`inline-flex ${selected ? 'text-[--accent]' : 'text-[--text-muted]'}`}>
          <span className="material-symbols-outlined text-[16px]">{icon}</span>
        </span>
        <span
          className={`inline-flex items-center px-1.5 py-0.5 rounded-[4px] font-mono text-[10px] font-medium ${
            selected
              ? 'bg-[--accent] text-black'
              : 'bg-[--border] text-[--text-muted]'
          }`}
        >
          {selected ? 'ON' : 'OFF'}
        </span>
      </div>
      <div>
        <p className={`text-[13px] font-medium ${selected ? 'text-[--text]' : 'text-[--text-muted]'}`}>
          {title}
        </p>
        <p className="font-mono text-[10px] text-[--text-subtle] mt-0.5">{model}</p>
      </div>
    </button>
  );
}
