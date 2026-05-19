export default function TopAffiliateBanner({ children }: { children?: React.ReactNode }) {
  if (!children) return null;
  return <section className="border-y border-slate-200 py-3">{children}</section>;
}
