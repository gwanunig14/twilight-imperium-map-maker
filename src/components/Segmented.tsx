import type { ReactNode } from "react";

type Option<T extends string> = {
  value: T;
  label: ReactNode;
  description?: string;
};

type Warning = { show: boolean; warningText: string };

export function Segmented<T extends string>({
  selectionTitle,
  value,
  options,
  warnings,
  onChange,
}: {
  selectionTitle: string;
  value: T;
  options: Option<T>[];
  warnings?: Warning[];
  onChange: (value: T) => void;
}) {
  return (
    <div>
      <h2>{selectionTitle}</h2>
      <div className={`segmented`}>
        {options.map((option) => (
          <button
            type="button"
            key={option.value}
            className={value === option.value ? "active" : ""}
            onClick={() => onChange(option.value)}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>
      {warnings?.map(
        (warning) =>
          warning.show && (
            <p className="segment-warning">{warning.warningText}</p>
          ),
      )}
    </div>
  );
}
