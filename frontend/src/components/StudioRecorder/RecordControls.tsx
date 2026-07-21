import { useRecorder } from '../../hooks/useRecorder';
import { SectionLabel } from '../ui/SectionLabel';
import { Panel } from '../ui/Panel';
import { Icon } from '../ui/Icon';

interface Props {
  onRecordingComplete: (blob: Blob) => void;
}

export function RecordControls({ onRecordingComplete }: Props) {
  const { isRecording, duration, audioBlob, error, start, stop } = useRecorder();

  if (audioBlob && !isRecording) {
    onRecordingComplete(audioBlob);
  }

  return (
    <Panel className="p-6 text-center">
      <SectionLabel>RECORDER</SectionLabel>
      <div className="mt-4 flex flex-col items-center gap-3">
        <button
          onClick={isRecording ? stop : start}
          className={`btn-press w-16 h-16 rounded-full flex items-center justify-center border-2 ${
            isRecording
              ? 'border-[--danger] [box-shadow:0_0_12px_rgba(239,68,68,0.3)]'
              : 'border-[--accent] hover:border-[--accent-hover]'
          } bg-[--bg] transition-all duration-200`}
        >
          <Icon
            name="mic"
            size={24}
            className={isRecording ? 'text-[--danger]' : 'text-[--accent]'}
          />
        </button>
        <p className="text-[13px] text-[--text-muted]">
          {isRecording
            ? `Recording... ${duration}s elapsed`
            : 'Click to start recording'}
        </p>
      </div>
      {error && <p className="text-[--danger] text-xs mt-2">{error}</p>}
      {audioBlob && !isRecording && (
        <p className="text-[--accent] text-xs mt-2 font-mono">
          Recorded {Math.round(audioBlob.size / 1024)}KB · {duration}s
        </p>
      )}
    </Panel>
  );
}
