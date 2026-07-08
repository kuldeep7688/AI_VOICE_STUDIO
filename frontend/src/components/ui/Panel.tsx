import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
}

export function Panel({ children, className }: Props) {
  return (
    <div
      className={`rounded-[8px] border border-[--border] bg-[--surface] ${className || ''}`}
    >
      {children}
    </div>
  );
}
