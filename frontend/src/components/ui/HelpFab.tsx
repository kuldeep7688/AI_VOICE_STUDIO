import { HelpCircle } from 'lucide-react';

export function HelpFab() {
  return (
    <button
      aria-label="Help"
      className="btn-press fixed bottom-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-[--surface] border border-[--border] text-[--text-muted] hover:text-[--text] hover:bg-[--surface-hover] shadow-lg"
    >
      <HelpCircle className="w-5 h-5" strokeWidth={1.5} />
    </button>
  );
}
