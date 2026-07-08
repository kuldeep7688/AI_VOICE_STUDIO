import { Panel } from '../ui/Panel';
import { SectionLabel } from '../ui/SectionLabel';

interface Result {
  audio_url?: string;
  text?: string;
  translated_text?: string;
}

interface Props {
  result: Result | null;
  completedSteps: number;
  totalSteps: number;
}

export function StageOutput({ result, completedSteps, totalSteps }: Props) {
  if (!result) return null;

  const stepLabel = `Results (${completedSteps}/${totalSteps} steps)`;

  return (
    <Panel className="p-5 space-y-4">
      <SectionLabel>{stepLabel}</SectionLabel>
      {result.audio_url && (
        <div style={{ animation: `fade-up 200ms var(--ease-out) forwards` }}>
          <audio controls src={result.audio_url} className="w-full h-8" />
        </div>
      )}
      {result.text && (
        <div style={{ animation: `fade-up 200ms var(--ease-out) forwards`, animationDelay: '40ms', opacity: 0 }}>
          <p className="font-mono text-[10px] text-[--text-muted] uppercase tracking-wider mb-1">Transcription</p>
          <p className="text-[13px] text-[--text]">{result.text}</p>
        </div>
      )}
      {result.translated_text && (
        <div style={{ animation: `fade-up 200ms var(--ease-out) forwards`, animationDelay: '80ms', opacity: 0 }}>
          <p className="font-mono text-[10px] text-[--text-muted] uppercase tracking-wider mb-1">Translation</p>
          <p className="text-[13px] text-[--text]">{result.translated_text}</p>
        </div>
      )}
    </Panel>
  );
}
