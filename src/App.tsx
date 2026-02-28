import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  ChefHat,
  Download,
  ExternalLink,
  Lock,
  Mail,
  Menu,
  X,
} from 'lucide-react';

type Page = 'home' | 'downloads' | 'equipment' | 'contact' | 'affiliate-disclosure' | 'ads-disclosure';
type SubscriptionSource = 'newsletter' | 'downloads';

type PdfResource = {
  id: number;
  title: string;
  description: string;
  url: string;
  cover?: string;
};

const BREVO_API_KEY = (
  (import.meta.env.VITE_BREVO_API_KEY as string | undefined) ??
  ''
).trim();
const LAST_SUBSCRIBER_KEY = 'virtualchef.last-subscriber.v2';
const DOWNLOAD_AD_URL = 'https://omg10.com/4/10662409';
const HOME_HERO_IMAGE = '/client_upload_media_052344cd4d39ed9d78e4b7d48c599ea0b05b32b3_media_01kh0w664hehba7vvncw2wazkf.jpg';
const PDFS: PdfResource[] = [
  {
    id: 1,
    title: 'De 0 a Cocinero — Módulo 01',
    description: 'Dominio del Calor',
    url: '/pdfs/De 0 a cocinero modulo 1.pdf',
    cover: '/pdfs/modulo 1.png',
  },
  {
    id: 2,
    title: 'De 0 a Cocinero — Módulo 02',
    description: 'Técnicas de Corte',
    url: '/pdfs/De 0 a cocinero modulo 2.pdf',
    cover: '/pdfs/modulo 2.png',
  },
];

const PURPOSES = [
  'Traducir tecnica profesional a pasos simples, medibles y repetibles.',
  'Reducir errores de cocina del dia a dia con guias directas.',
  'Construir una biblioteca practica para cocinar mejor con menos estres.',
];

const EQUIPMENT = [
  {
    name: 'Microplane Premium Zester',
    cat: 'Rallador',
    desc: 'Rallador fino para citricos, ajo, especias y acabados profesionales.',
    img: '/affiliates/microplane-zester.jpg',
    link: 'https://amzn.to/4aSXsNB',
  },
  {
    name: 'Sarten Inox Tricapa',
    cat: 'Acero Inoxidable',
    desc: 'Sarten para sellado estable y control de temperatura en cocina diaria.',
    img: '/affiliates/sarten-inox-tramontina.jpg',
    link: 'https://amzn.to/4040vO3',
  },
  {
    name: 'Cebollero Arcos para Casa',
    cat: 'Corte',
    desc: 'Cuchillo robusto para corte de cebolla y vegetales de uso frecuente.',
    img: '/affiliates/arcos-cebollero.jpg',
    link: 'https://amzn.to/4rGm5nZ',
  },
  {
    name: 'Global GS11 Flexible Utility',
    cat: 'Cuchilleria',
    desc: 'GS11 de Global para tareas finas y multiuso con buen control.',
    img: '/affiliates/global-gs11.jpg',
    link: 'https://amzn.to/4aWAnd6',
  },
];

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function subscribeEmail(email: string, source: SubscriptionSource) {
  if (!BREVO_API_KEY) {
    throw new Error('Falta VITE_BREVO_API_KEY en .env.local');
  }

  const response = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      listIds: [3],
      attributes: { SOURCE: source },
    }),
  });

  if (response.ok) return;

  const raw = await response.text();
  try {
    const parsed = JSON.parse(raw) as { message?: string; code?: string };
    throw new Error(parsed.message || parsed.code || `Error HTTP ${response.status}`);
  } catch {
    throw new Error(raw || `Error HTTP ${response.status}`);
  }
}

