export function safeISOString(date: unknown): string {
  if (!date) return new Date().toISOString();
  if (typeof date === 'string') return date;
  if (date instanceof Date) return date.toISOString();
  return new Date(date as string | number).toISOString();
}
