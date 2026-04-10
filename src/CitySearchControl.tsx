import React, { useState, useRef, useEffect } from 'react'
import { searchCities, type CountryCode, type PickerCity } from './citySearchService'
import { useI18n } from './i18n/context'

interface CitySearchControlProps {
  country: CountryCode
  onCitySelect: (city: PickerCity) => void
  className?: string
}

export function CitySearchControl({ country, onCitySelect, className = '' }: CitySearchControlProps) {
  const { messages, locale } = useI18n()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<PickerCity[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (query.trim().length >= 2) {
      const searchResults = searchCities(query, country)
      setResults(searchResults)
      setIsOpen(searchResults.length > 0)
      setSelectedIndex(-1)
    } else {
      setResults([])
      setIsOpen(false)
    }
  }, [query, country])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectCity = (city: PickerCity) => {
    setQuery(city.name)
    setIsOpen(false)
    onCitySelect(city)
    inputRef.current?.blur()
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || results.length === 0) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < results.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < results.length) {
          handleSelectCity(results[selectedIndex])
        }
        break
      case 'Escape':
        setIsOpen(false)
        inputRef.current?.blur()
        break
    }
  }

  const handleClear = () => {
    setQuery('')
    setResults([])
    setIsOpen(false)
    setSelectedIndex(-1)
    inputRef.current?.focus()
  }

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true)
          }}
          placeholder={
            country === 'FR'
              ? messages.search.placeholderFr
              : country === 'KE'
                ? messages.search.placeholderKe
                : messages.search.placeholder
          }
          className="w-full px-4 py-2 ps-10 pe-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          aria-label={messages.search.ariaLabel}
          aria-autocomplete="list"
          aria-controls="city-search-results"
          aria-expanded={isOpen}
          dir={locale === 'he' ? 'rtl' : 'ltr'}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600"
            aria-label={messages.search.clearAriaLabel}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
        {!query && (
          <div className="absolute end-2 top-1/2 -translate-y-1/2 p-1 text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          id="city-search-results"
          className="absolute z-[1001] w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          role="listbox"
        >
          {results.map((city, index) => (
            <button
              key={`${city.country}-${city.english_name}-${city.long}-${city.latt}`}
              type="button"
              onClick={() => handleSelectCity(city)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`w-full px-4 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors ${
                locale === 'he' ? 'text-right' : 'text-left'
              } ${index === selectedIndex ? 'bg-blue-50' : ''}`}
              role="option"
              aria-selected={index === selectedIndex}
            >
              <div className="font-bold text-gray-900 text-lg">{city.name}</div>
              {country === 'FR' && city.english_name !== city.name.toLowerCase() && (
                <div className="text-sm text-gray-500">{city.english_name}</div>
              )}
            </button>
          ))}
        </div>
      )}

      {isOpen && query.length >= 2 && results.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-500">
          {messages.search.noResults(query)}
        </div>
      )}
    </div>
  )
}
