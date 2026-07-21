import type { HTMLAttributes } from 'react';

interface Props extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  size?: number;
  filled?: boolean;
}

export function Icon({
  name,
  size = 20,
  filled = false,
  className = '',
  style,
  ...rest
}: Props) {
  return (
    <span
      className={`material-symbols-outlined inline-flex items-center justify-center select-none ${className}`}
      style={{
        fontSize: size,
        width: size,
        height: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 400, 'GRAD' 0, 'OPSZ' ${size}`,
        lineHeight: 1,
        ...style,
      }}
      {...rest}
    >
      {name}
    </span>
  );
}
