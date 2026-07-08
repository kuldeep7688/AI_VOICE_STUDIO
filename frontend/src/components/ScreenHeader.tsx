import { Settings } from 'lucide-react';

interface Props {
  title: string;
  modelPill?: string;
}

export function ScreenHeader({ title, modelPill }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <h2
          className="font-mono text-[14px] tracking-[0.14em] uppercase text-[--text]"
        >
          {title}
        </h2>
        {modelPill && (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-[4px] bg-[--accent-bg] border border-[--accent]/20 font-mono text-[10px] tracking-[0.1em] uppercase text-[--accent]"
          >
            {modelPill}
          </span>
        )}
      </div>
      <button
        className="btn-press w-8 h-8 flex items-center justify-center rounded-[6px] text-[--text-muted] hover:text-[--text] hover:bg-[--surface]"
      >
        <Settings className="w-4 h-4" strokeWidth={1.5} />
      </button>
    </div>
  );
}
