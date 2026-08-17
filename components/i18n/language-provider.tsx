"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

import { translate, type Lang } from "@/constants/i18n";

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("th");

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("fts_lang") : null;
    if (saved === "th" || saved === "en") setLangState(saved);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof window !== "undefined") window.localStorage.setItem("fts_lang", next);
    if (typeof document !== "undefined") document.documentElement.lang = next;
  }, []);

  const t = useCallback((key: string) => translate(lang, key), [lang]);

  return <LanguageContext.Provider value={{ lang, setLang, t }}>{children}</LanguageContext.Provider>;
}

export function useLang(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  // fallback ปลอดภัยถ้าเรียกนอก provider — คืนภาษาไทยเป็นค่าเริ่มต้น
  if (!ctx) {
    return { lang: "th", setLang: () => {}, t: (key: string) => translate("th", key) };
  }
  return ctx;
}

export function useT(): (key: string) => string {
  return useLang().t;
}
