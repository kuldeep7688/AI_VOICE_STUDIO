import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function GlassPanel({ children, className = '', onClick }: Props) {
  return (
    <div className={`glass-panel rounded-xl ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
