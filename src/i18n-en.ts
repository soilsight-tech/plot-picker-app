import type { AppMessages } from './i18n/types'

export const en: AppMessages = {
  title: 'Mark your plot on the map',
  controls: {
    draw: 'Draw plot area',
    deleteLastPoint: 'Delete last point',
    complete: 'Complete plot',
    edit: 'Edit',
    delete: 'Delete',
  },
  validation: {
    minVertices: 'The plot must have at least 3 vertices',
    geoBounds: 'The plot must be within the defined geographic bounds',
    invalidGeometry: 'Invalid plot geometry',
    noIntersecting: 'The plot cannot intersect itself',
    maxVertices: (max: number) =>
      `Maximum of ${max} vertices reached. The plot was completed.`,
  },
  labels: {
    area: 'Area',
    perimeter: 'Perimeter',
    vertices: 'Vertices',
    near: 'Near',
  },
  country: {
    label: 'Country',
    il: 'Israel',
    fr: 'France',
    ke: 'Kenya',
  },
  search: {
    placeholder: 'Search for a place to center the map',
    placeholderFr: 'Search a city in France (e.g. Paris, Lyon)',
    placeholderKe: 'Search a city in Kenya (e.g. Mombasa, Kisumu)',
    ariaLabel: 'Search places',
    clearAriaLabel: 'Clear search',
    noResults: (query: string) => `No places match "${query}"`,
    label: 'Search for a place to center the map',
    centered: 'Map centered on:',
  },
  instructions: {
    title: 'How to mark a plot:',
    step1: 'Search for a place to go to the right area',
    step2: 'Tap the blue “Draw plot area” button',
    step3: 'Tap the map to add points (up to 20 points)',
    step4: 'Double-click to close the plot',
    step5: 'Tap “Edit” to adjust the plot (drag points)',
    step6: 'Tap “Delete” to start over',
  },
  success: {
    created: 'Plot created successfully',
  },
  approve: {
    button: 'Approve plot',
    hint: 'When you are done drawing, tap approve to see coordinates.',
    cornerCoords: 'Corner coordinates [longitude, latitude]',
    editAgain: 'Edit again',
  },
  errors: {
    required: 'Required field',
    validationFallback: 'Validation error',
  },
  nav: {
    backToCountry: '← Choose another country',
  },
  map: {
    loading: 'Loading map…',
  },
}
