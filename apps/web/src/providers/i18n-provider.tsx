"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { translations, Locale, TranslationKeys } from "../locales";

interface I18nContextProps {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

// Helper function to resolve dot-notated nested paths
function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split(".");
  let current = obj;
  for (const key of keys) {
    if (current && typeof current === "object" && key in current) {
      current = current[key];
    } else {
      return undefined;
    }
  }
  return typeof current === "string" ? current : undefined;
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("id");

  // Load selected locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem("app-locale") as Locale;
    if (savedLocale && (savedLocale === "id" || savedLocale === "en" || savedLocale === "ar")) {
      setLocaleState(savedLocale);
    } else {
      // Also check settings from existing settings key if set
      const savedSettings = localStorage.getItem("app-settings");
      if (savedSettings) {
        try {
          const parsed = JSON.parse(savedSettings);
          if (parsed.language && (parsed.language === "id" || parsed.language === "en")) {
            setLocaleState(parsed.language as Locale);
          }
        } catch {
          // ignore
        }
      }
    }
  }, []);

  // Update HTML elements and synchronize with localStorages
  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("app-locale", newLocale);

    // Keep app-settings in sync if it exists
    const savedSettings = localStorage.getItem("app-settings");
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        parsed.language = newLocale === "ar" ? "id" : newLocale; // fallbacks to "id" for ar in old setting schema if legacy parts need it
        localStorage.setItem("app-settings", JSON.stringify(parsed));
      } catch {
        // ignore
      }
    }
  };

  // Dynamically manage lang and dir attributes on <html> tag
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("lang", locale);
    if (locale === "ar") {
      root.setAttribute("dir", "rtl");
      root.style.direction = "rtl";
    } else {
      root.setAttribute("dir", "ltr");
      root.style.direction = "ltr";
    }
  }, [locale]);

  // Translate function t("path.to.key")
  const t = (path: string, fallback?: string): string => {
    const currentDictionary = translations[locale];
    const value = getNestedValue(currentDictionary, path);
    if (value !== undefined) {
      return value;
    }

    // Try fallback from Indonesian dictionary if not found in current dictionary
    const fallbackValue = getNestedValue(translations["id"], path);
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    return fallback || path;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
