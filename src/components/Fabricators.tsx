import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  FileSearch,
  Layers3,
  PackageCheck,
  Repeat2,
  Ruler,
  ShieldCheck,
  Store,
  Truck,
  Wrench,
} from 'lucide-react';
import { useRouter } from '../contexts/RouterContext';
import { useOptionalUser } from '../contexts/UserContext';
import { Button } from './ui/button';

const heroImage =
  'https://images.unsplash.com/photo-1741950903662-14c405ea452c?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=72&w=2200';

const supportAreas = [
  {
    title: 'Standard items',
    text: 'Materials, tools, hardware, consumables, packaging, equipment parts, spare parts, and supporting items.',
    icon: Layers3,
  },
  {
    title: 'Custom-made parts',
    text: 'Parts made from drawings, samples, size, material, finish, process, function, or application needs.',
    icon: Ruler,
  },
  {
    title: 'Supplier matching',
    text: 'Find factories, workshops, OEM/ODM makers, specialist vendors, and batch-capable supplier resources.',
    icon: Factory,
  },
  {
    title: 'Alternatives and substitutes',
    text: 'Search equivalent models, replacement materials, brand alternatives, discontinued items, and cost-down options.',
    icon: Repeat2,
  },
];

const customerTypes = [
  'Fabricators and workshops',
  'Local manufacturers',
  'OEM / ODM buyers',
  'Installers and contractors',
  'Repair and maintenance teams',
  'Textile, metal, plastic, packaging, furniture, door and window businesses',
];

const requirementInputs = [
  'Drawing or sketch',
  'Sample photo',
  'Product link',
  'Current supplier reference',
  'Size / material / finish',
  'Usage scenario',
  'Monthly quantity',
  'Target price',
  'Packing request',
  'Delivery destination',
];

const workflowSteps = [
  {
    title: 'Requirement',
    text: 'Tell COSUN what you make, repair, assemble, or need to source.',
  },
  {
    title: 'Supplier search',
    text: 'We look for suitable factories, specialist suppliers, and possible alternatives.',
  },
  {
    title: 'Quote comparison',
    text: 'Compare price, MOQ, lead time, capability, sample path, and production fit.',
  },
  {
    title: 'Sample confirmation',
    text: 'Confirm samples, drawings, photos, technical points, or batch requirements.',
  },
  {
    title: 'Order and QC',
    text: 'Track production, quality checks, documents, and shipment preparation.',
  },
  {
    title: 'Repeat',
    text: 'Keep usable records for future reorder, replacement, and supplier continuity.',
  },
];

const decisionPoints = [
  'Standard or custom-made',
  'Easy or hard to describe',
  'One-time search or repeat supply',
];

const workspaceItems = [
  'Requirement record',
  'Supplier options',
  'Quotation comparison',
  'Sample confirmation',
  'Production status',
  'QC update',
  'Shipment documents',
  'Repeat-order history',
];

