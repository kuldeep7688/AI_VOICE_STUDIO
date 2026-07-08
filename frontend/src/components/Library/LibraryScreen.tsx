import { useState } from 'react';
import { ScreenHeader } from '../ScreenHeader';
import { LibraryTabs } from './LibraryTabs';
import { VoiceCard } from './VoiceCard';
import { ClipRow } from './ClipRow';
import { AudioPlaybackBar } from '../common/AudioPlaybackBar';
import { HelpFab } from '../ui/HelpFab';
import { useVoices } from '../../hooks/useVoices';
import { useClips } from '../../hooks/useClips';

export function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<'voices' | 'clips'>('voices');
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);

  const { voices, remove: removeVoice } = useVoices();
  const { clips, remove: removeClip } = useClips();

  return (
    <>
      <ScreenHeader title="Library" />
      <LibraryTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        voiceCount={voices.length}
        clipCount={clips.length}
        onAdd={() => {}}
      />

      {activeTab === 'voices' && (
        <div className="grid grid-cols-2 gap-5">
          {voices.map((v, i) => (
            <VoiceCard
              key={v.id}
              id={v.id}
              name={v.name}
              filename={v.filename}
              duration_secs={v.duration_secs}
              created_at={v.created_at}
              colorIndex={i}
              onPlay={setPlayingUrl}
              onDelete={removeVoice}
            />
          ))}
          {voices.length === 0 && (
            <div className="col-span-2 text-center py-12">
              <p className="text-[--text-muted] text-sm">No saved voices yet.</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'clips' && (
        <div className="space-y-3">
          {clips.map((c, i) => (
            <ClipRow
              key={c.id}
              id={c.id}
              name={c.name}
              filename={c.filename}
              duration_secs={c.duration_secs}
              created_at={c.created_at}
              colorIndex={i}
              onPlay={setPlayingUrl}
              onDelete={removeClip}
            />
          ))}
          {clips.length === 0 && (
            <div className="text-center py-12">
              <p className="text-[--text-muted] text-sm">No saved clips yet.</p>
            </div>
          )}
        </div>
      )}

      <AudioPlaybackBar audioUrl={playingUrl} />
      <HelpFab />
    </>
  );
}
