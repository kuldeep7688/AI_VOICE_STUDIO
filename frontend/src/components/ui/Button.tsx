import { type ReactNode } from 'react';

type Variant = 'primary' | 'primary-container' | 'secondary' | 'ghost';

interface Props {
  children: ReactNode;
  variant?: Variant;
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  onClick?: () => void;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-primary text-on-primary hover:brightness-110 font-semibold rounded-lg',
  'primary-container':
    'bg-primary-container text-on-primary-container hover:brightness-110 font-semibold rounded-lg',
  secondary:
    'border border-outline/30 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high rounded-lg',
  ghost:
    'text-on-surface-variant hover:text-on-surface hover:bg-white/5 rounded-lg',
};

export function Button({
  children,
  variant = 'secondary',
  disabled = false,
  fullWidth = false,
  className = '',
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn-press inline-flex items-center justify-center gap-2 px-4 py-2 text-sm transition-colors duration-200 ${
        disabled
          ? 'opacity-40 cursor-not-allowed pointer-events-none'
          : ''
      } ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
