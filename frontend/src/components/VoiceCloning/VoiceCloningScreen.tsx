import { useState, useCallback } from 'react';
import { ScreenHeader } from '../ScreenHeader';
import { GlassPanel } from '../ui/GlassPanel';
import { SectionLabel } from '../ui/SectionLabel';
import { Icon } from '../ui/Icon';
import { VoiceSampleInput } from './VoiceSampleInput';
import { ClonedVoicePicker } from './ClonedVoicePicker';
import { TextInput } from './TextInput';
import { GenerateButton } from './GenerateButton';
import { AudioPlayer } from '../common/AudioPlayer';
import { ErrorBanner } from '../common/ErrorBanner';
import { useJobPolling } from '../../hooks/useJobPolling';
import { useVoices } from '../../hooks/useVoices';
import { ttsClone } from '../../lib/api';
import { blobToWav } from '../../lib/blobUtils';
import { createLogger } from '../../lib/logger';

const log = createLogger('voice-cloning');

export function VoiceCloningScreen() {
  const [sampleBlob, setSampleBlob] = useState<Blob | null>(null);
  const [voiceName, setVoiceName] = useState('');
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [text, setText] = useState('');
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { add, refresh: refreshVoices } = useVoices();
  const { status, result, error: jobError } = useJobPolling(currentJobId);
  const isProcessing = status === 'processing' || status === 'queued';

  const handleGenerate = useCallback(async () => {
    if (!selectedVoiceId || !text.trim()) return;
    log.info(`Generate: voice=${selectedVoiceId} text_len=${text.trim().length}`);
    try {
      setError(null);
      const jobId = await ttsClone(selectedVoiceId, text.trim());
      setCurrentJobId(jobId);
    } catch {
      setError('Failed to generate speech');
    }
  }, [selectedVoiceId, text]);

  const handleSaveVoice = useCallback(async () => {
    if (!sampleBlob || !voiceName.trim()) return;
    setSaving(true);
    try {
      const wavBlob = await blobToWav(sampleBlob);
      const voice = await add(voiceName.trim(), wavBlob);
      if (voice) {
        setSelectedVoiceId(voice.id);
        setVoiceName('');
        setSampleBlob(null);
        refreshVoices();
      }
    } catch {
      setError('Failed to save voice');
    }
    setSaving(false);
  }, [sampleBlob, voiceName, add, refreshVoices]);

  return (
    <>
      <ScreenHeader title="Voice Cloning" modelPill="magpie-tts-zeroshot" />
      <ErrorBanner message={error || jobError} onDismiss={() => setError(null)} />

      <div className="grid grid-cols-12 gap-6">
        {/* Create New Voice — 7 cols */}
        <div className="col-span-7 space-y-4">
          <div className="flex items-center gap-3">
            <Icon name="settings_voice" size={22} className="text-primary" />
            <h3 className="text-[18px] font-bold text-on-surface">Create New Voice</h3>
            <span className="px-2 py-0.5 rounded-full bg-primary-container/30 border border-primary/20 font-mono text-[9px] tracking-[0.1em] uppercase text-primary">
              V2 ENGINE
            </span>
          </div>

          <VoiceSampleInput
            onAudioReady={setSampleBlob}
            hasAudio={!!sampleBlob}
            voiceName={voiceName}
            onVoiceNameChange={setVoiceName}
            onSave={handleSaveVoice}
            isSaving={saving}
          />
        </div>

        {/* Technical Specs — 5 cols */}
        <div className="col-span-5 space-y-4">
          <SectionLabel>Technical Specs</SectionLabel>

          {/* Audio Waveform Visualization */}
          <GlassPanel className="p-4">
            <div className="flex items-end gap-[2px] h-20">
              {Array.from({ length: 40 }, () => Math.random() * 0.8 + 0.1).map((v, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-[1px] bg-primary/40"
                  style={{
                    height: `${Math.max(8, v * 100)}%`,
                    opacity: 0.4 + v * 0.6,
                  }}
                />
              ))}
            </div>
          </GlassPanel>

          {/* Pro Workshop Tips */}
          <GlassPanel className="p-4">
            <SectionLabel>Pro Workshop Tips</SectionLabel>
            <ul className="mt-3 space-y-2">
              {[
                'Record in a quiet environment for best results',
                'Keep samples between 10–15 seconds',
                'Use varied intonation for richer cloning',
                'Avoid background music or echo',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-on-surface-variant">
                  <Icon name="check_circle" size={16} className="text-primary shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </GlassPanel>
        </div>

        {/* Test Voice Output — 12 cols */}
        <div className="col-span-12 space-y-4">
          <SectionLabel>Test Voice Output</SectionLabel>
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-7 space-y-4">
              <TextInput value={text} onChange={setText} />
              <ClonedVoicePicker selectedId={selectedVoiceId} onSelect={setSelectedVoiceId} />
              <GenerateButton
                disabled={!selectedVoiceId || !text.trim()}
                isLoading={isProcessing}
                onClick={handleGenerate}
              />
            </div>
            <div className="col-span-5 space-y-4">
              <AudioPlayer audioUrl={result?.audio_url || null} />
              {result?.text && (
                <GlassPanel className="p-3">
                  <p className="text-[13px] text-on-surface-variant font-mono leading-relaxed">
                    {result.text}
                  </p>
                </GlassPanel>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