export function Fabricators() {
  const { navigateTo } = useRouter();
  const userContext = useOptionalUser();
  const customerEntry = userContext?.user ? 'dashboard' : 'login';
  const goPortal = () => navigateTo(customerEntry);

  return (
    <div className="overflow-hidden bg-white text-gray-900" style={{ maxWidth: '100vw' }}>
      <section className="relative isolate overflow-hidden bg-gray-950 text-white">
        <img
          src={heroImage}
          alt="Fabricator textile workshop"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: 'brightness(0.62) saturate(0.92)', objectPosition: 'center 45%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/92 to-gray-950/58" />
        <div className="cosun-shell relative flex min-h-[540px] items-center py-12">
          <div className="max-w-4xl">
            <h1 className="text-4xl font-black leading-[1.02] tracking-normal sm:text-5xl md:text-[58px]">
              Tell us what you make.
              <span className="block">We find what you need.</span>
            </h1>
            <p className="mt-5 max-w-3xl text-base leading-7 text-gray-100 md:text-lg">
              From standard items to custom-made parts, COSUN helps fabricators and manufacturers find
              suitable suppliers, compare options, confirm samples, track orders, and keep repeatable supply records.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button onClick={goPortal} className="h-12 bg-red-600 px-6 text-base font-semibold hover:bg-red-700">
                Submit Requirement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={() => navigateTo('catalog')}
                variant="outline"
                className="h-12 border-white/50 bg-white/5 px-6 text-base font-semibold text-white hover:!border-white hover:!bg-white/12 hover:!text-white"
              >
                Browse Standard Items
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="cosun-shell">
          <div className="grid gap-8 lg:grid-cols-[0.74fr_1.26fr] lg:items-start">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-red-700">Who it is for</p>
              <h2 className="text-2xl font-black leading-tight text-gray-950 md:text-3xl">
                For any business that makes, processes, installs, repairs, or assembles.
              </h2>
              <p className="mt-3 text-base leading-7 text-gray-600">
                The module is not limited to one industry. If the requirement needs supplier search,
                material matching, custom production, replacement sourcing, or repeat supply, it belongs here.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {customerTypes.map((item) => (
                <div key={item} className="flex min-h-20 items-center gap-3 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
                  <Store className="h-5 w-5 shrink-0 text-red-700" />
                  <p className="text-sm font-black leading-6 text-gray-900">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="cosun-shell">
          <div className="mb-7 max-w-4xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-red-700">What COSUN can source</p>
            <h2 className="text-2xl font-black leading-tight text-gray-950 md:text-3xl">
              Standard items, custom parts, and supplier resources.
            </h2>
            <p className="mt-3 text-base leading-7 text-gray-600">
              Customers do not need to start from a fixed category. COSUN turns drawings, samples, specs,
              usage goals, or rough descriptions into supplier search criteria.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
              {supportAreas.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-700">
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

      <section className="border-y border-gray-200 bg-gray-50 py-12">
        <div className="cosun-shell">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start" style={{ alignItems: 'flex-start' }}>
            <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-red-50 text-red-700">
                  <FileSearch className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-red-700">What you can send</p>
                  <h2 className="text-xl font-black leading-tight text-gray-950">Start with the information you already have.</h2>
                </div>
              </div>
              <p className="mt-4 text-sm font-semibold leading-6 text-gray-600">
                You do not need a complete specification to start. COSUN helps turn incomplete requirements into a usable search brief.
              </p>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {requirementInputs.map((item) => (
                  <div key={item} className="flex items-center gap-2 border-b border-gray-100 py-2 text-sm font-semibold text-gray-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-red-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-gray-900 p-5 text-white shadow-sm" style={{ backgroundColor: '#111827' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-md bg-white/10 text-red-200">
                  <Wrench className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-red-200">How it works</p>
                  <h2 className="text-lg font-black leading-tight">Search, compare, confirm, track, repeat.</h2>
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                {workflowSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="rounded-md p-3 ring-1 ring-white/10"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-black text-white">
                        {index + 1}
                      </div>
                      <p className="text-sm font-black leading-5 text-white">{step.title}</p>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-gray-300">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 grid gap-5 lg:grid-cols-[0.78fr_1.22fr] lg:items-center">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-red-700">Quick decision</p>
              <h2 className="text-2xl font-black leading-tight text-gray-950">
                If it needs to be found, made, matched, replaced, or repeated, send it to COSUN.
              </h2>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {decisionPoints.map((item) => (
                <div key={item} className="rounded-md border border-gray-200 bg-gray-50 p-4">
                  <ShieldCheck className="mb-3 h-5 w-5 text-red-700" />
                  <p className="text-sm font-semibold leading-6 text-gray-800">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-12">
        <div className="cosun-shell">
          <div className="grid gap-8 lg:grid-cols-[0.84fr_1.16fr] lg:items-center">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-red-700">ERP and customer workspace</p>
              <h2 className="text-2xl font-black leading-tight text-gray-950 md:text-3xl">
                Track the whole sourcing process in your customer workspace.
              </h2>
              <p className="mt-4 text-base leading-7 text-gray-600">
                Fabrication sourcing is often too complex for scattered messages. COSUN keeps requirements,
                quotations, sample confirmations, production status, QC updates, shipment documents, and repeat
                records connected through our ERP and customer-side workspace.
              </p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {[
                  'Requirements stay organized',
                  'Quotes and supplier options are traceable',
                  'Sample and order progress can be followed',
                  'QC, shipment, and documents stay connected',
                ].map((item) => (
                  <div key={item} className="flex items-start gap-2 text-sm font-semibold leading-6 text-gray-700">
                    <CheckCircle2 className="mt-1 h-4 w-4 shrink-0 text-red-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between border-b border-gray-200 pb-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-red-700">Customer workspace</p>
                  <h3 className="text-lg font-black text-gray-950">Fabrication sourcing record</h3>
                </div>
                <div className="rounded-full bg-green-100 px-3 py-1 text-xs font-black text-green-700">Active</div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {workspaceItems.map((item, index) => (
                  <div key={item} className="rounded-md border border-gray-200 bg-white p-4">
                    <div className="flex items-center gap-2">
                      {index < 4 ? (
                        <ClipboardCheck className="h-4 w-4 text-red-700" />
                      ) : index < 6 ? (
                        <Wrench className="h-4 w-4 text-red-700" />
                      ) : (
                        <Truck className="h-4 w-4 text-red-700" />
                      )}
                      <p className="text-sm font-black text-gray-900">{item}</p>
                    </div>
                    <div className="mt-3 h-2 rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-red-600" style={{ width: `${Math.min(92, 34 + index * 8)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-red-700" />
              <p className="max-w-3xl text-base font-semibold leading-7 text-gray-800">
                Send us the product, part, drawing, sample, or idea you need to source. Whether it is standard,
                custom-made, hard to describe, or hard to find, COSUN can help search supplier resources and
                manage the supply process.
              </p>
            </div>
            <Button onClick={goPortal} className="h-10 bg-red-600 px-5 font-semibold text-white hover:bg-red-700">
              Submit Fabrication Requirement
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
