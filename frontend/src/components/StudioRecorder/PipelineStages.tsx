import { SectionLabel } from '../ui/SectionLabel';
import { PipelineStageCard } from './PipelineStageCard';
import { Zap, Activity, Languages, Wand2, ChevronRight } from 'lucide-react';

interface Props {
  steps: string[];
  targetLanguage: string;
  voiceId: string;
  voices: { id: string; name: string }[];
  onToggleStep: (step: string) => void;
  onLanguageChange: (lang: string) => void;
  onVoiceChange: (id: string) => void;
}

const STAGES = [
  { id: 'clean', title: 'Clean', model: 'BNR', icon: Zap },
  { id: 'transcribe', title: 'Transcribe', model: 'canary-1b', icon: Activity },
  { id: 'translate', title: 'Translate', model: 'canary-1b', icon: Languages },
  { id: 'revoice', title: 'Re-voice', model: 'magpie-tts', icon: Wand2 },
] as const;

export function PipelineStages({
  steps, targetLanguage, voiceId, voices,
  onToggleStep, onLanguageChange, onVoiceChange,
}: Props) {
  const enabledCount = steps.length;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <SectionLabel>PIPELINE</SectionLabel>
        <span className="font-mono text-[10px] text-[--text-muted]">
          {enabledCount} stage{enabledCount !== 1 ? 's' : ''} active
        </span>
      </div>
      <div className="flex items-center gap-2">
        {STAGES.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <PipelineStageCard
              icon={s.icon}
              title={s.title}
              model={s.model}
              selected={steps.includes(s.id)}
              onToggle={() => onToggleStep(s.id)}
            />
            {i < STAGES.length - 1 && (
              <ChevronRight className="w-4 h-4 text-[--border] shrink-0" strokeWidth={1} />
            )}
          </div>
        ))}
      </div>
      {steps.includes('translate') && (
        <select
          value={targetLanguage}
          onChange={e => onLanguageChange(e.target.value)}
          className="w-full px-3 py-2 bg-[--bg] border border-[--border] rounded-[6px] text-[13px] text-[--text] outline-none focus:border-[--accent] transition-colors"
        >
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="es">Spanish</option>
          <option value="de">German</option>
          <option value="hi">Hindi</option>
        </select>
      )}
      {steps.includes('revoice') && (
        <select
          value={voiceId}
          onChange={e => onVoiceChange(e.target.value)}
          className="w-full px-3 py-2 bg-[--bg] border border-[--border] rounded-[6px] text-[13px] text-[--text] outline-none focus:border-[--accent] transition-colors"
        >
          <option value="">Select target voice...</option>
          {voices.map(v => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