async function trackDownload(email: string | null, pdfTitle: string, pdfId: number) {
  if (!BREVO_API_KEY) return;

  const body: {
    event: 'pdf_download';
    email?: string;
    properties: {
      pdf_title: string;
      pdf_id: string;
    };
  } = {
    event: 'pdf_download',
    properties: {
      pdf_title: pdfTitle,
      pdf_id: String(pdfId),
    },
  };

  if (email) {
    body.email = email;
  }

  await fetch('https://api.brevo.com/v3/events', {
    method: 'POST',
    headers: {
      'api-key': BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}

type SubscribeFormProps = {
  onSubscribe: (email: string, source: SubscriptionSource) => Promise<void>;
  isSubscribed: boolean;
  source: SubscriptionSource;
  buttonText: string;
  className?: string;
};

function SubscribeForm({ onSubscribe, isSubscribed, source, buttonText, className = '' }: SubscribeFormProps) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const saved = window.localStorage.getItem(LAST_SUBSCRIBER_KEY);
    if (saved) {
      setEmail(saved);
    }
  }, []);

  if (isSubscribed) {
    return (
      <div className={`flex items-center gap-3 text-emerald-700 font-medium bg-emerald-50 p-4 rounded-xl border border-emerald-200 ${className}`}>
        <CheckCircle2 className="h-5 w-5 shrink-0" />
        <span className="text-sm">Suscripcion activa. Acceso a descargas habilitado.</span>
      </div>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalized = normalizeEmail(email);
    if (!isValidEmail(normalized)) {
      setError('Escribe un email valido.');
      return;
    }

    try {
      setLoading(true);
      setError('');
      await onSubscribe(normalized, source);
    } catch (subscriptionError) {
      const message = subscriptionError instanceof Error ? subscriptionError.message : 'No se pudo guardar tu email.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`bg-white p-2 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-2 ${className}`}>
      <div className="relative flex-grow">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Tu mejor email..."
          className="w-full pl-10 pr-4 py-3 bg-transparent border-none focus:ring-0 text-sm outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="bg-[#1a1a1a] text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-[#b95c35] transition-colors whitespace-nowrap flex items-center justify-center disabled:opacity-70"
      >
        {loading ? 'Procesando...' : <>{buttonText} <ArrowRight className="ml-2 h-4 w-4" /></>}
      </button>
      {error && <p className="text-xs text-red-600 px-2 sm:px-0 sm:ml-2 sm:self-center">{error}</p>}
    </form>
  );
}

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    const cachedEmail = window.localStorage.getItem(LAST_SUBSCRIBER_KEY);
    if (cachedEmail && isValidEmail(cachedEmail)) {
      setIsSubscribed(true);
    }
  }, []);

  const navigateTo = (page: Page) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  const handleSubscribe = async (email: string, source: SubscriptionSource) => {
    await subscribeEmail(email, source);
    window.localStorage.setItem(LAST_SUBSCRIBER_KEY, email);
    setIsSubscribed(true);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-50 bg-[#fdfcfa]/90 backdrop-blur-md border-b border-black/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <button className="flex items-center cursor-pointer" onClick={() => navigateTo('home')}>
              <ChefHat className="h-8 w-8 text-[#b95c35]" />
              <span className="ml-2 font-serif text-2xl font-bold tracking-tight">VirtualChef</span>
            </button>

            <nav className="hidden md:flex space-x-8">
              <button onClick={() => navigateTo('home')} className={`text-sm font-medium transition-colors ${currentPage === 'home' ? 'text-[#b95c35]' : 'text-gray-700 hover:text-[#b95c35]'}`}>Inicio</button>
              <button onClick={() => navigateTo('downloads')} className={`text-sm font-medium transition-colors ${currentPage === 'downloads' ? 'text-[#b95c35]' : 'text-gray-700 hover:text-[#b95c35]'}`}>Descargas</button>
              <button onClick={() => navigateTo('equipment')} className={`text-sm font-medium transition-colors ${currentPage === 'equipment' ? 'text-[#b95c35]' : 'text-gray-700 hover:text-[#b95c35]'}`}>Equipamiento</button>
              <button onClick={() => navigateTo('contact')} className={`text-sm font-medium transition-colors ${currentPage === 'contact' ? 'text-[#b95c35]' : 'text-gray-700 hover:text-[#b95c35]'}`}>Contacto</button>
            </nav>

            <div className="hidden md:flex items-center space-x-4">
              {isSubscribed ? (
                <div className="flex items-center text-emerald-600 text-sm font-bold">
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Suscripcion activa
                </div>
              ) : (
                <button onClick={() => navigateTo('downloads')} className="bg-[#1a1a1a] text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-black transition-colors">
                  Activar descargas
                </button>
              )}
            </div>

            <div className="md:hidden flex items-center space-x-2">
              <button onClick={() => setIsMobileMenuOpen((prev) => !prev)} className="text-gray-700 p-2">
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-gray-100 px-4 pt-2 pb-4 space-y-1 shadow-lg absolute w-full">
            <button onClick={() => navigateTo('home')} className="block w-full text-left px-3 py-3 text-base font-medium text-gray-900 border-b border-gray-50">Inicio</button>
            <button onClick={() => navigateTo('downloads')} className="block w-full text-left px-3 py-3 text-base font-medium text-gray-900 border-b border-gray-50">Descargas</button>
            <button onClick={() => navigateTo('equipment')} className="block w-full text-left px-3 py-3 text-base font-medium text-gray-900 border-b border-gray-50">Equipamiento</button>
            <button onClick={() => navigateTo('contact')} className="block w-full text-left px-3 py-3 text-base font-medium text-gray-900 border-b border-gray-50">Contacto</button>
          </div>
        )}
      </header>

      <main className="flex-grow">
        {currentPage === 'home' && (
          <HomeView isSubscribed={isSubscribed} onSubscribe={handleSubscribe} navigateTo={navigateTo} />
        )}
        {currentPage === 'downloads' && (
          <DownloadsView
            isSubscribed={isSubscribed}
            onSubscribe={handleSubscribe}
            pdfs={PDFS}
          />
        )}
        {currentPage === 'equipment' && <EquipmentView />}
        {currentPage === 'contact' && <ContactView />}
        {currentPage === 'affiliate-disclosure' && <AffiliateDisclosureView navigateTo={navigateTo} />}
        {currentPage === 'ads-disclosure' && <AdsDisclosureView navigateTo={navigateTo} />}
      </main>

      <footer className="bg-[#1a1a1a] text-white py-12 mt-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <button className="flex items-center mb-4 cursor-pointer" onClick={() => navigateTo('home')}>
                <ChefHat className="h-6 w-6 text-[#b95c35]" />
                <span className="ml-2 font-serif text-xl font-bold">VirtualChef</span>
              </button>
              <p className="text-gray-400 text-sm max-w-md">
                Trabajando para formarte.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 uppercase text-xs tracking-wider text-gray-500">Secciones</h4>
              <ul className="space-y-2 text-sm text-gray-300">
                <li><button onClick={() => navigateTo('downloads')} className="hover:text-white">Descargas</button></li>
                <li><button onClick={() => navigateTo('equipment')} className="hover:text-white">Equipamiento</button></li>
                <li><button onClick={() => navigateTo('contact')} className="hover:text-white">Contacto</button></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-6">
            <p className="text-xs text-gray-500 mb-4 max-w-2xl">
              Como Asociado de Amazon, obtenemos ingresos por las compras adscritas que cumplen los requisitos aplicables. Amazon y el logo de Amazon son marcas registradas de Amazon.com, Inc. o sus filiales.
            </p>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-sm text-gray-500">
              <p>© {new Date().getFullYear()} VirtualChef. Todos los derechos reservados.</p>
              <div className="flex gap-4 text-xs text-gray-600">
                <button onClick={() => navigateTo('affiliate-disclosure')} className="hover:text-gray-300">Política de afiliados</button>
                <button onClick={() => navigateTo('ads-disclosure')} className="hover:text-gray-300">Política de anuncios</button>
                <button onClick={() => navigateTo('contact')} className="hover:text-gray-300">Contacto</button>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function HomeView({
  isSubscribed,
  onSubscribe,
  navigateTo,
}: {
  isSubscribed: boolean;
  onSubscribe: (email: string, source: SubscriptionSource) => Promise<void>;
  navigateTo: (page: Page) => void;
}) {
  const homePurposes = [
    'Un módulo nuevo cada dos semanas. Técnica explicada desde la física y la química del proceso, no desde la intuición.',
    'Una colección de recetas de alta cocina cada mes. Elaboraciones de nivel profesional adaptadas a cocina doméstica.',
    'Errores documentados con causa y corrección. Porque entender por qué algo falla es lo que convierte a un cocinero en técnico.',
  ];

  return (
    <div>
      <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-block px-3 py-1 bg-[#b95c35]/10 text-[#b95c35] text-xs font-bold tracking-wider uppercase rounded-full mb-6">
              Técnica profesional. Gratis. Cada dos semanas.
            </div>
            <h1 className="text-4xl md:text-6xl font-serif font-bold leading-[1.1] mb-6">
              Aprende a cocinar <span className="italic text-[#b95c35]">como un profesional</span>. Sin humo, sin trucos, con técnica real.
            </h1>
            <p className="text-lg text-gray-600 mb-5">
              VirtualChef nació para cerrar la brecha entre las recetas que se leen y los platos que salen bien. Cada módulo explica el porqué detrás de cada técnica: temperatura, textura, reacción química, error común y corrección.
            </p>
            <p className="text-lg text-gray-600 mb-8">
              Nuevo módulo de técnica cada dos semanas. Nueva colección de recetas de alta cocina cada mes. Todo gratis o a precio de café.
            </p>

            <SubscribeForm
              onSubscribe={onSubscribe}
              isSubscribed={isSubscribed}
              source="newsletter"
              buttonText="Unirme al newsletter"
              className="max-w-md"
            />
            {!isSubscribed && <p className="text-xs text-gray-400 mt-3 ml-2">Recibiras nuevas guias y actualizaciones de descargas por email.</p>}
          </div>

          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl mb-4">
              <img
                src={HOME_HERO_IMAGE}
                alt="Equipo de cocina profesional"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2 rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800"
                  alt="Restaurante profesional"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img
                  src="https://images.unsplash.com/photo-1600891964092-4316c288032e?w=800"
                  alt="Plato de alta cocina"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-16 border-y border-gray-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-serif font-bold mb-4">Nuestros propositos</h2>
          <p className="text-gray-600 mb-10 max-w-2xl">
            VirtualChef existe para que cocinar bien sea una habilidad entrenable. Menos improvisacion, mas resultados consistentes.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {homePurposes.map((purpose) => (
              <article key={purpose} className="rounded-2xl border border-gray-100 p-6 bg-[#fdfcfa]">
                <p className="text-sm text-gray-700 leading-relaxed">{purpose}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => navigateTo('downloads')}
            className="text-left rounded-2xl border border-gray-200 p-8 bg-white hover:shadow-lg transition-shadow"
          >
            <h3 className="font-serif font-bold text-2xl mb-2">Descargas</h3>
            <p className="text-sm text-gray-600 mb-5">Tu biblioteca de PDFs se gestiona desde backend, sin redeploy.</p>
            <span className="inline-flex items-center text-sm font-bold text-[#b95c35]">Ver recursos <ArrowRight className="h-4 w-4 ml-1" /></span>
          </button>
          <button
            onClick={() => navigateTo('equipment')}
            className="text-left rounded-2xl border border-gray-200 p-8 bg-white hover:shadow-lg transition-shadow"
          >
            <h3 className="font-serif font-bold text-2xl mb-2">Equipamiento</h3>
            <p className="text-sm text-gray-600 mb-5">Seleccion de herramientas con enlaces de afiliado.</p>
            <span className="inline-flex items-center text-sm font-bold text-[#b95c35]">Ver seleccion <ArrowRight className="h-4 w-4 ml-1" /></span>
          </button>
        </div>
      </section>
    </div>
  );
}

function DownloadsView({
  isSubscribed,
  onSubscribe,
  pdfs,
}: {
  isSubscribed: boolean;
  onSubscribe: (email: string, source: SubscriptionSource) => Promise<void>;
  pdfs: PdfResource[];
}) {
  const [gumroadCoverVisible, setGumroadCoverVisible] = useState(true);

  const handleDownload = (pdf: PdfResource) => {
    if (!isSubscribed) {
      document.getElementById('downloads-subscribe')?.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    window.open(DOWNLOAD_AD_URL, '_blank', 'noopener,noreferrer');
    const link = document.createElement('a');
    link.href = pdf.url;
    link.download = '';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    const email = window.localStorage.getItem(LAST_SUBSCRIBER_KEY);
    void trackDownload(email, pdf.title, pdf.id).catch(() => {});
  };

  return (
    <div className="bg-[#fdfcfa] min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Descargas</h1>
          <p className="text-lg text-gray-600">
            Biblioteca dinamica de PDFs tecnicos de VirtualChef.
            {isSubscribed ? <span className="text-emerald-600 font-bold block mt-2">Acceso desbloqueado.</span> : ' Suscribete para desbloquear.'}
          </p>
        </div>

        {pdfs.length === 0 && (
          <div className="mb-16 rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
            No hay PDFs publicados todavia.
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {pdfs.map((pdf) => (
            <article key={pdf.id} className={`bg-white rounded-2xl p-6 border shadow-sm transition-all flex flex-col h-full ${isSubscribed ? 'border-emerald-200 hover:shadow-md hover:border-emerald-300' : 'border-gray-100'}`}>
              {pdf.cover && (
                <div className="aspect-square bg-white rounded-xl p-2 flex items-center justify-center shrink-0 border border-gray-100 mb-4">
                  <img src={pdf.cover} alt={pdf.title} className="w-full h-full object-contain rounded-lg" />
                </div>
              )}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 border ${isSubscribed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-gray-50 text-gray-700 border-gray-100'}`}>
                {isSubscribed ? <Download className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
              </div>
              <h3 className="font-serif font-bold text-lg mb-2">{pdf.title}</h3>
              <p className="text-sm text-gray-500 mb-6 flex-grow">{pdf.description}</p>
              <button
                onClick={() => handleDownload(pdf)}
                className={`w-full py-2.5 rounded-xl border-2 font-bold text-sm transition-colors flex items-center justify-center ${
                  isSubscribed ? 'border-emerald-600 text-emerald-700 hover:bg-emerald-50' : 'border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white'
                }`}
              >
                {isSubscribed ? 'Abrir PDF' : 'Desbloquear PDF'}
              </button>
            </article>
          ))}
        </div>

        <div className="mb-16">
          <article className="bg-white rounded-2xl px-6 py-4 border shadow-sm transition-all flex flex-col h-full border-gray-100">
            {gumroadCoverVisible && (
              <div className="bg-white rounded-xl p-2 flex items-center justify-center shrink-0 border border-gray-100 mb-4">
                <img
                  src="/gumroad/cover.png"
                  alt="Recetas Técnicas — Colección de Invierno"
                  className="w-full h-[280px] object-cover rounded-lg"
                  onError={() => setGumroadCoverVisible(false)}
                />
              </div>
            )}
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 border bg-gray-50 text-gray-700 border-gray-100">
              <ExternalLink className="h-5 w-5" />
            </div>
            <h3 className="font-serif font-bold text-lg mb-2">Recetas Técnicas — Colección de Invierno</h3>
            <p className="text-sm text-gray-500 mb-6 flex-grow">
              Bacalao confitado, carrilleras braseadas, pichón en cocotte, suquet de roca, crémeux de cítricos y puerros en beurre noisette. Técnica profesional explicada paso a paso.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = '/gumroad/demo.pdf';
                  link.download = '';
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-colors flex items-center justify-center border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white"
              >
                Descargar demo
              </button>
              <button
                onClick={() => window.open('https://virtualchef.gumroad.com/l/recetasinvierno', '_blank', 'noopener,noreferrer')}
                className="flex-1 py-2.5 rounded-xl border-2 font-bold text-sm transition-colors flex items-center justify-center border-emerald-600 text-emerald-700 hover:bg-emerald-50"
              >
                Conseguir colección →
              </button>
            </div>
          </article>
        </div>

        {!isSubscribed && (
          <div id="downloads-subscribe" className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-lg border border-gray-100 text-center">
            <h3 className="text-2xl font-serif font-bold mb-2">Activa tus descargas</h3>
            <p className="text-gray-600 mb-6">Tu email se guarda en base de datos para newsletter y acceso permanente a recursos.</p>
            <SubscribeForm onSubscribe={onSubscribe} isSubscribed={isSubscribed} source="downloads" buttonText="Desbloquear recursos" />
          </div>
        )}
      </div>
    </div>
  );
}

function EquipmentView() {
  return (
    <div className="bg-white min-h-screen py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Equipamiento</h1>
          <p className="text-lg text-gray-600">
            Seleccion recomendada con enlaces de afiliado activos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {EQUIPMENT.map((item) => (
            <article key={item.name} className="flex flex-col sm:flex-row gap-6 p-6 border border-gray-100 rounded-2xl hover:shadow-lg transition-shadow bg-gray-50/50">
              <div className="sm:w-1/3 aspect-square bg-white rounded-xl p-2 flex items-center justify-center shrink-0 border border-gray-100">
                <img src={item.img} alt={item.name} className="w-full h-full object-contain rounded-lg" />
              </div>
              <div className="sm:w-2/3 flex flex-col justify-center">
                <span className="text-xs font-bold uppercase tracking-wider text-[#b95c35] mb-1">{item.cat}</span>
                <h3 className="text-xl font-serif font-bold mb-2">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-6 flex-grow">{item.desc}</p>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer sponsored"
                  className="inline-flex items-center justify-center w-full sm:w-auto text-sm font-bold text-white bg-[#e47911] hover:bg-[#f3a847] px-6 py-3 rounded-xl transition-colors"
                >
                  Ver en Amazon <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── CONTACT VIEW ────────────────────────────────────────────────────────────
function ContactView() {
  const CONTACT_EMAIL = 'contact@worldwiderecipes.app';
  const CONSULTING_SUBJECT = encodeURIComponent('Consultoría VirtualChef');
  const CONSULTING_BODY = encodeURIComponent(
    'Hola,\n\nEstoy interesado/a en una consultoría sobre cocina técnica.\n\nTema: \nDisponibilidad: \n\nGracias.'
  );

  return (
    <div className="bg-[#fdfcfa] min-h-screen py-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Contacto</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            Si tienes dudas sobre el contenido, quieres proponer una colaboración o necesitas ayuda personalizada, escríbenos directamente.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* General contact */}
          <article className="bg-white rounded-3xl border border-gray-100 p-8 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-[#b95c35]/10 flex items-center justify-center mb-6">
              <Mail className="h-6 w-6 text-[#b95c35]" />
            </div>
            <h2 className="font-serif font-bold text-2xl mb-3">Contacto general</h2>
            <p className="text-sm text-gray-600 mb-8 flex-grow">
              Preguntas sobre el contenido, sugerencias de guías, errores en PDFs, o cualquier otra consulta sobre VirtualChef.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="inline-flex items-center justify-center gap-2 bg-[#1a1a1a] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-black transition-colors"
            >
              <Mail className="h-4 w-4" />
              Enviar email
            </a>
            <p className="text-xs text-gray-400 mt-3 text-center">{CONTACT_EMAIL}</p>
          </article>

          {/* Consulting */}
          <article className="bg-white rounded-3xl border border-[#b95c35]/20 p-8 shadow-sm flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-[#b95c35]/10 flex items-center justify-center mb-6">
              <ChefHat className="h-6 w-6 text-[#b95c35]" />
            </div>
            <h2 className="font-serif font-bold text-2xl mb-3">Consultoría</h2>
            <p className="text-sm text-gray-600 mb-8 flex-grow">
              ¿Quieres mejorar la técnica de tu equipo o formación personalizada? Cuéntanos el contexto y lo valoramos juntos.
            </p>
            <a
              href={`mailto:${CONTACT_EMAIL}?subject=${CONSULTING_SUBJECT}&body=${CONSULTING_BODY}`}
              className="inline-flex items-center justify-center gap-2 bg-[#b95c35] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#9a4c2b] transition-colors"
            >
              <ArrowRight className="h-4 w-4" />
              Solicitar consultoría
            </a>
            <p className="text-xs text-gray-400 mt-3 text-center">Tiempo de respuesta: 2–3 días hábiles</p>
          </article>
        </div>

        <div className="mt-12 bg-white rounded-2xl border border-gray-100 p-6 text-sm text-gray-500">
          <p>
            <strong className="text-gray-700">Colaboraciones y sponsorships:</strong> Si representas una marca de utensilios, ingredientes o alimentación y quieres colaborar con VirtualChef, escríbenos a {' '}
            <a href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent('Colaboración/Sponsorship')}`} className="text-[#b95c35] hover:underline">{CONTACT_EMAIL}</a>
            {' '}con el asunto "Colaboración".
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── AFFILIATE DISCLOSURE VIEW ───────────────────────────────────────────────
function AffiliateDisclosureView({ navigateTo }: { navigateTo: (page: Page) => void }) {
  return (
    <div className="bg-[#fdfcfa] min-h-screen py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold mb-4">Política de afiliados</h1>
        <p className="text-xs text-gray-400 mb-10">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}</p>

        <div className="prose text-gray-700 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-serif font-bold text-xl mb-3">Amazon Associates</h2>
            <p>
              VirtualChef (worldwiderecipes.app) participa en el Programa de Afiliados de Amazon EU, un programa de publicidad para afiliados diseñado para ofrecer a sitios web un medio para obtener honorarios por publicidad mediante la creación de enlaces a amazon.es y sus tiendas asociadas.
            </p>
            <p className="mt-3 p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs">
              <strong>Aviso legal requerido:</strong> Como Asociado de Amazon, obtenemos ingresos por las compras adscritas que cumplen los requisitos aplicables. Amazon y el logo de Amazon son marcas registradas de Amazon.com, Inc. o sus filiales.
            </p>
          </section>

          <section>
            <h2 className="font-serif font-bold text-xl mb-3">Qué son los enlaces de afiliado</h2>
            <p>
              Algunos enlaces en la sección de Equipamiento incluyen un identificador de seguimiento. Si haces clic en uno y realizas una compra, recibimos una pequeña comisión (entre el 3% y el 10% según categoría) sin ningún coste adicional para ti.
            </p>
          </section>

          <section>
            <h2 className="font-serif font-bold text-xl mb-3">Nuestra política editorial</h2>
            <p>
              Los productos recomendados son seleccionados exclusivamente por su utilidad técnica en cocina. No aceptamos pago por incluir un producto específico, ni los afiliados tienen influencia sobre los contenidos educativos. Las comisiones contribuyen a mantener el servicio gratuito.
            </p>
          </section>

          <section>
            <h2 className="font-serif font-bold text-xl mb-3">Cómo identificamos los enlaces</h2>
            <p>
              Los botones "Ver en Amazon" contienen el atributo <code className="bg-gray-100 px-1 rounded">rel="sponsored"</code> para conformidad con directrices de Google y FTC. No usamos técnicas de ocultación de enlaces.
            </p>
          </section>
        </div>

        <button onClick={() => navigateTo('home')} className="mt-10 text-sm text-[#b95c35] hover:underline flex items-center gap-1">
          <ArrowRight className="h-3 w-3 rotate-180" /> Volver al inicio
        </button>
      </div>
    </div>
  );
}

// ─── ADS DISCLOSURE VIEW ─────────────────────────────────────────────────────
function AdsDisclosureView({ navigateTo }: { navigateTo: (page: Page) => void }) {
  return (
    <div className="bg-[#fdfcfa] min-h-screen py-16">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-serif font-bold mb-4">Política de anuncios</h1>
        <p className="text-xs text-gray-400 mb-10">Última actualización: {new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long' })}</p>

        <div className="prose text-gray-700 space-y-6 text-sm leading-relaxed">
          <section>
            <h2 className="font-serif font-bold text-xl mb-3">Cómo funciona la publicidad en VirtualChef</h2>
            <p>
              Para sostener el acceso gratuito a todos los recursos, VirtualChef muestra un anuncio externo durante la primera descarga de un PDF. Este anuncio se abre en una nueva pestaña, separado del PDF, y puedes cerrarlo inmediatamente.
            </p>
          </section>

          <section>
            <h2 className="font-serif font-bold text-xl mb-3">Frecuencia</h2>
            <p>
              El anuncio se muestra <strong>una sola vez por dispositivo y navegador</strong>. Las descargas siguientes son directas, sin publicidad adicional. No usamos anuncios emergentes (pop-ups bloqueantes) ni ventanas que interfieran con la descarga del PDF.
            </p>
          </section>

          <section>
            <h2 className="font-serif font-bold text-xl mb-3">Proveedores</h2>
            <p>
              Trabajamos con redes publicitarias de rendimiento (CPM) para sitios de contenido. Los anunciantes son seleccionados por la red conforme a sus propias políticas. VirtualChef no controla el contenido específico de cada anuncio, pero rechaza categorías sensibles mediante configuración de la plataforma.
            </p>
          </section>

          <section>
            <h2 className="font-serif font-bold text-xl mb-3">Sin datos adicionales</h2>
            <p>
              La URL del anuncio se abre directamente en el navegador. No transmitimos datos personales tuyos al proveedor publicitario más allá de los que tu propio navegador comparte al acceder a cualquier URL externa (IP, user-agent).
            </p>
          </section>

          <section>
            <h2 className="font-serif font-bold text-xl mb-3">Preguntas</h2>
            <p>
              Si tienes dudas sobre la política de anuncios, escríbenos a{' '}
              <a href="mailto:contact@worldwiderecipes.app" className="text-[#b95c35] hover:underline">contact@worldwiderecipes.app</a>.
            </p>
          </section>
        </div>

        <button onClick={() => navigateTo('home')} className="mt-10 text-sm text-[#b95c35] hover:underline flex items-center gap-1">
          <ArrowRight className="h-3 w-3 rotate-180" /> Volver al inicio
        </button>
      </div>
    </div>
  );
}
