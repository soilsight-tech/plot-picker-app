/**
 * Hebrew UI strings (RTL). Mirrors SoilSight survey polygon copy.
 */

export const he = {
  title: 'סימון החלקה על גבי מפה',
  controls: {
    draw: 'סמן שטח חלקה',
    deleteLastPoint: 'מחק נקודה אחרונה',
    complete: 'השלם שרטוט חלקה',
    edit: 'ערוך',
    delete: 'מחק',
  },
  validation: {
    minVertices: 'שטח חלקה חייב להכיל לפחות 3 קודקודים',
    geoBounds: 'שטח החלקה חייב להיות בתוך הגבולות הגיאוגרפיים המוגדרים',
    invalidGeometry: 'גיאומטריה לא חוקית של שטח חלקה',
    noIntersecting: 'לא ניתן לצייר שטח חלקה עם חיתוך עצמי!',
    maxVertices: (max: number) =>
      `הושג מקסימום של ${max} קודקודים. שטח חלקה הושלם.`,
  },
  labels: {
    area: 'שטח',
    perimeter: 'היקף',
    vertices: 'קודקודים',
    near: 'ליד',
  },
  country: {
    label: 'מדינה',
    il: 'ישראל',
    fr: 'צרפת',
  },
  search: {
    placeholder: 'חפש יישוב כדי למרכז את המפה',
    placeholderFr: 'חפש עיר בצרפת (למשל Paris, Lyon)',
    ariaLabel: 'חיפוש יישוב',
    clearAriaLabel: 'נקה חיפוש',
    noResults: (query: string) => `לא נמצאו ישובים התואמים "${query}"`,
    label: 'חפש יישוב כדי למרכז את המפה',
    centered: 'המפה ממורכזת על:',
  },
  instructions: {
    title: 'איך לסמן שטח חלקה:',
    step1: 'חפש יישוב כדי לנווט לאזור הרצוי',
    step2: 'לחץ על הכפתור הכחול "סמן שטח חלקה"',
    step3: 'לחץ על המפה כדי להוסיף נקודות (עד 20 נקודות)',
    step4: 'לחץ פעמיים (double-click) כדי לסגור את שטח החלקה',
    step5: 'לחץ "ערוך" כדי לשנות את שטח החלקה (גרור נקודות)',
    step6: 'לחץ "מחק" כדי להתחיל מחדש',
  },
  success: {
    created: 'שטח חלקה נוצר בהצלחה',
  },
  approve: {
    button: 'אשר את סימון החלקה',
    hint: 'לאחר שסיימת לסמן, לחץ לאישור והצגת הקואורדינטות.',
    cornerCoords: 'קואורדינטות הקודקודים [קו אורך, קו רוחב]',
    editAgain: 'ערוך מחדש',
  },
  errors: {
    required: 'שדה חובה',
  },
}

const validationKeys: Record<string, string> = {
  'polygon.validation.minVertices': he.validation.minVertices,
  'polygon.validation.geoBounds': he.validation.geoBounds,
  'polygon.validation.invalidGeometry': he.validation.invalidGeometry,
}

export function validationMessage(key?: string): string {
  if (!key) return 'שגיאת אימות'
  return validationKeys[key] ?? key
}
