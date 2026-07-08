import { Button } from '../ui/Button';
import { Plus } from 'lucide-react';

interface Props {
  activeTab: 'voices' | 'clips';
  onTabChange: (tab: 'voices' | 'clips') => void;
  voiceCount: number;
  clipCount: number;
  onAdd: () => void;
}

export function LibraryTabs({ activeTab, onTabChange, voiceCount, clipCount, onAdd }: Props) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex gap-6">
        <button
          onClick={() => onTabChange('voices')}
          className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
            activeTab === 'voices'
              ? 'text-[--accent] border-[--accent]'
              : 'text-[--text-muted] border-transparent hover:text-[--text]'
          }`}
        >
          Voices ({voiceCount})
        </button>
        <button
          onClick={() => onTabChange('clips')}
          className={`text-sm font-medium pb-1 border-b-2 transition-colors ${
            activeTab === 'clips'
              ? 'text-[--accent] border-[--accent]'
              : 'text-[--text-muted] border-transparent hover:text-[--text]'
          }`}
        >
          Clips ({clipCount})
        </button>
      </div>
      <Button variant="outline" onClick={onAdd}>
        <Plus className="w-3.5 h-3.5" strokeWidth={1.8} />
        <span className="font-mono text-[10px] tracking-[0.1em] uppercase">Add</span>
      </Button>
    </div>
  );
}
