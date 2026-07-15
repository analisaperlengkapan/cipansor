import { id } from "./id";
import { en } from "./en";
import { ar } from "./ar";

export const translations = {
  id,
  en,
  ar,
} as const;

export type Locale = keyof typeof translations;
export type TranslationKeys = typeof id;
