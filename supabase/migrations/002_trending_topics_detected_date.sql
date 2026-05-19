ALTER TABLE trending_topics
  ADD COLUMN IF NOT EXISTS detected_date date DEFAULT CURRENT_DATE;

UPDATE trending_topics
SET detected_date = DATE(detected_at)
WHERE detected_date IS NULL;

DROP INDEX IF EXISTS idx_trending_topic_locale;

CREATE UNIQUE INDEX IF NOT EXISTS idx_trending_topic_locale
  ON trending_topics(topic, locale_primary, detected_date);
