'use client';

import { useRouter } from 'next/navigation';
import { cuisineCountries } from '@/lib/cuisine/atlas';
import { filterHref } from '@/lib/content/routes';
import type { ContentType } from '@/lib/db/schema';
import type { Difficulty, FilterParams } from '@/lib/content/routes';

const typeOptions: Array<{ label: string; value: ContentType }> = [
  { label: 'Receta', value: 'recipe' },
  { label: 'Tecnica', value: 'technique' },
  { label: 'Ingrediente', value: 'ingredient' },
  { label: 'Guia', value: 'guide' },
  { label: 'Especia', value: 'spice' },
  { label: 'Cocina', value: 'cuisine' },
];

const dietOptions = ['vegano', 'vegetariano', 'sin-gluten', 'keto'];

const difficultyOptions: Array<{ label: string; value: Difficulty }> = [
  { label: 'Facil', value: 'easy' },
  { label: 'Medio', value: 'medium' },
  { label: 'Dificil', value: 'hard' },
];

function same(a?: string, b?: string) {
  return a === b;
}

export default function FilterBar({ filters }: { filters: FilterParams }) {
  const router = useRouter();
  const hasFilters = Boolean(filters.type || filters.country || filters.diet || filters.difficulty);

  function go(next: FilterParams) {
    router.push(filterHref(next));
  }

  return (
    <div className="filter-bar" aria-label="Filtros de contenido">
      <div className="filter-group">
        <span>Tipo</span>
        {typeOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            data-active={same(filters.type, option.value) ? 'true' : undefined}
            onClick={() => go({ ...filters, type: same(filters.type, option.value) ? undefined : option.value })}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="filter-group">
        <span>Pais</span>
        {cuisineCountries.map((country) => (
          <button
            key={country.slug}
            type="button"
            data-active={same(filters.country, country.slug) ? 'true' : undefined}
            onClick={() => go({
              ...filters,
              country: same(filters.country, country.slug) ? undefined : country.slug,
              cuisine: same(filters.country, country.slug) ? undefined : country.cuisine,
            })}
          >
            {country.name} {country.flag}
          </button>
        ))}
      </div>

      <div className="filter-group">
        <span>Dieta</span>
        {dietOptions.map((diet) => (
          <button
            key={diet}
            type="button"
            data-active={same(filters.diet, diet) ? 'true' : undefined}
            onClick={() => go({ ...filters, diet: same(filters.diet, diet) ? undefined : diet })}
          >
            {diet.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="filter-group">
        <span>Dificultad</span>
        {difficultyOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            data-active={same(filters.difficulty, option.value) ? 'true' : undefined}
            onClick={() => go({ ...filters, difficulty: same(filters.difficulty, option.value) ? undefined : option.value })}
          >
            {option.label}
          </button>
        ))}
      </div>

      {hasFilters ? (
        <button className="filter-clear" type="button" onClick={() => go({})}>
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
