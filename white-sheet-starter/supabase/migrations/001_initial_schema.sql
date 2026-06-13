CREATE TABLE IF NOT EXISTS content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  type text NOT NULL,
  title text NOT NULL,
  meta_title text,
  meta_description text,
  canonical_url text,
  excerpt text,
  quick_answer text,
  body jsonb NOT NULL DEFAULT '{}'::jsonb,
  faq jsonb,
  schema_article jsonb,
  schema_faq jsonb,
  image_url text,
  image_alt text,
  category text,
  topical_cluster text,
  entity_mentions text[],
  internal_link_count integer DEFAULT 0,
  outbound_link_count integer DEFAULT 0,
  quality_score numeric(3,1),
  word_count integer,
  reading_time_mins integer,
  status text DEFAULT 'draft',
  published_at timestamptz,
  updated_at timestamptz DEFAULT now(),
  ai_generated boolean DEFAULT true
);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text,
  content_type text,
  status text DEFAULT 'pending',
  content_id uuid,
  quality_score numeric(3,1),
  generation_ms integer,
  attempts integer DEFAULT 0,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS internal_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_slug text NOT NULL,
  to_slug text NOT NULL,
  anchor_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (from_slug, to_slug)
);
