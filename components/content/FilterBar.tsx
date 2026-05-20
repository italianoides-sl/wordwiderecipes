'use client';

import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
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
  const [search, setSearch] = useState('');
  const hasFilters = Boolean(filters.type || filters.country || filters.diet || filters.difficulty);

  useEffect(() => {
    if (window.location.hash === '#browse-search') {
      document.getElementById('browse-search')?.focus();
    }
  }, []);

  function go(next: FilterParams) {
    router.push(filterHref(next));
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = search.trim();
    if (value) router.push(`/search?q=${encodeURIComponent(value)}`);
  }

  return (
    <div className="filter-bar wwr-filter-bar" aria-label="Filtros de contenido">
      <form className="wwr-filter-search" onSubmit={handleSearch}>
        <input
          id="browse-search"
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar recetas, técnicas, ingredientes..."
          aria-label="Buscar recetas, técnicas e ingredientes"
        />
        <button type="submit">Buscar</button>
      </form>

      <div className="filter-group wwr-filter-row">
        <span className="wwr-filter-label">Tipo</span>
        {typeOptions.map((option) => (
          <button
            key={option.value}
            className={`wwr-filter-pill${same(filters.type, option.value) ? ' active' : ''}`}
            type="button"
            data-active={same(filters.type, option.value) ? 'true' : undefined}
            onClick={() => go({ ...filters, type: same(filters.type, option.value) ? undefined : option.value })}
          >
            {option.label}
          </button>
        ))}
      </div>

      <div className="filter-group wwr-filter-row">
        <span className="wwr-filter-label">Pais</span>
        {cuisineCountries.map((country) => (
          <button
            key={country.slug}
            className={`wwr-filter-pill${same(filters.country, country.slug) ? ' active' : ''}`}
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

      <div className="filter-group wwr-filter-row">
        <span className="wwr-filter-label">Dieta</span>
        {dietOptions.map((diet) => (
          <button
            key={diet}
            className={`wwr-filter-pill${same(filters.diet, diet) ? ' active' : ''}`}
            type="button"
            data-active={same(filters.diet, diet) ? 'true' : undefined}
            onClick={() => go({ ...filters, diet: same(filters.diet, diet) ? undefined : diet })}
          >
            {diet.replace('-', ' ')}
          </button>
        ))}
      </div>

      <div className="filter-group wwr-filter-row">
        <span className="wwr-filter-label">Dificultad</span>
        {difficultyOptions.map((option) => (
          <button
            key={option.value}
            className={`wwr-filter-pill${same(filters.difficulty, option.value) ? ' active' : ''}`}
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
