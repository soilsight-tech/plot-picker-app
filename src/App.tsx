import { Suspense, lazy, useState, useCallback, useMemo, useEffect } from 'react'
import { CitySearchControl } from './CitySearchControl'
import type { CountryCode, PickerCity } from './citySearchService'
import { he } from './i18n-he'
import type { PolygonValue } from './types'

const LeafletPolygonMap = lazy(() =>
  import('./components/LeafletPolygonMap').then(m => ({ default: m.LeafletPolygonMap }))
)

function ringToLatLng(ring: [number, number][]) {
  const open = ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1]
  const verts = open ? ring.slice(0, -1) : ring
  return verts.map(([lng, lat]) => ({ lat, lng }))
}

const MAP_DEFAULTS: Record<CountryCode, { center: [number, number]; zoom: number }> = {
  IL: { center: [31.5, 34.8], zoom: 8 },
  FR: { center: [46.5, 2.2], zoom: 6 },
}

export default function App() {
  const [country, setCountry] = useState<CountryCode>('IL')
  const [mapCenter, setMapCenter] = useState<[number, number]>(MAP_DEFAULTS.IL.center)
  const [mapZoom, setMapZoom] = useState(MAP_DEFAULTS.IL.zoom)
  const [selectedCity, setSelectedCity] = useState<string | null>(null)
  const [draft, setDraft] = useState<PolygonValue | null>(null)
  const [approved, setApproved] = useState<PolygonValue | null>(null)

  const handleCitySelect = useCallback((city: PickerCity) => {
    setMapCenter([city.latt, city.long])
    setMapZoom(13)
    setSelectedCity(
      city.country === 'FR'
        ? city.name
        : `${city.english_name} (${city.name})`
    )
  }, [])

  const handleCountryChange = useCallback((next: CountryCode) => {
    setCountry(next)
    const d = MAP_DEFAULTS[next]
    setMapCenter(d.center)
    setMapZoom(d.zoom)
    setSelectedCity(null)
  }, [])

  useEffect(() => {
    setDraft(prev => {
      if (!prev || approved) return prev
      const nextCity = selectedCity || undefined
      if (prev.metadata?.city === nextCity) return prev
      return { ...prev, metadata: { ...prev.metadata, city: nextCity } }
    })
  }, [selectedCity, approved])

  const handlePolygonChange = useCallback(
    (
      polygon: { type: 'Polygon'; coordinates: [number, number][][] } | null,
      metrics: { area: number; perimeter: number; vertices: number } | null
    ) => {
      if (approved) return
      if (polygon && metrics) {
        setDraft({
          type: 'Polygon',
          coordinates: polygon.coordinates,
          metadata: {
            area: metrics.area,
            perimeter: metrics.perimeter,
            vertices: metrics.vertices,
            city: selectedCity || undefined,
          },
        })
      } else {
        setDraft(null)
      }
    },
    [approved, selectedCity]
  )

  const mapValue = approved ?? draft
  const readonly = !!approved

  const cornerLngLat = useMemo(() => {
    if (!approved?.coordinates?.[0]) return []
    return ringToLatLng(approved.coordinates[0]).map(p => [p.lng, p.lat] as const)
  }, [approved])

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-semibold text-gray-900">{he.title}</h1>

        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex flex-wrap items-center gap-2 mb-3" dir="rtl">
            <span className="text-sm font-medium text-gray-700">{he.country.label}</span>
            <div className="flex rounded-lg border border-gray-300 overflow-hidden bg-white divide-x divide-gray-300">
              <button
                type="button"
                onClick={() => handleCountryChange('IL')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  country === 'IL' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {he.country.il}
              </button>
              <button
                type="button"
                onClick={() => handleCountryChange('FR')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                  country === 'FR' ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {he.country.fr}
              </button>
            </div>
          </div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{he.search.label}</label>
          <CitySearchControl key={country} country={country} onCitySelect={handleCitySelect} />
          {selectedCity && (
            <p className="mt-2 text-sm text-blue-600">
              {he.search.centered} <span className="font-medium">{selectedCity}</span>
            </p>
          )}
        </div>

        <div className="border border-gray-300 rounded-lg overflow-hidden">
          <Suspense
            fallback={
              <div className="h-[500px] bg-gray-100 animate-pulse flex items-center justify-center text-gray-500">
                טוען מפה…
              </div>
            }
          >
            <LeafletPolygonMap
              value={mapValue}
              onChange={handlePolygonChange}
              center={mapCenter}
              zoom={mapZoom}
              minArea={100}
              required={false}
              readonly={readonly}
              className="w-full"
            />
          </Suspense>
        </div>

        {!approved && (
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <button
              type="button"
              disabled={!draft}
              onClick={() => draft && setApproved(draft)}
              className="px-6 py-3 rounded-lg font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow"
            >
              {he.approve.button}
            </button>
            <p className="text-sm text-gray-600">{he.approve.hint}</p>
          </div>
        )}

        {approved && (
          <div className="space-y-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-green-800">
              <div className="pb-3 mb-3 border-b border-green-200/80">
                <div className="text-xs font-medium text-green-900 mb-2">{he.approve.cornerCoords}</div>
                <ul className="font-mono text-xs text-green-900 space-y-1.5" dir="ltr">
                  {cornerLngLat.map(([lng, lat], i) => (
                    <li key={i}>
                      {i + 1}. [{lng.toFixed(6)}, {lat.toFixed(6)}]
                    </li>
                  ))}
                </ul>
              </div>
              <h2 className="text-sm font-medium mb-3 flex items-center gap-2">
                <span aria-hidden>✓</span>
                {he.success.created}
              </h2>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  {he.labels.area}:{' '}
                  <span className="font-mono">{approved.metadata?.area?.toLocaleString()} m²</span>
                </div>
                <div>
                  {he.labels.perimeter}:{' '}
                  <span className="font-mono">{approved.metadata?.perimeter?.toLocaleString()} m</span>
                </div>
                <div>
                  {he.labels.vertices}:{' '}
                  <span className="font-mono">{approved.metadata?.vertices}</span>
                </div>
                {approved.metadata?.city && (
                  <div className="col-span-2">
                    {he.labels.near}: <span className="font-medium">{approved.metadata.city}</span>
                  </div>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setApproved(null)}
              className="px-5 py-2.5 rounded-lg font-medium border border-gray-400 text-gray-800 hover:bg-gray-100"
            >
              {he.approve.editAgain}
            </button>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">{he.instructions.title}</h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
            <li>{he.instructions.step1}</li>
            <li>{he.instructions.step2}</li>
            <li>{he.instructions.step3}</li>
            <li>{he.instructions.step4}</li>
            <li>{he.instructions.step5}</li>
            <li>{he.instructions.step6}</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
