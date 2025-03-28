export const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
export const mapNumberToLetter = (num: number): string => (alphabet[num] || '');
export const mapLetterToNumber = (letter: string): number => alphabet.indexOf(letter.toUpperCase());

const msPerDay = 24 * 60 * 60 * 1000;
// Convert a YYYY-MM-DD string to a day offset (days since epoch)
export const dateStringToDayOffset = (dateString: string): number =>
  Math.floor(new Date(dateString).getTime() / msPerDay);
// Convert a day offset back to an ISO date string (YYYY-MM-DD)
export const dayOffsetToISODateString = (dayOffset: number): string => {
  const date = new Date(dayOffset * msPerDay);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};
// Convert a day offset to a localized date string for slider display.
export const dayOffsetToLocalizedDateString = (
    dayOffset: number, 
    format: 'short' | 'medium' | 'large' = 'medium',
    locale = navigator.language
  ): string => {
    const date = new Date(dayOffset * msPerDay);
    
    if (format === 'short') {
      // Affiche uniquement l'année
      return new Intl.DateTimeFormat(locale, { year: 'numeric' }).format(date);
    } else if (format === 'medium') {
      // Affiche mois et année
      return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short' }).format(date);
    } else {
      // Affiche jour, mois, année
      return new Intl.DateTimeFormat(locale, { year: 'numeric', month: 'short', day: 'numeric' }).format(date);
    }
  };
  

export function createNumericMarks(minVal: number, maxVal: number, steps = 5) {
  const rangeLength = maxVal - minVal;
  if (rangeLength <= 0) return [{ value: 0, label: minVal.toString() }];
  const marks = [];
  const stepSize = Math.round(rangeLength / steps);
  for (let i = 0; i < steps; i++) {
    const val = minVal + i * stepSize;
    marks.push({ value: val - minVal, label: val.toString() });
  }
  marks.push({ value: rangeLength, label: maxVal.toString() });
  return marks;
}

export function createDateMarks(
    minDay: number, 
    maxDay: number, 
    format: 'short' | 'medium' | 'large' = 'large',
    steps = 5
  ) {
    const rangeLength = maxDay - minDay;
    if (rangeLength <= 0) {
      return [{ value: 0, label: dayOffsetToLocalizedDateString(minDay, format) }];
    }
    
    const marks = [];
    const stepSize = Math.round(rangeLength / steps);
    
    for (let i = 0; i < steps; i++) {
      const offset = i * stepSize;
      marks.push({ value: offset, label: dayOffsetToLocalizedDateString(minDay + offset, format) });
    }
    
    marks.push({ value: rangeLength, label: dayOffsetToLocalizedDateString(maxDay, format) });
    
    console.log("Marks: ", JSON.stringify(marks)); // Debugging
    return marks;
  }
  

// Check if the min and max dates are within the same year
export const isSameYear = (minDay: number, maxDay: number): boolean => {
    const minYear = new Date(minDay * msPerDay).getFullYear();
    const maxYear = new Date(maxDay * msPerDay).getFullYear();
    console.log('min:', JSON.stringify(minYear));
    console.log('max:', JSON.stringify(maxYear));
    return minYear === maxYear;
  };

// Generate marks for the slider based on date range (year, month, or full date)
export function getDateSliderMarks(minDay: number, maxDay: number) {
    const rangeLength = maxDay - minDay;
  
    let format: 'short' | 'medium' | 'large' = 'medium';
  
    // Choisir le format en fonction de l'écart de dates
    if (isSameYear(minDay, maxDay)) {
      // Si c'est la même année, on utilise le format 'medium' (mois/année)
      console.log('meme année');
      format = 'medium';
    } else if (rangeLength > 365 * 2) {
      // Si la plage couvre plus de 2 ans, on affiche seulement l'année (format 'short')
      console.log('plus d\'un an');
      format = 'short';
    } else {
      // Pour une plage d'une seule année ou de quelques mois, on peut afficher 'medium'
      console.log('quelques mois');
      format = 'medium';
    }
  
    // Créer les marques avec le format choisi
    return createDateMarks(minDay, maxDay, format);
  }