import { Fragment } from 'react';
import type { AffiliateLinkRecord, Content } from '@/lib/db/schema';
import AdUnit from '@/components/ui/AdUnit';

function text(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.map(text).filter(Boolean).join(' ');
  if (typeof value === 'object') return Object.values(value).map(text).filter(Boolean).join(' ');
  return '';
}

function array<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

type RenderStep = Record<string, unknown> & { text: string };

function validSteps(value: unknown): RenderStep[] {
  return array<Record<string, unknown>>(value)
    .map((step) => ({
      ...step,
      text: text(step.text).trim(),
    }))
    .filter((step) => step.text.length > 10);
}

function titleFromKey(key: string) {
  const label = key
    .replaceAll('_', ' ')
    .trim();
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : '';
}

function affiliateFor(label: unknown, links: AffiliateLinkRecord[] = []) {
  const needle = text(label).toLowerCase();
  if (!needle) return undefined;
  return links.find((link) => link.label.toLowerCase().includes(needle) || needle.includes(link.label.toLowerCase()));
}

function AffiliateMiniLink({ link }: { link?: AffiliateLinkRecord }) {
  if (!link) return null;
  return (
    <a className="body-affiliate-link" href={link.url} target="_blank" rel="nofollow sponsored">
      Comprar en Amazon
    </a>
  );
}

function bodyImage(content: Content, index: number) {
  const images = array<Record<string, unknown>>((content.body as Record<string, unknown> | undefined)?.images);
  return images[index];
}

function InlineContentImage({ image, title }: { image?: Record<string, unknown>; title: string }) {
  const url = text(image?.url);
  if (!url) return null;
  const photographerName = text(image?.photographerName);
  const photographerUrl = text(image?.photographerUrl);

  return (
    <figure className="body-inline-image">
      <img src={url} alt={text(image?.alt) || title} loading="lazy" />
      <figcaption>
        {photographerName && photographerUrl ? (
          <>
            Photo by <a href={photographerUrl} target="_blank" rel="noopener noreferrer">{photographerName}</a>{' '}
            on <a href="https://unsplash.com/?utm_source=worldwiderecipes&utm_medium=referral" target="_blank" rel="noopener noreferrer">Unsplash</a>
          </>
        ) : (
          text(image?.attribution) || 'Photo from Unsplash'
        )}
      </figcaption>
    </figure>
  );
}

