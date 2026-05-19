export default function TikTokCTA({ hashtags = [] }: { hashtags?: string[] }) {
  return (
    <section className="article-tiktok-cta">
      <div>
        <h2>Quieres verlo en video?</h2>
        <p>Sigue a @tuvirtualchef para ver tecnica, textura y punto de coccion en formato corto.</p>
        {hashtags.length ? <p className="article-tiktok-tags">{hashtags.join(' ')}</p> : null}
      </div>
      <a href={process.env.NEXT_PUBLIC_TIKTOK_URL ?? 'https://tiktok.com/@tuvirtualchef'} target="_blank" rel="noopener noreferrer">
        Ver TikTok
      </a>
    </section>
  );
}
