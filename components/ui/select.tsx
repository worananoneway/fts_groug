import type { ReactNode, SelectHTMLAttributes } from "react";

import { cn } from "./button";

export interface SelectOption {
  value: string;
  label: ReactNode;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
}

export function Select({ className, label, options, placeholder, ...props }: SelectProps) {
  const control = (
    <select
      className={cn(
        "w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100",
        className,
      )}
      {...props}
    >
      {placeholder ? <option value="">{placeholder}</option> : null}
      {options.map((option) => (
        <option key={String(option.value)} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );

  if (!label) return control;

  return (
    <label className="block">
      <span className="mb-1.5 block text-sm text-slate-600">{label}</span>
      {control}
    </label>
  );
}

