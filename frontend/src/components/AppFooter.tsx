export function AppFooter() {
  return (
    <footer className="fixed bottom-0 left-64 right-0 h-8 bg-surface-container-lowest border-t border-white/10 flex items-center justify-between px-4 z-20">
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-on-surface-variant font-mono">
          AI Voice Studio Engine v2.4.0
        </span>
        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
      </div>
      <div className="flex items-center gap-4">
        <button className="text-[11px] text-on-surface-variant hover:text-on-surface transition-colors font-mono">
          API Docs
        </button>
        <button className="text-[11px] text-on-surface-variant hover:text-on-surface transition-colors font-mono">
          Support
        </button>
      </div>
    </footer>
  );
}
