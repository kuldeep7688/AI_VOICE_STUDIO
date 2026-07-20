import { useState, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { SegmentedControl } from '../ui/SegmentedControl';
import { GlassPanel } from '../ui/GlassPanel';
import { Icon } from '../ui/Icon';
import { VoiceCard } from './VoiceCard';
import { ClipRow } from './ClipRow';
import { AudioPlaybackBar } from '../common/AudioPlaybackBar';
import { useVoices } from '../../hooks/useVoices';
import { useClips } from '../../hooks/useClips';
import { createLogger } from '../../lib/logger';

const log = createLogger('library');

export function LibraryScreen() {
  const [activeTab, setActiveTab] = useState<'voices' | 'clips'>('voices');
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const { setActiveScreen } = useAppContext();

  const { voices, remove: removeVoice } = useVoices();
  const { clips, remove: removeClip } = useClips();

  return (
    <>
      <div className="mb-6">
        <h2 className="text-[22px] font-bold text-on-surface">Asset Library</h2>
        <p className="text-[13px] text-on-surface-variant mt-1">
          Browse and manage your saved voices and generated clips
        </p>
      </div>

      <SegmentedControl
        options={[
          { id: 'voices', label: `Voices (${voices.length})` },
          { id: 'clips', label: `Clips (${clips.length})` },
        ]}
        active={activeTab}
        onChange={useCallback((id: string) => {
          log.info(`Tab switch: ${id}`);
          setActiveTab(id as 'voices' | 'clips');
        }, [])}
      />

      <div className="mt-6">
        {activeTab === 'voices' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
            {/* Clone New Voice add card */}
            <GlassPanel
              className="p-6 flex flex-col items-center justify-center gap-3 min-h-[200px] border-dashed cursor-pointer hover:border-primary/40 transition-colors"
              onClick={() => setActiveScreen('voice-cloning')}
            >
              <Icon name="add_circle" size={36} className="text-on-surface-variant" />
              <p className="text-[14px] font-medium text-on-surface">Clone New Voice</p>
              <p className="text-[11px] text-on-surface-variant font-mono text-center">
                Go to Voice Cloning
              </p>
            </GlassPanel>
            {voices.length === 0 && (
              <div className="col-span-full flex flex-col items-center gap-4 py-16">
                <Icon name="folder_off" size={48} className="text-on-surface-variant" />
                <p className="text-[14px] text-on-surface-variant">No saved voices yet</p>
                <button
                  onClick={() => setActiveScreen('voice-cloning')}
                  className="btn-press px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold"
                >
                  Go to Studio
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'clips' && (
          <>
            {clips.length > 0 ? (
              <GlassPanel className="overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-outline/20">
                      <th className="text-left px-4 py-3 text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">Name</th>
                      <th className="text-left px-4 py-3 text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">Duration</th>
                      <th className="text-left px-4 py-3 text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">Created</th>
                      <th className="text-right px-4 py-3 text-[11px] font-mono text-on-surface-variant uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
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
                  </tbody>
                </table>
              </GlassPanel>
            ) : (
              <div className="flex flex-col items-center gap-4 py-16">
                <Icon name="folder_off" size={48} className="text-on-surface-variant" />
                <p className="text-[14px] text-on-surface-variant">No clips generated yet</p>
                <button
                  onClick={() => setActiveScreen('studio-recorder')}
                  className="btn-press px-4 py-2 rounded-lg bg-primary text-on-primary text-[13px] font-semibold"
                >
                  Go to Studio
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <AudioPlaybackBar audioUrl={playingUrl} />
    </>
  );
}
