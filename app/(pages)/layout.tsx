import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

export default function PagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="site-shell">
      <Header />
      {children}
      <Footer />
    </div>
  );
}
