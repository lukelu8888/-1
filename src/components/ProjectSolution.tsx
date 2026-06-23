import {
  ArrowRight,
  Building2,
  CheckCircle2,
  ClipboardCheck,
  Factory,
  FileSearch,
  Gauge,
  Network,
  PackageCheck,
} from 'lucide-react';
import { useOptionalUser } from '../contexts/UserContext';
import { useRouter } from '../contexts/RouterContext';
import { Button } from './ui/button';
import processDiagram from '../assets/d05a768ad03cf9724be73608024eaea836fca1a8.png';

const matchingTargets = [
  {
    title: 'Supplier Matching',
    text: 'For materials, components, equipment, spare parts, and supporting products.',
    icon: Network,
  },
  {
    title: 'Manufacturer Matching',
    text: 'For custom production, processing lines, modular systems, OEM items, and factory equipment.',
    icon: Factory,
  },
  {
    title: 'PLC / Automation Partners',
    text: 'For control systems, electrical panels, automation upgrades, and technical integration needs.',
    icon: Gauge,
  },
  {
    title: 'Turnkey Contractors',
    text: 'For complete project packages that need design support, manufacturing, installation, or commissioning.',
    icon: Building2,
  },
];

const requirementInputs = [
  'Project brief',
  'Drawings or layout',
  'Capacity target',
  'Equipment list',
  'Technical requirements',
  'Photos or reference links',
  'Budget range',
  'Target timeline',
];

const workflowSteps = [
  {
    title: 'Submit',
    text: 'Send brief, files, drawings, target capacity, budget, and timeline.',
  },
  {
    title: 'Match',
    text: 'COSUN compares suitable suppliers, factories, PLC teams, and contractors.',
  },
  {
    title: 'Coordinate',
    text: 'Track proposals, samples, technical confirmation, QC, shipment, and records.',
  },
];

const openProjectScopes = [
  'Real estate and construction',
  'Turnkey production lines',
  'CBD extraction plants',
  'Food factory water filtration modules',
  'Containerized processing systems',
  'PLC and automation providers',
];

const partnerBrands = [
  { name: 'SIEMENS', style: 'text-cyan-700 text-[15px] tracking-[0.08em]' },
  { name: 'Schneider Electric', style: 'text-green-600 text-[11px] leading-[0.95]' },
  { name: 'ABB', style: 'text-red-600 text-[18px] tracking-[0.02em]' },
  { name: 'Rockwell', style: 'text-gray-900 text-[13px]' },
  { name: 'Honeywell', style: 'text-red-700 text-[13px]' },
  { name: 'Danfoss', style: 'text-red-600 text-[13px]' },
  { name: 'VEOLIA', style: 'text-blue-700 text-[14px] tracking-[0.06em]' },
  { name: 'GEA', style: 'text-gray-900 text-[17px]' },
  { name: 'Bühler', style: 'text-blue-900 text-[14px]' },
  { name: 'CEMEX', style: 'text-blue-700 text-[13px] italic' },
  { name: 'Saint-Gobain', style: 'text-gray-900 text-[11px]' },
  { name: 'BOSCH', style: 'text-red-600 text-[14px]' },
];

