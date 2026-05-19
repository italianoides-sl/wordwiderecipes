export type CuisineCountry = {
  slug: string;
  code: string;
  flag: string;
  name: string;
  cuisine: string;
  terms: string[];
};

export const cuisineCountries: CuisineCountry[] = [
  { slug: 'mexico', code: 'mx', flag: '🇲🇽', name: 'Mexico', cuisine: 'mexicana', terms: ['mexicana', 'mexico', 'mexican'] },
  { slug: 'espana', code: 'es', flag: '🇪🇸', name: 'España', cuisine: 'española', terms: ['española', 'espanola', 'spain', 'spanish'] },
  { slug: 'italia', code: 'it', flag: '🇮🇹', name: 'Italia', cuisine: 'italiana', terms: ['italiana', 'italy', 'italian'] },
  { slug: 'japon', code: 'jp', flag: '🇯🇵', name: 'Japon', cuisine: 'japonesa', terms: ['japonesa', 'japon', 'japanese'] },
  { slug: 'francia', code: 'fr', flag: '🇫🇷', name: 'Francia', cuisine: 'francesa', terms: ['francesa', 'france', 'french'] },
  { slug: 'india', code: 'in', flag: '🇮🇳', name: 'India', cuisine: 'india', terms: ['india', 'indian'] },
  { slug: 'tailandia', code: 'th', flag: '🇹🇭', name: 'Tailandia', cuisine: 'tailandesa', terms: ['tailandesa', 'thai'] },
  { slug: 'peru', code: 'pe', flag: '🇵🇪', name: 'Peru', cuisine: 'peruana', terms: ['peruana', 'peru', 'peruvian'] },
  { slug: 'grecia', code: 'gr', flag: '🇬🇷', name: 'Grecia', cuisine: 'griega', terms: ['griega', 'greek'] },
  { slug: 'marruecos', code: 'ma', flag: '🇲🇦', name: 'Marruecos', cuisine: 'marroquí', terms: ['marroqui', 'marroquí', 'moroccan'] },
];

export function countryHref(locale: string, country: CuisineCountry) {
  return `/${locale}/recipes/pais/${country.slug}`;
}

export function countryFromParam(param: string) {
  const clean = decodeURIComponent(param).toLowerCase();
  return cuisineCountries.find((country) => country.slug === clean || country.code === clean || country.terms.includes(clean));
}
