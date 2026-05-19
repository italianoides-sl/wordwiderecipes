export default function RelatedContent({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <section className="space-y-3">{children}</section>;
}
