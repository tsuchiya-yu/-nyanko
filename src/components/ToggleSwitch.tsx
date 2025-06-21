interface ToggleSwitchProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export default function ToggleSwitch({
  id,
  checked,
  onChange,
  label,
  disabled = false,
}: ToggleSwitchProps) {
  return (
    <div className="flex items-center">
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <label
          htmlFor={id}
          className={`block w-12 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
            checked ? 'bg-gray-600' : 'bg-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`block w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 translate-y-0.5 ${
              checked ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </label>
      </div>
      {label && (
        <span className={`ml-3 text-sm font-medium text-gray-700 ${disabled ? 'opacity-50' : ''}`}>
          {label}
        </span>
      )}
    </div>
  );
}
