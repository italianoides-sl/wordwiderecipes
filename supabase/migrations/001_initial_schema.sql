CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  locale text NOT NULL DEFAULT 'es',
  CONSTRAINT locale_valid CHECK (locale IN ('es','es-mx','es-ar','en','pt-br')),
  type text NOT NULL,
  CONSTRAINT type_valid CHECK (type IN ('recipe','technique','ingredient','guide','cuisine','spice')),
  title text NOT NULL,
  meta_title text CHECK (char_length(meta_title) <= 60),
  meta_description text CHECK (char_length(meta_description) <= 160),
  canonical_url text,
  quick_answer text,
  definition text,
  key_facts jsonb,
  steps_summary jsonb,
  author_entity text DEFAULT 'WorldWideRecipes Editorial Team',
  expert_reviewed boolean DEFAULT false,
  primary_sources jsonb,
  original_data jsonb,
  entity_mentions text[],
  citation_summary text,
  body jsonb NOT NULL DEFAULT '{}',
  image_url text,
  image_alt text,
  image_attribution text,
  og_image_url text,
  cuisine text,
  category text,
  diet_tags text[],
  difficulty text CHECK (difficulty IN ('easy','medium','hard')),
  total_time_mins int,
  season text[],
  related_slugs text[],
  parent_slug text,
  tiktok_hashtags text[],
  affiliate_links jsonb,
  schema_recipe jsonb,
  schema_howto jsonb,
  schema_article jsonb,
  schema_faq jsonb,
  schema_breadcrumb jsonb,
  faq jsonb,
  quality_score numeric(3,1),
  quality_details jsonb,
  ai_model text DEFAULT 'gemini-1.5-flash',
  generation_prompt_version text,
  human_reviewed boolean DEFAULT false,
  human_reviewed_at timestamptz,
  word_count int,
  reading_time_mins int,
  internal_link_count int DEFAULT 0,
  outbound_link_count int DEFAULT 0,
  impressions_7d int DEFAULT 0,
  clicks_7d int DEFAULT 0,
  avg_position_7d numeric(5,2),
  top_queries jsonb,
  status text DEFAULT 'draft' CHECK (status IN ('draft','published','archived','needs_review')),
  published_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  indexed_at timestamptz,
  last_crawled_at timestamptz,
  ai_generated boolean DEFAULT true,
  UNIQUE (slug, locale)
);

CREATE INDEX idx_content_type ON content(type);
CREATE INDEX idx_content_locale ON content(locale);
CREATE INDEX idx_content_cuisine ON content(cuisine);
CREATE INDEX idx_content_status ON content(status);
CREATE INDEX idx_content_published ON content(published_at DESC NULLS LAST);
CREATE INDEX idx_content_quality ON content(quality_score DESC);
CREATE INDEX idx_content_tags ON content USING GIN(diet_tags);
CREATE INDEX idx_content_related ON content USING GIN(related_slugs);
CREATE INDEX idx_content_entities ON content USING GIN(entity_mentions);
CREATE INDEX idx_content_search ON content USING GIN(
  to_tsvector('spanish', coalesce(title,'') || ' ' || coalesce(meta_description,''))
);
CREATE INDEX idx_content_fts ON content USING GIN(
  to_tsvector('simple',
    coalesce(title,'') || ' ' ||
    coalesce(meta_description,'') || ' ' ||
    coalesce(cuisine,'') || ' ' ||
    coalesce(array_to_string(diet_tags,' '),'')
  )
);

CREATE TABLE affiliate_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  name_es text,
  name_mx text,
  asin_es text,
  asin_mx text,
  asin_global text,
  asin_br text,
  url_es text,
  url_mx text,
  url_global text,
  category text CHECK (category IN ('ingredient','utensil','book','appliance','spice','kit')),
  price_range text CHECK (price_range IN ('budget','mid','premium')),
  image_url text,
  match_keywords text[],
  cuisines text[],
  total_clicks int DEFAULT 0,
  clicks_es int DEFAULT 0,
  clicks_mx int DEFAULT 0,
  estimated_commission_es numeric(8,2) DEFAULT 0,
  estimated_commission_mx numeric(8,2) DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_affiliate_keywords ON affiliate_products USING GIN(match_keywords);
CREATE INDEX idx_affiliate_category ON affiliate_products(category);

CREATE TABLE affiliate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES content(id) ON DELETE SET NULL,
  product_id uuid REFERENCES affiliate_products(id) ON DELETE SET NULL,
  market text CHECK (market IN ('es','mx','global','br')),
  position text,
  locale text,
  clicked_at timestamptz DEFAULT now()
);

CREATE INDEX idx_aff_events_product ON affiliate_events(product_id);
CREATE INDEX idx_aff_events_content ON affiliate_events(content_id);
CREATE INDEX idx_aff_events_date ON affiliate_events(clicked_at DESC);
CREATE INDEX idx_aff_events_market ON affiliate_events(market);

CREATE TABLE trending_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  content_type text,
  locale_primary text,
  why_trending text,
  unique_angle text,
  affiliate_potential text,
  tiktok_hashtags text[],
  search_intent text,
  difficulty_to_rank text,
  selected boolean DEFAULT false,
  content_id uuid REFERENCES content(id),
  skipped_reason text,
  detected_at timestamptz DEFAULT now()
);

