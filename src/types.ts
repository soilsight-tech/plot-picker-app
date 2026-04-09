export interface PolygonValue {
  type: 'Polygon'
  coordinates: [number, number][][]
  metadata?: {
    area?: number
    perimeter?: number
    vertices?: number
    city?: string
  }
}
