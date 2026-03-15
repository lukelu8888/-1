import type { ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { createOemUploadRecord, type OemUploadedFile } from '../../../types/oem';
import type { CreateProductFormProps } from './createProductFlowTypes';

const fileLabel = (file: OemUploadedFile) => file.fileName || 'Unnamed file';

export function ServiceProductForm({
  draft,
  onChange,
  onFilesChange,
}: CreateProductFormProps) {
  const isQc = draft.kind === 'qc_service';

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []).map(createOemUploadRecord);
    if (selectedFiles.length > 0) {
      onFilesChange([...draft.files, ...selectedFiles]);
    }
    event.target.value = '';
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Service Definition</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Service Name</div>
              <Input value={draft.productName} onChange={(e) => onChange({ productName: e.target.value })} placeholder="Service name" />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Unit</div>
              <Input value={draft.unit} onChange={(e) => onChange({ unit: e.target.value })} placeholder={isQc ? 'lot' : 'service'} />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                {isQc ? 'QC Type' : 'Service Category'}
              </div>
              <Input
                value={isQc ? draft.inspectionType : draft.serviceCategory}
                onChange={(e) => onChange(isQc ? { inspectionType: e.target.value } : { serviceCategory: e.target.value })}
                placeholder={isQc ? 'Pre-shipment / Inline / Factory Audit' : 'Consulting / Logistics / Support'}
              />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                {isQc ? 'Inspection Standard' : 'Delivery Method'}
              </div>
              <Input
                value={isQc ? draft.inspectionStandard : draft.deliveryMethod}
                onChange={(e) => onChange(isQc ? { inspectionStandard: e.target.value } : { deliveryMethod: e.target.value })}
                placeholder={isQc ? 'AQL / custom standard' : 'Remote / onsite / document based'}
              />
            </div>
            <div className="md:col-span-2">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">
                {isQc ? 'Inspection Scope' : 'Service Scope'}
              </div>
              <Textarea
                value={draft.serviceScope}
                onChange={(e) => onChange({ serviceScope: e.target.value, description: e.target.value })}
                rows={5}
                placeholder={isQc ? 'Describe what the QC service covers.' : 'Describe what the service covers and when to use it.'}
              />
            </div>
            <div className="md:col-span-2">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Deliverables</div>
              <Textarea
                value={draft.serviceDeliverables}
                onChange={(e) => onChange({ serviceDeliverables: e.target.value, packageSummary: e.target.value })}
                rows={5}
                placeholder={isQc ? 'Inspection report, photo report, defect summary...' : 'Report, checklist, summary, support note...'}
              />
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Setup Notes</div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>
              {isQc
                ? 'Use QC Service for inspection standards, sampling logic, and report-driven service assets.'
                : 'Use General Service for consulting, support, execution, or other non-physical service assets.'}
            </div>
            <div>The service package becomes the reusable context for inquiry instead of rewriting the same scope each time.</div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{isQc ? 'QC Package' : 'Service Package'}</div>
          <div className="mt-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Package Note</div>
            <Textarea
              value={draft.packageNote}
              onChange={(e) => onChange({ packageNote: e.target.value })}
              rows={5}
              placeholder={isQc ? 'Explain what report/checklist package should travel with inquiry.' : 'Explain what service package should travel with inquiry.'}
            />
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-sm text-slate-600">Upload report templates, SOPs, checklists, briefs, or service reference files.</div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              Upload Files
              <input type="file" multiple className="hidden" onChange={handleFiles} />
            </label>
          </div>
          <div className="mt-4 space-y-2">
            {draft.files.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No package files uploaded yet.
              </div>
            ) : (
              draft.files.map((file) => (
                <div key={file.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {fileLabel(file)}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
