'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

type ActiveLinkProps = {
  href: string;
  children: ReactNode;
  exact?: boolean;
  activePrefixes?: string[];
  className?: string;
};

export default function ActiveLink({ href, children, exact = false, activePrefixes = [], className }: ActiveLinkProps) {
  const pathname = usePathname();
  const targetPath = href.split('?')[0];
  const isActive = exact
    ? pathname === targetPath
    : pathname === targetPath || activePrefixes.some((prefix) => pathname?.startsWith(prefix));

  return (
    <a href={href} className={className} data-active={isActive ? 'true' : undefined}>
      {children}
    </a>
  );
}
