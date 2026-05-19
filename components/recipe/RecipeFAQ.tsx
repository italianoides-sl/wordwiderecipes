export default function RecipeFAQ({ faq = [] }: { faq?: Array<{ question: string; answer: string }> }) {
  if (!faq.length) return null;
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">Preguntas frecuentes</h2>
      {faq.map((item) => (
        <article key={item.question}>
          <h3 className="font-semibold">{item.question}</h3>
          <p className="mt-1 text-slate-700">{item.answer}</p>
        </article>
      ))}
    </section>
  );
}
