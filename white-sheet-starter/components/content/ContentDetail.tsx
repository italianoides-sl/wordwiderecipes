import { StructuredData } from '@/components/seo/StructuredData';
import { buildArticleSchema, buildFaqSchema } from '@/lib/seo/schema';
import type { ContentRow } from '@/lib/db/schema';

export function ContentDetail({
  item,
  related,
}: {
  item: ContentRow;
  related: ContentRow[];
}) {
  const articleSchema = buildArticleSchema(item);
  const faqSchema = buildFaqSchema(item);
  const body = item.body as {
    intro?: string;
    sections?: Array<{ heading: string; content: string }>;
    experts_note?: string;
    mistakes?: string;
    variations?: string;
    next_steps?: string;
    conclusion?: string;
  };

  return (
    <>
      <StructuredData data={articleSchema} />
      <StructuredData data={faqSchema} />
      <article className="article-shell container">
        <header className="article-header">
          <p className="eyebrow">{item.type}</p>
          <h1>{item.title}</h1>
          <p className="article-excerpt">{item.metaDescription ?? item.excerpt}</p>
        </header>

        <div className="article-layout">
          <div className="article-main">
            {body.intro ? <p className="article-intro">{body.intro}</p> : null}

            {body.sections?.map((section) => (
              <section key={section.heading} className="article-section">
                <h2>{section.heading}</h2>
                <p>{section.content}</p>
              </section>
            ))}

            {body.experts_note ? (
              <section className="article-note">
                <h2>Nota del editor</h2>
                <p>{body.experts_note}</p>
              </section>
            ) : null}

            {body.mistakes ? (
              <section className="article-note article-note-alt">
                <h2>Errores comunes</h2>
                <p>{body.mistakes}</p>
              </section>
            ) : null}

            {body.variations ? (
              <section className="article-section">
                <h2>Variantes y enfoques</h2>
                <p>{body.variations}</p>
              </section>
            ) : null}

            {body.next_steps ? (
              <section className="article-section">
                <h2>Siguientes pasos</h2>
                <p>{body.next_steps}</p>
              </section>
            ) : null}

            {item.faq?.length ? (
              <section className="article-section">
                <h2>Preguntas frecuentes</h2>
                <div className="faq-list">
                  {item.faq.map((faq) => (
                    <details key={faq.question}>
                      <summary>{faq.question}</summary>
                      <p>{faq.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            ) : null}
          </div>

          <aside className="article-sidebar">
            <div className="sidebar-card">
              <h3>Checklist de adaptación</h3>
              <p>Cambia prompts, monetización, schema y enlazado interno para tu nicho.</p>
            </div>
            <div className="sidebar-card">
              <h3>Relacionados</h3>
              <ul>
                {related.map((entry) => (
                  <li key={entry.id}>{entry.title}</li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
}