CREATE INDEX idx_trending_date ON trending_topics(detected_at DESC);
CREATE INDEX idx_trending_type ON trending_topics(content_type);
CREATE UNIQUE INDEX idx_trending_topic_locale
  ON trending_topics(topic, locale_primary, (DATE(detected_at)));

CREATE TABLE generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text CHECK (job_type IN ('bootstrap','daily_cron','manual','regenerate')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','running','completed','failed','partial')),
  topic text,
  content_type text,
  locale text,
  prompt_version text,
  content_id uuid REFERENCES content(id),
  quality_score numeric(3,1),
  image_generated boolean DEFAULT false,
  indexed boolean DEFAULT false,
  tokens_used int,
  cost_usd numeric(8,6),
  generation_ms int,
  attempts int DEFAULT 0,
  error_message text,
  error_details jsonb,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_jobs_status ON generation_jobs(status);
CREATE INDEX idx_jobs_created ON generation_jobs(created_at DESC);
CREATE INDEX idx_jobs_type ON generation_jobs(job_type);

CREATE TABLE internal_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  to_id uuid NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  anchor_text text,
  link_type text CHECK (link_type IN ('related','same_cuisine','same_ingredient','technique_for','ingredient_in','parent','tiktok')),
  position text CHECK (position IN ('body','faq','related_section','tools','breadcrumb')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (from_id, to_id)
);

CREATE INDEX idx_links_from ON internal_links(from_id);
CREATE INDEX idx_links_to ON internal_links(to_id);

CREATE TABLE homepage_config (
  id int PRIMARY KEY DEFAULT 1,
  hero_content_ids uuid[],
  featured_technique uuid REFERENCES content(id),
  featured_ingredient uuid REFERENCES content(id),
  top_affiliate_id uuid REFERENCES affiliate_products(id),
  trending_tags text[],
  updated_at timestamptz DEFAULT now()
);

INSERT INTO homepage_config (id) VALUES (1);

CREATE TABLE seo_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES content(id) ON DELETE CASCADE,
  date date NOT NULL,
  impressions int DEFAULT 0,
  clicks int DEFAULT 0,
  avg_position numeric(5,2),
  ctr numeric(5,4),
  top_query text,
  UNIQUE (content_id, date)
);

CREATE INDEX idx_seo_content ON seo_metrics(content_id);
CREATE INDEX idx_seo_date ON seo_metrics(date DESC);

CREATE TABLE sitemap_index (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES content(id) ON DELETE CASCADE,
  sitemap_file text,
  url text NOT NULL,
  priority numeric(2,1) DEFAULT 0.7,
  changefreq text DEFAULT 'weekly',
  lastmod timestamptz DEFAULT now(),
  submitted_at timestamptz,
  UNIQUE (content_id)
);

CREATE TABLE page_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES content(id) ON DELETE CASCADE,
  locale text,
  referrer_type text CHECK (referrer_type IN ('google','tiktok','direct','social','other')),
  device text CHECK (device IN ('mobile','tablet','desktop')),
  viewed_at timestamptz DEFAULT now()
);

CREATE INDEX idx_views_content ON page_views(content_id);
CREATE INDEX idx_views_date ON page_views(viewed_at DESC);

ALTER TABLE content ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE internal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sitemap_index ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_content" ON content
  FOR SELECT USING (status = 'published');

CREATE POLICY "public_read_products" ON affiliate_products
  FOR SELECT USING (active = true);

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_updated_at
  BEFORE UPDATE ON content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION build_affiliate_urls()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.asin_es IS NOT NULL AND NEW.url_es IS NULL THEN
    NEW.url_es = 'https://www.amazon.es/dp/' || NEW.asin_es;
  END IF;
  IF NEW.asin_mx IS NOT NULL AND NEW.url_mx IS NULL THEN
    NEW.url_mx = 'https://www.amazon.com.mx/dp/' || NEW.asin_mx;
  END IF;
  IF NEW.asin_global IS NOT NULL AND NEW.url_global IS NULL THEN
    NEW.url_global = 'https://www.amazon.com/dp/' || NEW.asin_global;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER affiliate_products_build_urls
  BEFORE INSERT OR UPDATE ON affiliate_products
  FOR EACH ROW EXECUTE FUNCTION build_affiliate_urls();

CREATE OR REPLACE FUNCTION increment_views(content_uuid uuid)
RETURNS void AS $$
BEGIN
  INSERT INTO page_views (content_id) VALUES (content_uuid);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_related_content(
  p_slug text,
  p_locale text,
  p_limit int DEFAULT 6
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  type text,
  image_url text,
  cuisine text
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.slug, c.title, c.type, c.image_url, c.cuisine
  FROM content c
  WHERE c.locale = p_locale
    AND c.status = 'published'
    AND c.slug != p_slug
    AND c.slug = ANY(
      SELECT unnest(related_slugs)
      FROM content
      WHERE slug = p_slug AND locale = p_locale
    )
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
CREATE INDEX idx_content_search ON content USING GIN(
  to_tsvector('spanish', 
    coalesce(title, '') || ' ' || coalesce(meta_description, '')
  )
) WHERE title IS NOT NULL;

CREATE INDEX idx_content_fts ON content USING GIN(
  to_tsvector('simple', 
    coalesce(title, '') || ' ' || coalesce(meta_description, '')
  )
) WHERE title IS NOT NULL;