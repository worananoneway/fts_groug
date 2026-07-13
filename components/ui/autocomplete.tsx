"use client";

import { Check, ChevronDown } from "lucide-react";
import { useId, useMemo, useState } from "react";
import type { FocusEvent, KeyboardEvent, ReactNode } from "react";

import { cn } from "./button";

export interface AutocompleteOption {
  value: string;
  label: ReactNode;
  searchText?: string;
}

interface AutocompleteProps {
  className?: string;
  disabled?: boolean;
  emptyMessage?: string;
  id?: string;
  label?: string;
  name?: string;
  onValueChange: (value: string) => void;
  options: AutocompleteOption[];
  placeholder?: string;
  value: string;
}

function getOptionText(option: AutocompleteOption): string {
  if (option.searchText) return option.searchText;
  if (typeof option.label === "string" || typeof option.label === "number") return String(option.label);
  return option.value;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("th-TH");
}

export function Autocomplete({
  className,
  disabled = false,
  emptyMessage = "ไม่พบรายการที่ค้นหา",
  id,
  label,
  name,
  onValueChange,
  options,
  placeholder = "พิมพ์เพื่อค้นหา",
  value,
}: AutocompleteProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;
  const selectedOption = options.find((option) => option.value === value);
  const selectedText = selectedOption ? getOptionText(selectedOption) : "";
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputValue = query ?? selectedText;

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalize(inputValue);

    if (!normalizedQuery || normalizedQuery === normalize(selectedText)) return options;

    return options.filter((option) => {
      const searchValue = normalize(`${getOptionText(option)} ${option.value}`);
      return searchValue.includes(normalizedQuery);
    });
  }, [inputValue, options, selectedText]);

  const menuOptions = useMemo(() => {
    if (placeholder && normalize(inputValue) === normalize(selectedText)) {
      return [{ value: "", label: placeholder, searchText: placeholder }, ...filteredOptions];
    }

    return filteredOptions;
  }, [filteredOptions, inputValue, placeholder, selectedText]);

  const openMenu = () => {
    setQuery(selectedText);
    setOpen(true);
    setActiveIndex(Math.max(0, menuOptions.findIndex((option) => option.value === value)));
  };

  const chooseOption = (option: AutocompleteOption) => {
    setQuery(option.value ? getOptionText(option) : "");
    setOpen(false);
    setActiveIndex(-1);
    onValueChange(option.value);
  };

  const commitQuery = () => {
    const normalizedQuery = normalize(inputValue);

    if (!normalizedQuery) {
      setQuery("");
      if (value) onValueChange("");
    } else {
      const exactOption = options.find(
        (option) =>
          normalize(getOptionText(option)) === normalizedQuery || normalize(option.value) === normalizedQuery,
      );

      if (exactOption) {
        setQuery(getOptionText(exactOption));
        if (exactOption.value !== value) onValueChange(exactOption.value);
      } else {
        setQuery(null);
      }
    }

    setOpen(false);
    setActiveIndex(-1);
  };

  const handleBlur = (event: FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    commitQuery();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!open) {
        openMenu();
        return;
      }
      setActiveIndex((current) => Math.min(current + 1, menuOptions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) {
        openMenu();
        setActiveIndex(menuOptions.length - 1);
        return;
      }
      setActiveIndex((current) => Math.max(current - 1, 0));
      return;
    }

    if (event.key === "Enter" && open && activeIndex >= 0 && menuOptions[activeIndex]) {
      event.preventDefault();
      chooseOption(menuOptions[activeIndex]);
      return;
    }

    if (event.key === "Escape" && open) {
      event.preventDefault();
      setQuery(null);
      setOpen(false);
      setActiveIndex(-1);
    }
  };

  const control = (
    <div className={cn("relative w-full", className)} onBlur={handleBlur}>
      <input
        aria-activedescendant={
          open && activeIndex >= 0 && activeIndex < menuOptions.length
            ? `${listboxId}-option-${activeIndex}`
            : undefined
        }
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open}
        aria-haspopup="listbox"
        autoComplete="off"
        className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-4 pr-10 font-mono text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        id={inputId}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveIndex(0);
        }}
        onClick={() => {
          if (!open) openMenu();
        }}
        onFocus={() => {
          if (!open) openMenu();
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        value={inputValue}
      />
      {name ? <input name={name} type="hidden" value={value} /> : null}
      <button
        aria-label={open ? "ปิดรายการตัวเลือก" : "เปิดรายการตัวเลือก"}
        className="absolute right-1 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
        disabled={disabled}
        onClick={() => {
          if (open) {
            setQuery(null);
            setOpen(false);
            setActiveIndex(-1);
          } else {
            openMenu();
          }
        }}
        onMouseDown={(event) => event.preventDefault()}
        tabIndex={-1}
        type="button"
      >
        <ChevronDown className={cn("h-4 w-4 transition", open && "rotate-180")} />
      </button>

      {open ? (
        <div
          className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white p-1 shadow-xl"
          id={listboxId}
          role="listbox"
        >
          {menuOptions.length === 0 ? (
            <p className="px-3 py-2 text-sm text-slate-500">{emptyMessage}</p>
          ) : (
            menuOptions.map((option, index) => (
              <button
                aria-selected={option.value === value}
                className={cn(
                  "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm text-slate-700",
                  activeIndex === index ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50",
                )}
                id={`${listboxId}-option-${index}`}
                key={`${option.value}-${index}`}
                onClick={() => chooseOption(option)}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                role="option"
                tabIndex={-1}
                type="button"
              >
                <span className="min-w-0 flex-1 whitespace-normal">{option.label}</span>
                {option.value === value ? <Check className="h-4 w-4 shrink-0" /> : null}
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );

  if (!label) return control;

  return (
    <div className="block">
      <label className="mb-1.5 block text-sm text-slate-600" htmlFor={inputId}>
        {label}
      </label>
      {control}
    </div>
  );
}
