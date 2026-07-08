import { useState, useCallback } from 'react';
import { ScreenHeader } from '../ScreenHeader';
import { Panel } from '../ui/Panel';
import { VoiceSampleInput } from './VoiceSampleInput';
import { ClonedVoicePicker } from './ClonedVoicePicker';
import { TextInput } from './TextInput';
import { GenerateButton } from './GenerateButton';
import { AudioPlaybackBar } from '../common/AudioPlaybackBar';
import { ErrorBanner } from '../common/ErrorBanner';
import { HelpFab } from '../ui/HelpFab';
import { useJobPolling } from '../../hooks/useJobPolling';
import { useVoices } from '../../hooks/useVoices';
import { ttsClone } from '../../lib/api';

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
      const voice = await add(voiceName.trim(), sampleBlob);
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

      <Panel className="p-6">
        <div className="flex gap-8">
          <div className="w-[340px] shrink-0 space-y-6">
            <VoiceSampleInput
              onAudioReady={setSampleBlob}
              hasAudio={!!sampleBlob}
              voiceName={voiceName}
              onVoiceNameChange={setVoiceName}
              onSave={handleSaveVoice}
              isSaving={saving}
            />
          </div>

          <div className="flex-1 space-y-6">
            <TextInput value={text} onChange={setText} />
            <ClonedVoicePicker selectedId={selectedVoiceId} onSelect={setSelectedVoiceId} />
            <GenerateButton
              disabled={!selectedVoiceId || !text.trim()}
              isLoading={isProcessing}
              onClick={handleGenerate}
            />
            <AudioPlaybackBar audioUrl={result?.audio_url || null} />
            {result?.text && (
              <div className="p-3 bg-[--bg] rounded-[6px] text-[13px] text-[--text-muted] font-mono">
                {result.text}
              </div>
            )}
          </div>
        </div>
      </Panel>

      <HelpFab />
    </>
  );
}
