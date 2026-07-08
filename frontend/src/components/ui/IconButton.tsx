import { type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  size?: number;
  label: string;
  onClick?: () => void;
}

export function IconButton({ children, size = 36, label, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="btn-press flex items-center justify-center rounded-[6px] text-[--text-muted] hover:text-[--text] hover:bg-[--surface] border border-[--border]"
      style={{ width: size, height: size }}
    >
      {children}
    </button>
  );
}
