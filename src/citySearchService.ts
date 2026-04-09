import cities from './data/israeliCities.json'

export interface IsraeliCity {
  name: string
  english_name: string
  long: number
  latt: number
}

export function searchCities(query: string, limit = 20): IsraeliCity[] {
  if (!query || query.trim().length < 2) {
    return []
  }

  const normalized = query.toLowerCase().trim()

  return (cities as IsraeliCity[])
    .filter(city => {
      const englishMatch = city.english_name.toLowerCase().includes(normalized)
      const hebrewMatch = city.name.includes(query.trim())
      return englishMatch || hebrewMatch
    })
    .sort((a, b) => {
      const aEnglish = a.english_name.toLowerCase()
      const bEnglish = b.english_name.toLowerCase()
      if (aEnglish === normalized) return -1
      if (bEnglish === normalized) return 1
      if (aEnglish.startsWith(normalized)) return -1
      if (bEnglish.startsWith(normalized)) return 1
      return aEnglish.localeCompare(bEnglish)
    })
    .slice(0, limit)
}
