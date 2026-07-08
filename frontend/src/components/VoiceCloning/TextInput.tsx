import { SectionLabel } from '../ui/SectionLabel';

interface Props {
  value: string;
  onChange: (text: string) => void;
}

function estimateAudioSeconds(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.round(words * 0.4);
}

export function TextInput({ value, onChange }: Props) {
  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const estimatedSecs = estimateAudioSeconds(value);

  return (
    <div className="space-y-2">
      <SectionLabel>GENERATE SPEECH</SectionLabel>
      <p className="text-xs text-[--text-subtle]">
        Type text and select a cloned voice to synthesize
      </p>
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Enter the text you want your cloned voice to speak..."
        rows={6}
        className="w-full min-h-[180px] px-3 py-3 bg-[--bg] border border-[--border] rounded-[6px] text-[14px] text-[--text] placeholder-[--text-subtle] outline-none focus:border-[--accent] resize-none transition-colors duration-200"
      />
      <div className="flex justify-between">
        <span className="font-mono text-[10px] text-[--text-muted]">
          {charCount} chars · {wordCount} words
        </span>
        <span className="font-mono text-[10px] text-[--text-muted]">
          ~{estimatedSecs}s estimated output
        </span>
      </div>
    </div>
  );
}
