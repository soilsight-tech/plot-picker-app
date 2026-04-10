import ilCitiesRaw from './data/israeliCities.json'
import frCitiesRaw from './data/frenchCities.json'
import keCitiesRaw from './data/kenyaCities.json'

export type CountryCode = 'IL' | 'FR' | 'KE'

export interface PickerCity {
  country: CountryCode
  name: string
  english_name: string
  long: number
  latt: number
}

/** @deprecated Use PickerCity */
export type IsraeliCity = PickerCity

const IL_CITIES: PickerCity[] = (ilCitiesRaw as Omit<PickerCity, 'country'>[]).map(c => ({
  ...c,
  country: 'IL',
}))

const FR_CITIES: PickerCity[] = (frCitiesRaw as Omit<PickerCity, 'country'>[]).map(c => ({
  ...c,
  country: 'FR',
}))

const KE_CITIES: PickerCity[] = (keCitiesRaw as Omit<PickerCity, 'country'>[]).map(c => ({
  ...c,
  country: 'KE',
}))

function dataset(country: CountryCode): PickerCity[] {
  switch (country) {
    case 'FR':
      return FR_CITIES
    case 'KE':
      return KE_CITIES
    default:
      return IL_CITIES
  }
}

/** Lowercase ASCII-ish key for matching (strips accents for French). */
function fold(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
}

export function searchCities(query: string, country: CountryCode, limit = 20): PickerCity[] {
  const q = query.trim()
  if (q.length < 2) {
    return []
  }

  const normalized = fold(q)
  const cities = dataset(country)

  const filtered = cities.filter(city => {
    if (country === 'FR' || country === 'KE') {
      const en = fold(city.english_name)
      const nm = fold(city.name)
      return nm.includes(normalized) || en.includes(normalized)
    }
    // IL: Hebrew display names + English slug
    const englishMatch = city.english_name.toLowerCase().includes(normalized)
    const hebrewMatch = city.name.includes(q.trim())
    return englishMatch || hebrewMatch
  })

  const sortKey = (city: PickerCity) =>
    country === 'FR' || country === 'KE' ? fold(city.name) : city.english_name.toLowerCase()

  return filtered
    .sort((a, b) => {
      const ak = sortKey(a)
      const bk = sortKey(b)
      if (ak === normalized) return -1
      if (bk === normalized) return 1
      if (ak.startsWith(normalized)) return -1
      if (bk.startsWith(normalized)) return 1
      return ak.localeCompare(bk)
    })
    .slice(0, limit)
}
