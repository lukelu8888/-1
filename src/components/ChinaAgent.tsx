import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardList,
  Eye,
  Handshake,
  MapPin,
  MessagesSquare,
  Route,
  ShieldCheck,
  UserRoundCheck,
} from 'lucide-react';
import { useRouter } from '../contexts/RouterContext';
import { useOptionalUser } from '../contexts/UserContext';
import { Button } from './ui/button';

const heroImage =
  'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=2200&q=82';

const buyerGroups = [
  'Companies without a China office',
  'Importers looking for a local execution team',
  'Brands or wholesalers that need supplier follow-up',
  'Buyers who want an agent, not only a supplier list',
  'Teams that need someone in China to communicate, check, and coordinate',
];

const agentWork = [
  {
    title: 'Represent your requirement locally',
    text: 'COSUN turns your buying goal, sample, drawing, product link, or problem into a clear China-side action brief.',
    icon: UserRoundCheck,
  },
  {
    title: 'Talk to suppliers on your behalf',
    text: 'We contact factories, trading suppliers, workshops, and service providers, then filter responses into practical options.',
    icon: MessagesSquare,
  },
  {
    title: 'Follow the work after the quote',
    text: 'Samples, order confirmation, production progress, QC, shipment, and documents are coordinated instead of left scattered.',
    icon: Route,
  },
];

const agentPromises = [
  'Supplier search and first screening',
  'Quote follow-up and comparison',
  'Sample and packaging coordination',
  'Production milestone updates',
  'QC and loading arrangement',
  'Shipping document follow-up',
  'Issue escalation and local communication',
  'Repeat-order records in the customer workspace',
];

const confidenceRows = [
  ['Local presence', 'A China-side team to communicate, check, follow up, and coordinate practical details.'],
  ['Process visibility', 'Supplier options, quotes, samples, orders, QC, shipment, and files stay traceable.'],
  ['Long-term cooperation', 'Useful records are kept so the next inquiry, replacement, or repeat order is easier.'],
];

