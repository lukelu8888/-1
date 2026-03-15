import { Layers, Package, ShieldCheck, Wrench } from 'lucide-react';
import type { CreateProductFlowMode, CreateProductKind } from './createProductFlowTypes';
import { CREATE_PRODUCT_KIND_OPTIONS, getCreateFlowModeLabel, getCreateProductKindTraits } from './createProductFlowHelpers';

const iconMap = {
  standard: Package,
  oem: Wrench,
  project: Layers,
  qc_service: ShieldCheck,
  general_service: ShieldCheck,
} as const;

type ProductTypeSelectorProps = {
  mode: CreateProductFlowMode;
  selectedKind: CreateProductKind | null;
  onSelect: (kind: CreateProductKind) => void;
  onContinue: () => void;
  onCancel: () => void;
};

export function ProductTypeSelector({
  mode,
  selectedKind,
  onSelect,
}: ProductTypeSelectorProps) {
  const productOptions = CREATE_PRODUCT_KIND_OPTIONS.filter((option) => option.group === 'product');
  const serviceOptions = CREATE_PRODUCT_KIND_OPTIONS.filter((option) => option.group === 'service');

  return (
    <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-5">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Step 1 · Select Product Type</div>
          <div className="text-[28px] font-semibold tracking-tight text-slate-950">Choose the asset you want to create</div>
          <div className="max-w-2xl text-sm leading-6 text-slate-600">
            Pick the product type first. The next step turns into a formal product setup workspace with package files, revision control, and inquiry reuse readiness.
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Products</div>
          <div className="grid gap-3 md:grid-cols-3">
            {productOptions.map((option) => {
              const Icon = iconMap[option.kind];
              const active = selectedKind === option.kind;
              const traits = getCreateProductKindTraits(option.kind);
              return (
                <button
                  key={option.kind}
                  type="button"
                  onClick={() => onSelect(option.kind)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? 'border-[#111827] bg-[#111827] text-white shadow-lg shadow-slate-900/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${active ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${active ? 'bg-white/10 text-slate-100' : 'bg-slate-100 text-slate-600'}`}>
                      {active ? 'Selected' : 'Select'}
                    </span>
                  </div>
                  <div className={`mt-5 text-base font-semibold ${active ? 'text-white' : 'text-slate-900'}`}>{option.label}</div>
                  <div className={`mt-2 text-sm leading-6 ${active ? 'text-slate-200' : 'text-slate-600'}`}>{option.helper}</div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {traits.map((trait) => (
                      <span
                        key={`${option.kind}-${trait}`}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          active ? 'bg-white/10 text-slate-100' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Services</div>
          <div className="grid gap-3 md:grid-cols-2">
            {serviceOptions.map((option) => {
              const Icon = iconMap[option.kind];
              const active = selectedKind === option.kind;
              const traits = getCreateProductKindTraits(option.kind);
              return (
                <button
                  key={option.kind}
                  type="button"
                  onClick={() => onSelect(option.kind)}
                  className={`rounded-2xl border p-4 text-left transition ${
                    active
                      ? 'border-[#111827] bg-[#111827] text-white shadow-lg shadow-slate-900/10'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${active ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-700'}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${active ? 'bg-white/10 text-slate-100' : 'bg-slate-100 text-slate-600'}`}>
                      {active ? 'Selected' : 'Select'}
                    </span>
                  </div>
                  <div className={`mt-5 text-base font-semibold ${active ? 'text-white' : 'text-slate-900'}`}>{option.label}</div>
                  <div className={`mt-2 text-sm leading-6 ${active ? 'text-slate-200' : 'text-slate-600'}`}>{option.helper}</div>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {traits.map((trait) => (
                      <span
                        key={`${option.kind}-${trait}`}
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${
                          active ? 'bg-white/10 text-slate-100' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {trait}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Flow Summary</div>
          <div className="mt-3 text-lg font-semibold tracking-tight text-slate-950">{getCreateFlowModeLabel(mode)}</div>
          <div className="mt-2 text-sm leading-6 text-slate-600">
            {mode === 'inquiry-return'
              ? 'Create a reusable asset for the current inquiry, then send it back as a formal source product.'
              : 'Create a reusable asset for My Products, then continue inside the asset workspace after save.'}
          </div>
          <div className="mt-5 border-t border-slate-200 pt-4">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Selected Type</div>
            {selectedKind ? (
              <div className="mt-3 space-y-3">
                <div className="text-base font-semibold text-slate-950">
                  {CREATE_PRODUCT_KIND_OPTIONS.find((option) => option.kind === selectedKind)?.label}
                </div>
                <div className="text-sm leading-6 text-slate-600">
                  {CREATE_PRODUCT_KIND_OPTIONS.find((option) => option.kind === selectedKind)?.helper}
                </div>
                <div className="flex flex-wrap gap-2">
                  {getCreateProductKindTraits(selectedKind).map((trait) => (
                    <span key={`summary-${selectedKind}-${trait}`} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
                Select one type to unlock product setup.
              </div>
            )}
          </div>
          <div className="mt-5 border-t border-slate-200 pt-4 text-sm text-slate-600">
            <div>1. Select the right asset type.</div>
            <div className="mt-2">2. Complete the setup form.</div>
            <div className="mt-2">3. Save into the My Products asset workspace.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
