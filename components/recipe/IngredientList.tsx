type Ingredient = { name: string; amount?: string; unit?: string; note?: string };

export default function IngredientList({ ingredients = [] }: { ingredients?: Ingredient[] }) {
  if (!ingredients.length) return null;
  return (
    <section>
      <h2 className="text-xl font-semibold">Ingredientes</h2>
      <ul className="mt-4 space-y-2">
        {ingredients.map((ingredient) => (
          <li key={`${ingredient.name}-${ingredient.amount ?? ''}`} className="flex gap-2">
            <span className="font-medium">{[ingredient.amount, ingredient.unit].filter(Boolean).join(' ')}</span>
            <span>{ingredient.name}</span>
            {ingredient.note ? <span className="text-slate-500">({ingredient.note})</span> : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