export function ProjectSolution() {
  const { navigateTo } = useRouter();
  const userContext = useOptionalUser();
  const customerEntry = userContext?.user ? 'dashboard' : 'login';
  const goPortal = () => navigateTo(customerEntry);

  return (
    <div className="overflow-hidden bg-white text-gray-900" style={{ maxWidth: '100vw' }}>
      <section
        className="relative isolate overflow-hidden bg-gray-950 text-white"
        style={{
          background:
            'linear-gradient(135deg, #020617 0%, #0f172a 54%, #155e75 100%)',
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,6,23,0.96)_0%,rgba(2,6,23,0.8)_48%,rgba(2,6,23,0.22)_100%)]" />
        <div className="cosun-shell relative grid min-h-[460px] gap-10 py-10 lg:grid-cols-2 lg:items-start lg:pt-16">
          <div className="relative z-20 max-w-3xl">
            <h1 className="text-4xl font-black leading-[0.98] tracking-normal sm:text-5xl md:text-[60px]">
              Tell us the project.
              <span className="block">We find the right</span>
              <span className="block">execution partners.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-gray-200/90 md:text-lg md:leading-8">
              From project brief to execution partner matching, COSUN helps connect your requirement with
              suitable suppliers, manufacturers, PLC providers, or turnkey contractors.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button
                onClick={goPortal}
                className="h-12 bg-cyan-600 px-6 text-base font-semibold leading-none hover:bg-cyan-700"
              >
                Submit Project Requirement
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                onClick={goPortal}
                variant="outline"
                className="h-12 border-white/50 bg-white/5 px-6 text-base font-semibold leading-none text-white hover:!border-white hover:!bg-white/12 hover:!text-white"
              >
                Track Project Progress
              </Button>
            </div>
          </div>

          <div className="relative z-10 hidden min-w-0 lg:flex lg:justify-end" style={{ perspective: '1200px' }}>
            <div
              className="pointer-events-none absolute inset-y-[-18px] left-[-64px] z-20 hidden w-32 bg-gradient-to-r from-gray-950 via-gray-950/80 to-transparent blur-sm lg:block"
              aria-hidden="true"
            />
            <div
              className="max-w-full overflow-hidden rounded-md bg-white shadow-2xl ring-1 ring-white/25"
              style={{
                width: '430px',
                aspectRatio: '1.62 / 1',
                transform: 'rotateY(-9deg) rotateX(2deg)',
                transformOrigin: 'center right',
              }}
            >
              <img
                src={processDiagram}
                alt="Industrial project drawing"
                className="h-full w-full object-cover"
                style={{ objectPosition: '53% 34%' }}
              />
            </div>
          </div>

        </div>
      </section>

      <section className="bg-gray-50 py-12">
        <div className="cosun-shell">
          <div className="mb-10 rounded-md border border-cyan-100 bg-white p-5 shadow-sm">
            <div className="grid gap-5 lg:grid-cols-[0.58fr_1.42fr] lg:items-center">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-cyan-700">Open project scope</p>
                <p className="mt-2 text-lg font-black leading-tight text-gray-950">
                  Start from the requirement, not a fixed category.
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {openProjectScopes.map((item) => (
                  <div key={item} className="flex min-h-10 items-center gap-2 rounded-sm bg-gray-50 px-3 text-sm font-semibold text-gray-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-cyan-700">What COSUN does</p>
              <h2 className="text-2xl font-black leading-tight text-gray-950 md:text-3xl">
                We turn specific project needs into partner options.
              </h2>
              <p className="mt-3 text-base leading-7 text-gray-600">
                Instead of limiting projects to a fixed category, COSUN focuses on finding the right supply,
                manufacturing, engineering, or automation resources for the requirement in front of us.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {matchingTargets.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.title} className="rounded-md border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-cyan-200 hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
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
        </div>
      </section>

      <section className="border-y border-gray-200 bg-white py-12">
        <div className="cosun-shell">
          <div className="mb-10 rounded-md border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2 border-b border-gray-100 pb-4 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-cyan-700">Partner ecosystem</p>
                <h2 className="mt-1 text-xl font-black leading-tight text-gray-950">
                  Brand and specialist resources we can help coordinate.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-6 text-gray-500">
                Depending on the project, COSUN helps connect suitable equipment, automation, materials, water treatment,
                production-line, and engineering partners.
              </p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
              {partnerBrands.map((brand) => (
                <div
                  key={brand.name}
                  className="flex h-14 min-w-0 items-center justify-center rounded-sm border border-gray-100 bg-gray-50 px-3 text-center font-black uppercase leading-none"
                >
                  <span className={`truncate ${brand.style}`}>{brand.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-md border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                  <FileSearch className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-cyan-700">What you can send</p>
                  <h2 className="text-xl font-black leading-tight text-gray-950">Start with any concrete requirement.</h2>
                </div>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                {requirementInputs.map((item) => (
                  <div key={item} className="flex items-center gap-2 border-b border-gray-100 py-2 text-sm font-semibold text-gray-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-cyan-700" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-md border border-gray-900 p-6 text-white shadow-sm" style={{ backgroundColor: '#020617' }}>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-md bg-white/10 text-cyan-200">
                  <ClipboardCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.08em] text-cyan-200">How it moves forward</p>
                  <h2 className="text-xl font-black leading-tight">Submit, match, and coordinate.</h2>
                </div>
              </div>
              <div className="mt-6 space-y-3">
                {workflowSteps.map((step, index) => (
                  <div
                    key={step.title}
                    className="grid grid-cols-[44px_1fr] gap-3 rounded-md p-4 ring-1 ring-white/10"
                    style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-cyan-500 text-sm font-black text-white">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-black text-white">{step.title}</p>
                      <p className="mt-1 text-sm leading-6 text-gray-300">{step.text}</p>
                    </div>
                  </div>
                ))}
              </div>
              <Button onClick={goPortal} className="mt-6 h-11 bg-cyan-600 px-5 font-semibold text-white hover:bg-cyan-700">
                Open Customer Workspace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <PackageCheck className="mt-0.5 h-5 w-5 shrink-0 text-cyan-700" />
              <p className="max-w-3xl text-base font-semibold leading-7 text-gray-800">
                Project Solution is not a fixed product category. It is COSUN's ability to find and coordinate the
                right execution resources for complex project requirements.
              </p>
            </div>
            <Button onClick={goPortal} className="h-10 bg-cyan-600 px-5 font-semibold text-white hover:bg-cyan-700">
              Submit Requirement
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
