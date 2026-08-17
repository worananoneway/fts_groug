"use client";

import { useLang } from "./language-provider";

export function LanguageToggle() {
  const { lang, setLang } = useLang();
  return (
    <div className="inline-flex overflow-hidden rounded-full border border-white/25 bg-white/10 text-xs font-bold">
      {(["th", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={
            lang === l
              ? "bg-amber-400 px-3 py-1.5 text-[#1a2f7a]"
              : "px-3 py-1.5 text-white/80 hover:bg-white/15"
          }
          aria-pressed={lang === l}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
