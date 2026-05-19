'use client';

import { useState } from 'react';

export default function ShareActions({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button className="share-button" type="button" onClick={share}>
      {copied ? 'URL copiada' : 'Compartir'}
    </button>
  );
}
