type Step = { order?: number; title?: string; text: string };

export default function StepByStep({ steps = [] }: { steps?: Step[] }) {
  if (!steps.length) return null;
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Paso a paso</h2>
      {steps.map((step, index) => (
        <article key={`${step.order ?? index}-${step.title ?? ''}`} className="rounded-md border border-slate-200 p-4">
          <h3 className="font-semibold">{step.title ?? `Paso ${step.order ?? index + 1}`}</h3>
          <p className="mt-2 text-slate-700">{step.text}</p>
        </article>
      ))}
    </section>
  );
}
