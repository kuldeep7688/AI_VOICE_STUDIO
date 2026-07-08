import { useAppContext } from '../context/AppContext';
import type { Screen } from '../context/AppContext';
import { Wand2, Radio, Library } from 'lucide-react';

const NAV_ITEMS: { id: Screen; label: string; Icon: typeof Wand2 }[] = [
  { id: 'voice-cloning', label: 'Voice Cloning', Icon: Wand2 },
  { id: 'studio-recorder', label: 'Studio Recorder', Icon: Radio },
  { id: 'library', label: 'Library', Icon: Library },
];

const MODELS = [
  { name: 'magpie-tts-zeroshot', status: 'active' },
  { name: 'canary-1b', status: 'active' },
  { name: 'bnr', status: 'active' },
] as const;

export function Sidebar() {
  const { activeScreen, setActiveScreen } = useAppContext();

  return (
    <aside
      className="fixed left-0 top-0 h-screen w-[220px] flex flex-col bg-[--bg] border-r border-[--border] select-none"
    >
      <div className="px-5 pt-6 pb-5">
        <p className="font-mono text-[10px] tracking-[0.14em] uppercase text-[--accent]">
          NVIDIA
        </p>
        <h1 className="mt-1 text-[15px] font-semibold leading-tight">
          AI Voice<br />Studio
        </h1>
        <p className="mt-1 font-mono text-[11px] tracking-[0.14em] uppercase text-[--text-muted]">
          v0.1 &middot; MVP
        </p>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, Icon }) => {
          const isActive = activeScreen === id;
          return (
            <button
              key={id}
              onClick={() => setActiveScreen(id)}
              className={`btn-press relative flex items-center gap-3 w-full h-10 px-3 rounded-[6px] text-[13px] font-medium ${
                isActive
                  ? 'bg-accent-solid text-accent'
                  : 'text-text-muted hover:text-text'
              }`}
            >
              {isActive && (
                <span className="absolute left-0 top-0 bottom-0 w-[2px] bg-[--accent] rounded-r-full" />
              )}
              <Icon className="w-[17px] h-[17px] shrink-0" strokeWidth={1.8} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </nav>

      <div className="px-5 pb-5">
        <div className="border-t border-[--border] mb-4" />
        <p className="section-label mb-3">Models Active</p>
        {MODELS.map(m => (
          <div key={m.name} className="flex items-center gap-2 py-0.5">
            <span
              className="w-[6px] h-[6px] rounded-full bg-[--accent] shrink-0"
              style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
            />
            <span className="font-mono text-[11px] text-[--text-muted] truncate">
              {m.name}
            </span>
          </div>
        ))}
      </div>
    </aside>
  );
}
