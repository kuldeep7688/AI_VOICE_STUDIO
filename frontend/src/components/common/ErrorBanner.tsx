interface Props {
  message: string | null;
  onDismiss?: () => void;
}

export function ErrorBanner({ message, onDismiss }: Props) {
  if (!message) return null;

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[--danger]/10 border border-[--danger]/30 rounded-[8px] text-[--danger] text-sm mb-4 animate-[scale-in_200ms_var(--ease-out)]">
      <span>{message}</span>
      {onDismiss && (
        <button onClick={onDismiss} className="btn-press ml-3 opacity-70 hover:opacity-100">
          ✕
        </button>
      )}
    </div>
  );
}
