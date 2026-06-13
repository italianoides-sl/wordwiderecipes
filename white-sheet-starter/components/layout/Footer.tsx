import { INSTAGRAM_URL, SITE_EMAIL, SITE_NAME, X_URL, YOUTUBE_URL } from '@/lib/config/site';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <h2>{SITE_NAME}</h2>
          <p>Base white-label para medios programáticos con automatización y SEO técnico.</p>
        </div>
        <div>
          <h3>Contacto</h3>
          <p>{SITE_EMAIL}</p>
        </div>
        <div>
          <h3>Canales</h3>
          <ul>
            <li><a href={X_URL}>X</a></li>
            <li><a href={INSTAGRAM_URL}>Instagram</a></li>
            <li><a href={YOUTUBE_URL}>YouTube</a></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
