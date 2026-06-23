import {
  ArrowRight,
  CheckCircle2,
  Handshake,
  PackageSearch,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Truck,
} from 'lucide-react';
import { useRouter } from '../contexts/RouterContext';
import { useOptionalUser } from '../contexts/UserContext';
import { Button } from './ui/button';

const buyerTypes = ['Retail Stores', 'Wholesalers', 'Ecommerce Sellers', 'Chain Buyers', 'Distributors / Importers'];

const workspaceScreenshotSrc = `${import.meta.env.BASE_URL}customer-workspace-preview.png`;

const heroPillars = ['Mixed-category sourcing', 'Regular product updates', 'Order visibility'];
const serviceCapabilities = [
  {
    title: 'Consolidated Sourcing',
    text: 'One buying list can cover many categories, mixed quantities, and multiple supplier options.',
    icon: PackageSearch,
  },
  {
    title: 'Supplier & Price Work',
    text: 'COSUN helps search, compare, negotiate, and organize suitable options for your review.',
    icon: Handshake,
  },
  {
    title: 'QC & Shipment Follow-up',
    text: 'Quality checks, booking, loading, shipment updates, and documents are coordinated for you.',
    icon: ShieldCheck,
  },
  {
    title: 'New Product Push',
    text: 'We regularly recommend category updates so your local offer stays competitive.',
    icon: Sparkles,
  },
  {
    title: 'Reorder Support',
    text: 'Past quotes, items, and order records stay usable when you need replenishment or replacements.',
    icon: RefreshCw,
  },
  {
    title: 'Delivery Visibility',
    text: 'Order status, QC updates, shipment records, and documents remain visible in your workspace.',
    icon: Truck,
  },
];
const decisionRows = [
  {
    need: 'I buy mixed products repeatedly.',
    answer: 'Send categories, photos, links, quantities, or notes. COSUN helps turn scattered needs into organized sourcing options.',
  },
  {
    need: 'I spend too much time managing suppliers.',
    answer: 'Instead of chasing many small suppliers by yourself, work with COSUN as one sourcing partner across categories.',
  },
  {
    need: 'I need products, orders, and reorders to stay clear.',
    answer: 'Your quotations, orders, QC updates, shipment records, and reorder history stay connected for future buying.',
  },
];

function WorkspaceScreenshot() {
  return (
    <div
      className="mx-auto max-w-2xl rounded-lg bg-white/8 p-2 shadow-2xl ring-1 ring-white/20 lg:ml-auto lg:mr-0 lg:max-w-3xl"
      style={{ perspective: '1400px' }}
    >
      <div
        className="overflow-hidden rounded-md bg-white"
        style={{
          aspectRatio: '1.95 / 1',
          transform: 'rotateY(-9deg) rotateZ(0.55deg)',
          transformOrigin: 'center center',
          boxShadow: '0 28px 70px rgba(0, 0, 0, 0.38)',
        }}
      >
        <img
          src={workspaceScreenshotSrc}
          alt="Customer workspace interface"
          className="block h-auto max-w-none"
          style={{
            width: '128%',
            transform: 'translateX(0) translateY(0)',
            transformOrigin: 'left top',
          }}
        />
      </div>
    </div>
  );
}

