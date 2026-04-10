import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { AppMessages } from './types'
import { he } from '../i18n-he'
import { en } from '../i18n-en'
import { validationMessage as resolveValidation } from '../i18n-he'

export type AppLocale = 'he' | 'en'

type I18nContextValue = {
  locale: AppLocale
  messages: AppMessages
  dir: 'rtl' | 'ltr'
  validationMessage: (key?: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({
  locale,
  children,
}: {
  locale: AppLocale
  children: ReactNode
}) {
  const value = useMemo((): I18nContextValue => {
    const messages = locale === 'he' ? he : en
    return {
      locale,
      messages,
      dir: locale === 'he' ? 'rtl' : 'ltr',
      validationMessage: (key?: string) => resolveValidation(key, messages),
    }
  }, [locale])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return ctx
}
