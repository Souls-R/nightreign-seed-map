import { useState } from 'react';
import type { Locale } from './i18n';

export function useLocale(defaultLocale: Locale = 'zh') {
  const [locale, setLocale] = useState<Locale>(defaultLocale);
  return { locale, setLocale };
}
