import { useRef } from 'react';
import { useRecorder } from '../../hooks/useRecorder';
import { SectionLabel } from '../ui/SectionLabel';
import { Button } from '../ui/Button';
import { IconButton } from '../ui/IconButton';
import { WaveformBars } from '../ui/WaveformBars';
import { Mic, Upload } from 'lucide-react';

interface Props {
  onAudioReady: (blob: Blob) => void;
  hasAudio: boolean;
  voiceName: string;
  onVoiceNameChange: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

const DUMMY_BARS = Array.from({ length: 24 }, () => Math.random() * 0.6 + 0.1);

export function VoiceSampleInput({
  onAudioReady, hasAudio, voiceName, onVoiceNameChange, onSave, isSaving,
}: Props) {
  const { isRecording, duration, audioBlob, error, start, stop } = useRecorder();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (audioBlob && !isRecording && !hasAudio) {
    onAudioReady(audioBlob);
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onAudioReady(file);
  };

  return (
    <div className="space-y-4">
      <SectionLabel>SAMPLE INPUT</SectionLabel>
      <p className="text-xs text-[--text-subtle]">
        Record or upload a 10–15 second voice sample
      </p>

      <div className="h-[140px] rounded-[8px] border border-dashed border-[--border] bg-[--bg] overflow-hidden">
        {hasAudio ? (
          <WaveformBars bars={DUMMY_BARS} color="var(--accent)" height={140} />
        ) : (
          <div className="flex items-center justify-center h-full text-[--text-subtle] font-mono text-[10px] uppercase tracking-wider">
            {isRecording ? (
              <WaveformBars bars={DUMMY_BARS.slice(0, 12)} color="var(--accent)" height={140} />
            ) : (
              'No sample loaded'
            )}
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button onClick={isRecording ? stop : start} variant="primary" className="flex-1">
          <Mic className="w-4 h-4" strokeWidth={1.8} />
          {isRecording ? `Stop (${duration}s)` : 'Record'}
        </Button>
        <IconButton label="Upload audio file" onClick={() => fileInputRef.current?.click()}>
          <Upload className="w-4 h-4" strokeWidth={1.5} />
        </IconButton>
        <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFile} className="hidden" />
      </div>

      <SectionLabel>VOICE NAME</SectionLabel>
      <div className="flex gap-2">
        <input
          type="text"
          value={voiceName}
          onChange={e => onVoiceNameChange(e.target.value)}
          placeholder="e.g. My Voice"
          className="flex-1 px-3 py-2 bg-[--bg] border border-[--border] rounded-[6px] text-[13px] text-[--text] placeholder-[--text-subtle] outline-none focus:border-[--accent] transition-colors duration-200"
        />
        <Button onClick={onSave} variant="secondary" disabled={!hasAudio || !voiceName.trim() || isSaving}>
          Save Voice
        </Button>
      </div>

      <SectionLabel>MODEL</SectionLabel>
      <div className="flex items-center gap-2">
        <span className="w-[6px] h-[6px] rounded-full bg-[--accent]" style={{ animation: 'pulse-dot 2s ease-in-out infinite' }} />
        <span className="font-mono text-[11px] text-[--text-muted]">magpie-tts-zeroshot</span>
      </div>

      {error && <p className="text-[--danger] text-xs">{error}</p>}
    </div>
  );
}
