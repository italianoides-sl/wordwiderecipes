export default function TechniqueCard({ title = 'Tecnica de cocina' }: { title?: string }) {
  return (
    <article className="rounded-md border border-slate-200 p-4">
      <h3 className="font-semibold text-slate-950">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">Metodo explicado con errores comunes y senales sensoriales.</p>
    </article>
  );
}