export function RetailWholesale() {
  const { navigateTo } = useRouter();
  const userContext = useOptionalUser();
  const customerEntry = userContext?.user ? 'dashboard' : 'login';

  const goDepartments = () => {
    const scrollToDepartments = (attempt = 0) => {
      const target = document.getElementById('shop-by-department');
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        return;
      }
      if (attempt < 12) {
        window.setTimeout(() => scrollToDepartments(attempt + 1), 80);
      }
    };

    navigateTo('home');
    window.setTimeout(() => scrollToDepartments(), 80);
  };
  const goPortal = () => navigateTo(customerEntry);

  return (
    <div className="overflow-hidden bg-white text-gray-900" style={{ maxWidth: '100vw' }}>
      <section
        className="relative isolate text-white"
        style={{
          maxWidth: '100vw',
          background:
            'radial-gradient(circle at 82% 10%, rgba(34,197,94,0.28), transparent 32%), linear-gradient(135deg, #111827 0%, #020617 58%, #14532d 100%)',
        }}
      >
        <div className="cosun-shell relative grid min-h-[560px] min-w-0 gap-8 py-10 md:grid-cols-2 md:items-center lg:gap-12 lg:py-12">
          <div className="min-w-0" style={{ maxWidth: 'calc(100vw - 32px)' }}>
            <h1 className="max-w-3xl break-words text-4xl font-black leading-[0.98] tracking-normal sm:text-5xl md:text-[60px]">
              One Sourcing Partner
              <span className="block">New Products Regularly</span>
              <span className="block">Track Every Order.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-gray-200 md:text-lg md:leading-8">
              Instead of managing many scattered suppliers, COSUN helps you source, negotiate, control quality,
              book shipments, discover new products, and track every order in one connected workspace.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                onClick={goPortal}
                className="h-10 bg-red-600 px-5 text-sm font-semibold leading-none hover:bg-red-700 md:text-base"
                style={{ width: 'min(100%, 220px)' }}
              >
                Send Buying List
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={goDepartments}
                variant="outline"
                className="h-10 border-white/50 bg-white/5 px-5 text-sm font-semibold leading-none text-white hover:!border-white hover:!bg-white/12 hover:!text-white md:text-base"
                style={{ width: 'min(100%, 220px)' }}
              >
                Browse Departments
              </Button>
            </div>
            <div className="mt-6 grid gap-3 text-sm font-semibold text-white md:grid-cols-3">
              {heroPillars.map((item) => (
                <div key={item} className="flex min-h-[64px] items-center gap-3 rounded-md border border-white/15 bg-white/10 px-4 shadow-sm">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-300" />
                  <span className="leading-snug">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="min-w-0 md:pl-2 lg:pl-4">
            <WorkspaceScreenshot />
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm font-semibold leading-6 text-green-100 lg:mr-0">
              Your inquiries, quotations, orders, QC updates, shipment records, and reorder history stay organized
              in one customer workspace.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-10">
        <div className="cosun-shell">
          <div className="max-w-3xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-red-600">Service capabilities</p>
            <h2 className="text-2xl font-black leading-tight text-gray-950 md:text-3xl">
              One partner for the supplier work behind every order.
            </h2>
            <p className="mt-3 text-base leading-7 text-gray-600">
              COSUN helps retail and wholesale buyers reduce supplier coordination, control quality, manage shipment
              follow-up, and keep discovering new products across categories.
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {serviceCapabilities.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black leading-6 text-gray-950">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-gray-600">{item.text}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white py-9">
        <div className="cosun-shell">
          <div className="border-b border-gray-200 pb-5 md:flex md:items-end md:justify-between md:gap-8">
            <div className="max-w-xl">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-red-600">Check the fit</p>
              <h2 className="text-2xl font-black leading-tight md:text-3xl">Is this your buying workflow?</h2>
              <p className="mt-3 text-base leading-7 text-gray-600">
                Built for buyers who source mixed products, compare supplier options, and reorder with records.
              </p>
            </div>
            <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-sm font-semibold text-gray-700 md:mt-0 md:justify-end">
              {buyerTypes.map((type) => (
                <span key={type} className="border-b border-gray-300 pb-1">
                  {type}
                </span>
              ))}
            </div>
          </div>

          <div className="divide-y divide-gray-200">
            {decisionRows.map((row) => (
              <div key={row.need} className="grid gap-3 py-5 md:grid-cols-2 md:items-start md:gap-8">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
                  <p className="text-base font-black leading-6 text-gray-950">{row.need}</p>
                </div>
                <p className="text-base leading-7 text-gray-600">{row.answer}</p>
              </div>
            ))}
            <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-base font-semibold text-gray-800">
                Start with a buying list. We help turn it into a sourcing plan.
              </p>
              <Button onClick={goPortal} className="h-10 bg-red-600 px-5 font-semibold text-white hover:bg-red-700">
                Send Buying List
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