export function ChinaAgent() {
  const { navigateTo } = useRouter();
  const userContext = useOptionalUser();
  const customerEntry = userContext?.user ? 'dashboard' : 'login';
  const goPortal = () => navigateTo(customerEntry);

  return (
    <div className="overflow-hidden bg-white text-gray-950" style={{ maxWidth: '100vw' }}>
      <section className="relative isolate bg-gray-950 text-white">
        <img
          src={heroImage}
          alt="Warehouse and shipment coordination"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'brightness(0.52) saturate(0.92)', objectPosition: 'center 52%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/88 to-gray-950/40" />
        <div className="cosun-shell relative grid min-h-[560px] gap-8 py-14 lg:grid-cols-2 lg:items-center">
          <div>
            <h1 className="max-w-3xl text-4xl font-black leading-[1.02] tracking-normal sm:text-5xl md:text-[62px]">
              Your trusted agent in China.
            </h1>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-7 text-gray-100 md:text-lg">
              COSUN helps overseas buyers work with Chinese suppliers through local representation,
              supplier communication, quotation follow-up, sample coordination, order tracking, QC, shipment,
              and customer workspace updates.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={goPortal} className="h-12 bg-red-600 px-6 text-base font-semibold hover:bg-red-700">
                Talk to a China Agent
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={goPortal}
                variant="outline"
                className="h-12 border-white/50 bg-white/5 px-6 text-base font-semibold text-white hover:!border-white hover:!bg-white/12 hover:!text-white"
              >
                Submit Buying Brief
              </Button>
            </div>
          </div>

          <div className="rounded-md border border-white/15 p-5 backdrop-blur-sm" style={{ backgroundColor: 'rgba(17, 24, 39, 0.72)' }}>
            <div className="flex items-start gap-3 border-b border-white/15 pb-4">
              <MapPin className="mt-1 h-5 w-5 shrink-0 text-red-200" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-red-100">For buyers looking for an agent</p>
                <h2 className="mt-1 text-2xl font-black leading-tight text-white">Not only sourcing. Local execution.</h2>
              </div>
            </div>
            <div className="mt-4 space-y-3">
              {buyerGroups.map((item) => (
                <div key={item} className="flex items-start gap-2 text-sm font-semibold leading-6 text-gray-100">
                  <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-red-200" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="cosun-shell">
          <div className="grid gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-red-700">What an agent means</p>
              <h2 className="text-2xl font-black leading-tight md:text-3xl">
                A China-side representative for supplier work you cannot handle remotely.
              </h2>
              <p className="mt-4 text-base leading-7 text-gray-600">
                The customer may already know the product, or may only know the buying goal. COSUN acts as the local
                execution partner: searching, asking, comparing, checking, following up, and reporting back.
              </p>
            </div>

            <div className="grid gap-3 lg:col-span-8">
              {agentWork.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="grid gap-4 rounded-md border border-gray-200 bg-gray-50 p-4 shadow-sm sm:grid-cols-[52px_1fr_28px] sm:items-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-red-50 text-red-700">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.08em] text-gray-400">Agent role {index + 1}</p>
                      <h3 className="mt-1 text-lg font-black text-gray-950">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-gray-600">{item.text}</p>
                    </div>
                    <ArrowRight className="hidden h-5 w-5 text-red-700 sm:block" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="py-10 text-white" style={{ backgroundColor: '#111827' }}>
        <div className="cosun-shell">
          <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-red-200">Agent execution scope</p>
              <h2 className="text-2xl font-black leading-tight">
                From first contact to order follow-up.
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-gray-300">
                COSUN keeps supplier communication, samples, QC, shipping documents, and repeat-order records in one visible operating flow.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:col-span-8">
              {agentPromises.map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-md px-3 py-2 ring-1 ring-white/10" style={{ backgroundColor: 'rgba(255,255,255,0.07)' }}>
                  <ShieldCheck className="h-4 w-4 shrink-0 text-red-200" />
                  <span className="text-sm font-semibold leading-5 text-gray-100">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="cosun-shell">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-red-50 text-red-700">
                  <Eye className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-red-700">Transparent agent work</p>
                  <h2 className="text-xl font-black leading-tight text-gray-950">What customers can follow</h2>
                </div>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ['Brief', 'Submitted requirement and buying goal'],
                  ['Suppliers', 'Candidates, responses, and notes'],
                  ['Quotes', 'Price, MOQ, lead time, trade terms'],
                  ['Samples', 'Request, feedback, and confirmation'],
                  ['Orders', 'Production, QC, issue updates'],
                  ['Shipment', 'Documents, loading, and delivery follow-up'],
                ].map(([label, text]) => (
                  <div key={label} className="rounded-md border border-gray-200 bg-gray-50 p-4">
                    <p className="text-sm font-black text-gray-950">{label}</p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-gray-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
              <p className="mb-4 text-xs font-bold uppercase tracking-[0.08em] text-red-700">Why buyers choose an agent</p>
              <div className="space-y-4">
                {confidenceRows.map(([title, text]) => (
                  <div key={title} className="border-b border-gray-100 pb-4 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      {title === 'Local presence' ? (
                        <Building2 className="h-4 w-4 text-red-700" />
                      ) : title === 'Process visibility' ? (
                        <ClipboardList className="h-4 w-4 text-red-700" />
                      ) : (
                        <Handshake className="h-4 w-4 text-red-700" />
                      )}
                      <h3 className="font-black text-gray-950">{title}</h3>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-gray-600">{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-3xl text-base font-semibold leading-7 text-gray-800">
              If you need someone in China to represent your buying work, communicate with suppliers, and keep
              the execution visible, COSUN can be your China Agent.
            </p>
            <Button onClick={goPortal} className="h-10 bg-red-600 px-5 font-semibold text-white hover:bg-red-700">
              Start With COSUN
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
