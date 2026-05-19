'use client';

import { MouseEvent } from 'react';
import { usePathname, useRouter } from 'next/navigation';

const LOCALES = [
  { label: 'ES', value: 'es' },
  { label: 'ES-MX', value: 'es-mx' },
  { label: 'EN', value: 'en' },
];

const CONTENT_TYPES = new Set(['recipe', 'technique', 'ingredient', 'guide', 'cuisine', 'spice']);

function targetFor(pathname: string, locale: string) {
  const parts = pathname.split('/').filter(Boolean);
  if (parts.length >= 3 && CONTENT_TYPES.has(parts[1])) {
    return { href: `/${locale}/${parts[1]}/${parts[2]}`, type: parts[1], slug: parts[2] };
  }
  return { href: `/${locale}${parts.length > 1 ? `/${parts.slice(1).join('/')}` : ''}` };
}

export default function LocaleSwitcher({ locale = 'es' }: { locale?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function switchLocale(event: MouseEvent<HTMLAnchorElement>, nextLocale: string) {
    const target = targetFor(pathname, nextLocale);
    if (!target.type || !target.slug) return;

    event.preventDefault();
    const exists = await fetch(`/api/content-exists?locale=${nextLocale}&type=${target.type}&slug=${target.slug}`, {
      cache: 'no-store',
    })
      .then((response) => response.ok ? response.json() : { exists: false })
      .then((body) => Boolean(body.exists))
      .catch(() => false);

    router.push(exists ? target.href : `/${nextLocale}`);
  }

  return (
    <div className="locale-switcher" aria-label="Cambiar idioma">
      {LOCALES.map((item) => {
        const target = targetFor(pathname, item.value);
        return (
          <a
            key={item.value}
            href={target.href}
            aria-current={item.value === locale ? 'page' : undefined}
            onClick={(event) => switchLocale(event, item.value)}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
