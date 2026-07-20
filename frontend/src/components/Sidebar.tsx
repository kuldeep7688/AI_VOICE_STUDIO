import { useAppContext } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import type { Screen } from '../context/AppContext';
import { Icon } from './ui/Icon';

const NAV_ITEMS: { id: Screen; label: string; icon: string }[] = [
  { id: 'studio-recorder', label: 'Studio', icon: 'mic_external_on' },
  { id: 'voice-cloning', label: 'Cloning', icon: 'settings_voice' },
  { id: 'library', label: 'Library', icon: 'library_music' },
];

export function Sidebar() {
  const { activeScreen, setActiveScreen } = useAppContext();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 flex flex-col bg-surface border-r border-outline/20 select-none z-30">
      {/* Brand */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center text-on-primary-container">
            <Icon name="graphic_eq" size={24} />
          </div>
          <div>
            <h1 className="text-[15px] font-heading font-bold text-on-surface leading-tight">
              AI Voice Studio
            </h1>
            <p className="font-mono text-[10px] text-on-surface-variant tracking-wide">
              Pro Audio Engine
            </p>
          </div>
        </div>
      </div>

      {/* New Project */}
      <div className="px-4 pb-4">
        <button className="btn-press w-full py-3 rounded-lg bg-primary text-on-primary font-semibold text-[13px] flex items-center justify-center gap-2">
          <Icon name="add" size={18} />
          New Project
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon }) => {
          const isActive = activeScreen === id;
          return (
            <button
              key={id}
              onClick={() => setActiveScreen(id)}
              className={`btn-press flex items-center gap-3 w-full h-11 px-4 rounded-lg text-[13px] font-medium transition-colors duration-200 ${
                isActive
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
              }`}
            >
              <Icon name={icon} size={20} filled={isActive} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-outline/20">
        <div className="flex items-center justify-between">
          <button className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors">
            <Icon name="analytics" size={16} />
            Status
          </button>
          <button className="flex items-center gap-2 text-xs text-on-surface-variant hover:text-on-surface transition-colors">
            <Icon name="help_outline" size={16} />
            Help
          </button>
        </div>
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="btn-press mt-2 w-full flex items-center justify-center gap-2 py-1.5 rounded-lg text-xs text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors"
        >
          <Icon name={theme === 'dark' ? 'light_mode' : 'dark_mode'} size={16} />
          {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  );
}