function GenericField({ name, value }: { name: string; value: unknown }) {
  if (!value) return null;
  if (name === 'intro' && typeof value === 'string') {
    return (
      <section className="body-section body-intro">
        <p>{value}</p>
      </section>
    );
  }

  if (Array.isArray(value)) {
    return (
      <section className="body-section">
        <h2>{titleFromKey(name)}</h2>
        <div className="body-card-grid">
          {value.map((item, index) => (
            <div className="body-card" key={`${name}-${index}`}>
              <p>{text(item)}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="body-section">
      <h2>{titleFromKey(name)}</h2>
      <p>{text(value)}</p>
    </section>
  );
}

function RecipeBody({ content }: { content: Content }) {
  const body = content.body ?? {};
  const links = content.affiliateLinks ?? [];
  const ingredients = array<Record<string, unknown>>(body.ingredients);
  const steps = validSteps(body.steps);
  const variations = array<Record<string, unknown>>(body.variations);

  return (
    <div className="body-renderer">
      {body.intro ? <GenericField name="intro" value={body.intro} /> : null}
      {array<string>(body.chef_secrets).length ? (
        <section className="chef-secrets-box">
          <h2>Secretos de chef</h2>
          <ul>
            {array<string>(body.chef_secrets).map((tip, index) => <li key={`${tip}-${index}`}>{tip}</li>)}
          </ul>
        </section>
      ) : null}
      {ingredients.length ? (
        <section className="body-section">
          <h2>Ingredientes</h2>
          <ul className="ingredient-list">
            {ingredients.map((ingredient, index) => {
              const link = affiliateFor(ingredient.name, links);
              return (
                <li key={`${text(ingredient.name)}-${index}`}>
                  <strong>{[ingredient.amount, ingredient.unit, ingredient.name].map(text).filter(Boolean).join(' ')}</strong>
                  {ingredient.note ? <span>{text(ingredient.note)}</span> : null}
                  {ingredient.substitute ? <small>Sustituto: {text(ingredient.substitute)}</small> : null}
                  <AffiliateMiniLink link={link} />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <AdUnit slot="1234567890" format="rectangle" style={{ margin: '24px 0' }} />
      {steps.length ? (
        <section className="body-section recipe-steps-section">
          <h2>Paso a paso</h2>
          <div className="wwr-steps-list">
            {steps.map((step, index) => (
              <Fragment key={`${text(step.title)}-${index}`}>
                <div className="wwr-step">
                  <div className="wwr-step-number">{index + 1}</div>
                  <div className="wwr-step-content">
                    {step.title ? <h3>{text(step.title)}</h3> : null}
                    <p>{step.text}</p>
                    {step.tip ? <p className="wwr-step-tip">{text(step.tip)}</p> : null}
                    {step.sensory_cue ? <p className="wwr-step-tip">{text(step.sensory_cue)}</p> : null}
                  </div>
                </div>
                {index === 3 ? (
                  <Fragment key={`ad-step-${index}`}>
                    <div className="body-inline-image-item"><InlineContentImage image={bodyImage(content, 1)} title={content.title} /></div>
                    <div className="body-ad-item"><AdUnit slot="0987654321" format="auto" /></div>
                  </Fragment>
                ) : null}
              </Fragment>
            ))}
          </div>
        </section>
      ) : null}
      {variations.length ? <GenericField name="variations" value={variations} /> : null}
      {body.pairing ? <GenericField name="pairing" value={body.pairing} /> : null}
      {body.chef_note ? (
        <section className="chef-note">
          <h2>Nota del chef</h2>
          <p>{text(body.chef_note)}</p>
        </section>
      ) : null}
    </div>
  );
}

function TechniqueBody({ content }: { content: Content }) {
  const body = content.body ?? {};
  const links = content.affiliateLinks ?? [];
  const equipment = array<Record<string, unknown>>(body.equipment);
  const steps = validSteps(body.steps);
  const errors = array<Record<string, unknown>>(body.errors);

  return (
    <div className="body-renderer">
      {body.what_it_is ? <GenericField name="what_it_is" value={body.what_it_is} /> : null}
      {body.why_learn ? <GenericField name="why_learn" value={body.why_learn} /> : null}
      {equipment.length ? (
        <section className="body-section">
          <h2>Equipo</h2>
          <div className="body-card-grid">
            {equipment.map((item, index) => (
              <div className="body-card" key={`${text(item.name)}-${index}`}>
                <h3>{text(item.name)}</h3>
                <p>{text(item.why)}</p>
                <AffiliateMiniLink link={affiliateFor(item.name, links)} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
      <AdUnit slot="1234567890" format="rectangle" style={{ margin: '24px 0' }} />
      {body.before_you_start ? <section className="quick-answer-box"><h2>Antes de empezar</h2><p>{text(body.before_you_start)}</p></section> : null}
      {steps.length ? (
        <section className="body-section">
          <h2>Pasos</h2>
          <div className="wwr-steps-list">
            {steps.map((step, index) => (
              <Fragment key={`${text(step.title)}-${index}`}>
                <div className="wwr-step">
                  <div className="wwr-step-number">{index + 1}</div>
                  <div className="wwr-step-content">
                    {step.title ? <h3>{text(step.title)}</h3> : null}
                    <p>{step.text}</p>
                    {step.common_mistake ? <p className="wwr-step-tip">Error comun: {text(step.common_mistake)}</p> : null}
                  </div>
                </div>
                {index === 3 ? <div className="body-inline-image-item"><InlineContentImage image={bodyImage(content, 1)} title={content.title} /></div> : null}
              </Fragment>
            ))}
          </div>
        </section>
      ) : null}
      {errors.length ? (
        <section className="body-section">
          <h2>Errores comunes</h2>
          <table className="content-table"><tbody>
            {errors.map((item, index) => <tr key={`${text(item.error)}-${index}`}><th>{text(item.error)}</th><td>{text(item.fix)}</td></tr>)}
          </tbody></table>
        </section>
      ) : null}
      {body.practice_exercise ? <GenericField name="practice_exercise" value={body.practice_exercise} /> : null}
      {body.advanced_applications ? <GenericField name="advanced_applications" value={body.advanced_applications} /> : null}
    </div>
  );
}

function IngredientBody({ content }: { content: Content }) {
  const body = content.body ?? {};
  const ordered = ['origin_story', 'flavor_profile', 'varieties', 'how_to_buy', 'how_to_store', 'how_to_prepare', 'classic_uses', 'surprising_uses', 'nutrition', 'substitutes', 'cultural_significance'];

  return (
    <div className="body-renderer">
      {ordered.map((key) => {
        if (key === 'substitutes' && array(body[key]).length) {
          return (
            <section className="body-section" key={key}>
              <h2>Sustitutos</h2>
              <table className="content-table"><tbody>
                {array<Record<string, unknown>>(body[key]).map((item, index) => (
                  <tr key={`${text(item.name)}-${index}`}><th>{text(item.name)}</th><td>{[item.when, item.ratio].map(text).filter(Boolean).join(' · ')}</td></tr>
                ))}
              </tbody></table>
            </section>
          );
        }
        if (key === 'how_to_buy') {
          return (
            <Fragment key={key}>
              <GenericField name={key} value={body[key]} />
              <AdUnit slot="1234567890" format="rectangle" style={{ margin: '24px 0' }} />
            </Fragment>
          );
        }
        return <GenericField key={key} name={key} value={body[key]} />;
      })}
    </div>
  );
}

function GenericBody({ content }: { content: Content }) {
  const body = content.body ?? {};
  return (
    <div className="body-renderer">
      {Object.entries(body)
        .filter(([key, value]) => key !== 'images' && Boolean(value))
        .map(([key, value]) => <GenericField key={key} name={key} value={value} />)}
    </div>
  );
}

export default function BodyRenderer({ content }: { content: Content }) {
  if (content.type === 'recipe') return <RecipeBody content={content} />;
  if (content.type === 'technique') return <TechniqueBody content={content} />;
  if (content.type === 'ingredient' || content.type === 'spice') return <IngredientBody content={content} />;
  return <GenericBody content={content} />;
}
