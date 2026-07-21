import { Icon } from './ui/Icon';

interface Props {
  title: string;
}

export function TopAppBar({ title }: Props) {
  return (
    <header className="sticky top-0 h-16 bg-surface/80 backdrop-blur-xl border-b border-white/10 flex items-center justify-between px-6 z-20">
      <h2 className="text-[16px] font-semibold text-on-surface">{title}</h2>
      <div className="flex items-center gap-3">
        <div className="relative">
          <span className="material-symbols-outlined text-[18px] text-on-surface-variant absolute left-3 top-1/2 -translate-y-1/2">
            search
          </span>
          <input
            type="text"
            placeholder="Search..."
            className="w-48 h-9 pl-9 pr-3 rounded-full bg-surface-container text-on-surface text-[13px] placeholder-on-surface-variant/50 outline-none border border-outline/20 focus:border-primary/40 transition-colors"
          />
        </div>
        <button className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors">
          <Icon name="notifications" size={20} />
        </button>
        <button className="w-9 h-9 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface hover:bg-white/5 transition-colors">
          <Icon name="settings" size={20} />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/30 flex items-center justify-center text-on-primary-container text-[13px] font-semibold">
          A
        </div>
      </div>
    </header>
  );
}
