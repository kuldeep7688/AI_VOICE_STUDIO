import { type ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline';

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
    'bg-[--accent] text-black hover:bg-[--accent-hover] font-semibold',
  secondary:
    'bg-[--surface] text-[--text-muted] hover:bg-[--surface-hover] hover:text-[--text] border border-[--border]',
  ghost:
    'text-[--text-muted] hover:text-[--text] hover:bg-[--surface]',
  outline:
    'border border-[--accent] text-[--accent] hover:bg-[--accent-bg]',
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
      className={`btn-press inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[6px] text-sm transition-colors duration-200 ${
        disabled
          ? 'opacity-40 cursor-not-allowed pointer-events-none'
          : ''
      } ${variantClasses[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}
