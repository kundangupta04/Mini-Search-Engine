import type { FormEvent, ReactNode } from "react";

interface DemoFormProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  buttonLabel: string;
  examples: string[];
  onExample: (example: string) => void;
  extra?: ReactNode; // e.g. a dropdown placed next to the input
  maxLength?: number;
}

/** A text box, a button and a row of clickable examples. Used by every tab. */
export default function DemoForm({
  value,
  onChange,
  onSubmit,
  placeholder,
  buttonLabel,
  examples,
  onExample,
  extra,
  maxLength = 200,
}: DemoFormProps) {
  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    onSubmit();
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex flex-wrap gap-2">
        <input
          type="text"
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          aria-label={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="min-w-0 flex-1 rounded-full border border-slate-300 bg-white px-4 py-2 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
        />
        {extra}
        <button
          type="submit"
          className="rounded-full bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {buttonLabel}
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-slate-400">Try:</span>
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onExample(example)}
            className="rounded-full bg-indigo-50 px-3 py-1 font-mono text-xs text-indigo-700 hover:bg-indigo-100"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}