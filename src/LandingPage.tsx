import type { CountryCode } from './citySearchService'

type LandingPageProps = {
  onSelectCountry: (country: CountryCode) => void
}

const OPTIONS: { country: CountryCode; title: string; description: string }[] = [
  {
    country: 'IL',
    title: 'Israel',
    description: 'Hebrew interface and Israeli places.',
  },
  {
    country: 'FR',
    title: 'France',
    description: 'English interface and French cities.',
  },
  {
    country: 'KE',
    title: 'Kenya',
    description: 'English interface and Kenya places.',
  },
]

export function LandingPage({ onSelectCountry }: LandingPageProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100" dir="ltr">
      <div className="max-w-2xl mx-auto px-4 py-16 sm:py-24">
        <header className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight">
            Voices Of Soil
          </h1>
          <p className="mt-3 text-lg text-slate-600 max-w-md mx-auto">
            Choose a country to open the map and mark your plot area.
          </p>
        </header>

        <ul className="space-y-4">
          {OPTIONS.map(({ country, title, description }) => (
            <li key={country}>
              <button
                type="button"
                onClick={() => onSelectCountry(country)}
                className="w-full text-left rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                <span className="block text-xl font-semibold text-slate-900">{title}</span>
                <span className="mt-1 block text-sm text-slate-500">{description}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
