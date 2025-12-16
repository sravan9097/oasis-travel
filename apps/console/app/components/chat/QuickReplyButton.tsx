'use client';

interface QuickReplyOption {
  label: string;
  value: string | number;
}

interface Props {
  options: QuickReplyOption[];
  onSelect: (value: string | number) => void;
  disabled?: boolean;
}

export function QuickReplyButton({ options, onSelect, disabled }: Props) {
  return (
    <div className="flex flex-wrap gap-2 mt-2 mb-1">
      {options.map((option, index) => (
        <button
          key={index}
          onClick={() => !disabled && onSelect(option.value)}
          disabled={disabled}
          className={`
            bg-white border-2 border-blue-600 text-blue-600 
            px-5 py-2.5 rounded-full min-w-[70px] 
            font-semibold text-[15px] tracking-wide
            transition-all duration-200
            hover:bg-blue-50 hover:shadow-md
            active:scale-95
            disabled:opacity-40 disabled:cursor-not-allowed disabled:border-gray-300
            shadow-sm
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
