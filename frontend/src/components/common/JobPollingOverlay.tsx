interface Props {
  isActive: boolean;
  progress: number;
  step: string | null;
  stepsCompleted: number;
  totalSteps: number;
}

export function JobPollingOverlay({ isActive, progress, step, stepsCompleted, totalSteps }: Props) {
  if (!isActive) return null;

  return (
    <div className="fixed bottom-4 right-4 p-4 bg-[--surface] border border-[--border] rounded-[8px] shadow-lg min-w-56 animate-[scale-in_250ms_var(--ease-out)]">
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-[--accent] border-t-transparent rounded-full animate-spin" />
        <span className="text-sm text-[--text-muted]">
          {step ? `Running ${step}...` : 'Processing...'}
        </span>
      </div>
      {totalSteps > 1 && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-[--text-subtle] mb-1">
            <span>Step {stepsCompleted}/{totalSteps}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-[--border] rounded-full overflow-hidden">
            <div
              className="h-full bg-[--accent] rounded-full transition-[width] 300ms var(--ease-out)"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
