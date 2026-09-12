/** Each row must provide every language; the order is shared by all tables. */
export type TranslationRow = readonly [de: string, en: string, tr: string, ar: string, hr: string, it: string, leicht: string];
export type TranslationTable = Record<string, TranslationRow>;
export type TranslationParams = Record<string, string | number>;
