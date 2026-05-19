export default function AboutSection({ locale }: { locale: string }) {
  return (
    <section className="da-about">
      <div className="da-about-grid">
        <div className="da-about-copy">
          <div className="da-overline">
            <span className="da-overline-dot" aria-hidden="true"></span>
            Quiénes somos
          </div>
          <h2 className="da-about-h2">
            Un chef en Ibiza.<br />
            <em>Una cocina global.</em>
          </h2>
          <p>
            <strong>WorldWideRecipes</strong> nació en Ibiza de la mano de un chef profesional con pasión por la gastronomía de todos los rincones del mundo. Lo que empezó como un cuaderno de recetas se convirtió en un atlas culinario en español e inglés.
          </p>
          <p>
            Cada artículo — receta, técnica, ingrediente o guía — está generado con <strong>Gemini AI</strong> y validado editorialmente para garantizar precisión, contexto histórico y criterio de cocina real.
          </p>
          <p>
            También somos <strong>@tuvirtualchef</strong> en TikTok, donde publicamos foto-recetas de menos de un minuto: desliza, lee, cocina.
          </p>
          <p>
            ¿Tienes una pregunta, corrección o propuesta de colaboración? Escríbenos a{' '}
            <a href="mailto:contact@worldwiderecipes.app">contact@worldwiderecipes.app</a>
          </p>
          <div className="da-tags">
            <span className="da-tag"><span className="da-tag-flag">🇪🇸</span> Ibiza</span>
            <span className="da-tag"><span className="da-tag-flag">🌍</span> Gastronomía mundial</span>
            <span className="da-tag"><span className="da-tag-flag">🤖</span> Gemini AI</span>
            <span className="da-tag"><span className="da-tag-flag">📱</span> @tuvirtualchef</span>
            <span className="da-tag da-tag--ghost">Español · English · Português</span>
          </div>
        </div>

        <div className="da-about-mosaic">
          <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="da-photo da-photo--hero">
            <img
              src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80"
              alt="Cocina mundial"
              loading="lazy"
            />
          </a>
          <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="da-photo">
            <img src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80" alt="Chef cocinando" loading="lazy" />
          </a>
          <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="da-photo">
            <img src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80" alt="Cochinita pibil" loading="lazy" />
          </a>
          <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="da-photo">
            <img src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=600&q=80" alt="Gazpacho" loading="lazy" />
          </a>
          <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="da-photo">
            <img src="https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=600&q=80" alt="Especias" loading="lazy" />
          </a>
          <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="da-photo">
            <img src="https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=600&q=80" alt="Ingredientes frescos" loading="lazy" />
          </a>
        </div>
      </div>
      <p style={{ maxWidth: '1300px', margin: '20px auto 0', padding: '0 28px', fontSize: '11px', color: 'var(--da-ink-subtle)' }}>
        Photos from <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" style={{ color: 'inherit' }}>Unsplash</a>
      </p>
    </section>
  );
}
