export type ContentType = 'article' | 'guide' | 'comparison' | 'review' | 'faq' | 'resource';

export type FaqItem = {
  question: string;
  answer: string;
};

export type ContentDraft = {
  title: string;
  slug: string;
  type: ContentType;
  category: string;
  topicalCluster: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  quickAnswer: string;
  body: {
    intro: string;
    sections: Array<{ heading: string; content: string }>;
    experts_note?: string;
    mistakes?: string;
    variations?: string;
    next_steps?: string;
    conclusion: string;
  };
  faq: FaqItem[];
  entityMentions: string[];
  wordCount: number;
  readingTimeMins: number;
};

export type QualityReport = {
  score: number;
  improvements: string[];
  criticalFixes: string[];
};
