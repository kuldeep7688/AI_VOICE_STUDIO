import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';

interface Props {
  disabled: boolean;
  isLoading: boolean;
  step: string | null;
  stepsCompleted: number;
  totalSteps: number;
  onClick: () => void;
}

export function RunPipelineButton({ disabled, isLoading, step, stepsCompleted, totalSteps, onClick }: Props) {
  return (
    <Button onClick={onClick} variant="primary" disabled={disabled || isLoading} fullWidth>
      <Icon name="play_arrow" size={16} />
      <span className="font-mono text-[11px] tracking-[0.14em] uppercase">
        {isLoading
          ? `Running ${step || ''} (${stepsCompleted}/${totalSteps})`
          : 'Run Pipeline'}
      </span>
    </Button>
  );
}
