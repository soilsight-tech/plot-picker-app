export type AppMessages = {
  title: string
  controls: {
    draw: string
    deleteLastPoint: string
    complete: string
    edit: string
    delete: string
  }
  validation: {
    minVertices: string
    geoBounds: string
    invalidGeometry: string
    noIntersecting: string
    maxVertices: (max: number) => string
  }
  labels: {
    area: string
    perimeter: string
    vertices: string
    near: string
  }
  country: {
    label: string
    il: string
    fr: string
    ke: string
  }
  search: {
    placeholder: string
    placeholderFr: string
    placeholderKe: string
    ariaLabel: string
    clearAriaLabel: string
    noResults: (query: string) => string
    label: string
    centered: string
  }
  instructions: {
    title: string
    step1: string
    step2: string
    step3: string
    step4: string
    step5: string
    step6: string
  }
  success: {
    created: string
  }
  approve: {
    button: string
    hint: string
    cornerCoords: string
    editAgain: string
  }
  errors: {
    required: string
    validationFallback: string
  }
  nav: {
    backToCountry: string
  }
  map: {
    loading: string
  }
}
