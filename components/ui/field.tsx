import type { InputHTMLAttributes, ReactNode } from "react";

import { cn } from "./button";

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  children?: ReactNode;
  label: string;
  helper?: ReactNode;
  inputClassName?: string;
}

export function Field({ children, className, helper, inputClassName, label, ...props }: FieldProps) {
  return (
    <label className={cn("block", className)}>
      <span className="mb-1.5 block text-sm text-slate-600">{label}</span>
      <input
        className={cn(
          "w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2.5 font-mono text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100",
          inputClassName,
        )}
        {...props}
      />
      {children}
      {helper ? <span className="mt-1.5 block text-xs text-slate-400">{helper}</span> : null}
    </label>
  );
}

