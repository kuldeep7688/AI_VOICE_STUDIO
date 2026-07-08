import { Button } from '../ui/Button';
import { Wand2 } from 'lucide-react';

interface Props {
  disabled: boolean;
  isLoading: boolean;
  onClick: () => void;
}

export function GenerateButton({ disabled, isLoading, onClick }: Props) {
  return (
    <Button onClick={onClick} variant="primary" disabled={disabled || isLoading} fullWidth>
      {isLoading ? (
        <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
      ) : (
        <Wand2 className="w-4 h-4" strokeWidth={1.8} />
      )}
      <span className="font-mono text-[11px] tracking-[0.14em] uppercase">
        {isLoading ? 'Generating...' : 'Generate'}
      </span>
    </Button>
  );
}
