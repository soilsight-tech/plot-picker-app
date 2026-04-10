import { useState, useCallback } from 'react'
import type { CountryCode } from './citySearchService'
import { LandingPage } from './LandingPage'
import { MapWorkspace } from './MapWorkspace'
import { I18nProvider, type AppLocale } from './i18n/context'

function localeForCountry(country: CountryCode): AppLocale {
  return country === 'IL' ? 'he' : 'en'
}

export default function App() {
  const [country, setCountry] = useState<CountryCode | null>(null)

  const handleSelectCountry = useCallback((c: CountryCode) => {
    setCountry(c)
  }, [])

  const handleBack = useCallback(() => {
    setCountry(null)
  }, [])

  if (country === null) {
    return <LandingPage onSelectCountry={handleSelectCountry} />
  }

  return (
    <I18nProvider key={country} locale={localeForCountry(country)}>
      <MapWorkspace country={country} onBack={handleBack} />
    </I18nProvider>
  )
}
