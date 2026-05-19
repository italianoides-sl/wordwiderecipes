export default function RecipeHero({ title, summary }: { title?: string; summary?: string }) {
  return (
    <section className="space-y-3">
      <h1 className="text-3xl font-bold tracking-normal text-slate-950">{title ?? 'WorldWideRecipes'}</h1>
      {summary ? <p className="max-w-2xl text-slate-700">{summary}</p> : null}
    </section>
  );
}
