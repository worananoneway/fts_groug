import type { ComponentType, SVGProps } from "react";

import { cn } from "./button";

export interface TabItem<T extends string> {
  key: T;
  label: string;
  icon?: ComponentType<SVGProps<SVGSVGElement>>;
}

interface TabsProps<T extends string> {
  items: Array<TabItem<T>>;
  value: T;
  onChange: (value: T) => void;
  variant?: "header" | "sub";
}

export function Tabs<T extends string>({ items, onChange, value, variant = "header" }: TabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => {
        const Icon = item.icon;
        const active = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={cn(
              "inline-flex items-center gap-2 border-b font-semibold transition",
              variant === "header" ? "border-b-[3px] px-4 py-3 text-sm" : "border-b-2 px-3 py-2 text-xs",
              active
                ? "border-amber-400 text-white"
                : "border-transparent text-blue-200 hover:text-white",
            )}
          >
            {Icon ? <Icon className="h-4 w-4" /> : null}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

