import type { ComponentType, SVGProps } from "react";
import Link from "next/link";

import { cn } from "./button";

export interface TabItem<T extends string> {
  key: T;
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

export interface LinkTabItem<T extends string> extends TabItem<T> {
  href: string;
}

interface TabsProps<T extends string> {
  items: Array<TabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  variant?: "header" | "sub";
}

// แถวบนใช้แท็บขีดเส้นใต้แบบเดิม ส่วน sub tab เป็นปุ่ม pill สไตล์หน้า jobmatch ของ JobBKK
export function tabClassName(variant: "header" | "sub", active: boolean): string {
  if (variant === "header") {
    return cn(
      "inline-flex items-center gap-2 rounded-t-lg border-b-[3px] px-4 py-3 text-sm font-semibold transition",
      active
        ? "border-amber-400 bg-white/10 text-white"
        : "border-transparent text-blue-200 hover:bg-white/5 hover:text-white",
    );
  }
  return cn(
    "inline-flex items-center gap-2 rounded-lg border border-transparent px-3.5 py-2 text-xs font-semibold transition-all duration-200",
    active
      ? "bg-white text-[#1a2f7a] shadow-md shadow-slate-900/20"
      : "text-blue-200 hover:bg-white/10 hover:text-white",
  );
}

export function Tabs<T extends string>({ items, onChange, value, variant = "header" }: TabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={tabClassName(variant, item.key === value)}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

export function LinkTabs<T extends string>({
  items,
  value,
  variant = "header",
}: {
  items: Array<LinkTabItem<T>>;
  value: T;
  variant?: "header" | "sub";
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.key} href={item.href} className={tabClassName(variant, item.key === value)}>
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

