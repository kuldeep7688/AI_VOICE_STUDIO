import { useRef } from 'react';
import { useRecorder } from '../../hooks/useRecorder';
import { GlassPanel } from '../ui/GlassPanel';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface Props {
  onAudioReady: (blob: Blob) => void;
  hasAudio: boolean;
  voiceName: string;
  onVoiceNameChange: (name: string) => void;
  onSave: () => void;
  isSaving: boolean;
}

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
      <div className="grid grid-cols-2 gap-4">
        {/* Upload Card */}
        <GlassPanel
          className="p-6 flex flex-col items-center justify-center gap-3 min-h-[160px] cursor-pointer hover:border-primary/30 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          <Icon name="cloud_upload" size={32} className="text-on-surface-variant" />
          <p className="text-[13px] font-medium text-on-surface">Upload Audio</p>
          <p className="text-[11px] text-on-surface-variant font-mono text-center">
            DRAG & DROP
            <br />or click to browse
          </p>
          <input ref={fileInputRef} type="file" accept="audio/*" onChange={handleFile} className="hidden" />
        </GlassPanel>

        {/* Record Card */}
        <GlassPanel className="p-6 flex flex-col items-center justify-center gap-3 min-h-[160px]">
          <div className="text-[28px] font-mono text-on-surface font-bold tabular-nums">
            {isRecording
              ? `${String(Math.floor(duration / 60)).padStart(2, '0')}:${String(duration % 60).padStart(2, '0')}:${String(0).padStart(2, '0')}`
              : '00:00:00'}
          </div>
          <button
            onClick={isRecording ? stop : start}
            className={`btn-press w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all ${
              isRecording
                ? 'border-error bg-error/10 text-error'
                : 'border-tertiary text-tertiary hover:bg-tertiary/10'
            }`}
          >
            <Icon name={isRecording ? 'stop' : 'mic'} size={22} />
          </button>
          <p className="text-[11px] text-on-surface-variant font-mono">
            {isRecording ? 'Recording...' : 'Record Sample'}
          </p>
        </GlassPanel>
      </div>

      {/* Voice Name + Save */}
      <div className="flex gap-2">
        <input
          type="text"
          value={voiceName}
          onChange={e => onVoiceNameChange(e.target.value)}
          placeholder="Voice name..."
          className="flex-1 px-3 py-2.5 bg-surface-container-lowest border border-outline/30 rounded-lg text-[13px] text-on-surface placeholder-on-surface-variant/50 outline-none focus:border-primary/40 transition-colors"
        />
        <Button
          onClick={onSave}
          variant="primary-container"
          disabled={!hasAudio || !voiceName.trim() || isSaving}
        >
          <Icon name="save" size={16} />
          {isSaving ? 'Saving...' : 'Save Voice Model'}
        </Button>
      </div>

      {error && <p className="text-error text-xs">{error}</p>}
    </div>
  );
}
