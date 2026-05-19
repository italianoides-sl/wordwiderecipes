export default function Badge({ children }: { children?: React.ReactNode }) {
  return <span className="inline-flex rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700">{children}</span>;
}
