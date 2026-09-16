import type { ButtonHTMLAttributes, ReactNode } from "react";

import { LoadingSpinner } from "@/components/loading/main";

type ButtonVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: ReactNode;
  /** กำลังทำงาน — ขึ้นสปินเนอร์แทนไอคอนและกดซ้ำไม่ได้ */
  isLoading?: boolean;
  /** ข้อความตอนกำลังทำงาน (ไม่ใส่ = ใช้ข้อความเดิม) */
  loadingLabel?: ReactNode;
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

export function Button({
  children,
  className,
  icon,
  isLoading = false,
  loadingLabel,
  size = "md",
  variant = "primary",
  type = "button",
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      aria-busy={isLoading || undefined}
      disabled={disabled || isLoading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 disabled:cursor-not-allowed disabled:opacity-50",
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {isLoading ? <LoadingSpinner className={spinnerClasses[size]} /> : icon}
      {isLoading ? (loadingLabel ?? children) : children}
    </button>
  );
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-2.5 text-sm",
  lg: "px-5 py-4 text-base",
};

// สปินเนอร์ในปุ่ม — ขอบบางลงและสีตามขนาดปุ่ม
const spinnerClasses: Record<ButtonSize, string> = {
  sm: "h-3.5 w-3.5 border-2",
  md: "h-4 w-4 border-2",
  lg: "h-5 w-5 border-2",
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-blue-600 text-white shadow-sm shadow-blue-900/20 hover:bg-blue-700",
  secondary: "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  success: "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700",
  warning: "bg-amber-500 text-white shadow-sm hover:bg-amber-600",
  danger: "bg-red-600 text-white shadow-sm hover:bg-red-700",
  ghost: "bg-transparent text-slate-600 hover:bg-slate-100",
};
