export default function IngredientCard({ title = 'Ingrediente destacado' }: { title?: string }) {
  return (
    <article className="rounded-md border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">Guia de compra, conservacion y usos en cocina.</p>
    </article>
  );
}
