interface Props {
  options: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

export function SegmentedControl({ options, active, onChange }: Props) {
  return (
    <div className="inline-flex rounded-full p-1 bg-surface-container-highest">
      {options.map(opt => {
        const isActive = opt.id === active;
        return (
          <button
            key={opt.id}
            onClick={() => onChange(opt.id)}
            className={`btn-press px-6 py-2 rounded-full text-[13px] font-medium transition-colors duration-200 ${
              isActive
                ? 'bg-primary-container text-on-primary-container font-bold'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
