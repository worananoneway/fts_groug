import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "./button";

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  icon: ReactNode;
  tone?: "neutral" | "primary" | "danger";
}

export function IconButton({
  className,
  icon,
  label,
  tone = "neutral",
  type = "button",
  ...props
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50",
        toneClasses[tone],
        className,
      )}
      {...props}
    >
      {icon}
    </button>
  );
}

const toneClasses = {
  neutral: "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
  primary: "text-blue-600 hover:bg-blue-50",
  danger: "text-slate-300 hover:bg-red-50 hover:text-red-500",
};

