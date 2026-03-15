import type { ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { createOemUploadRecord, type OemUploadedFile } from '../../../types/oem';
import type { CreateProductFormProps } from './createProductFlowTypes';

const fileLabel = (file: OemUploadedFile) => file.fileName || 'Unnamed file';

export function OemProductForm({
  draft,
  onChange,
  onFilesChange,
}: CreateProductFormProps) {
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
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">OEM Product Identity</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Product Name</div>
              <Input value={draft.productName} onChange={(e) => onChange({ productName: e.target.value })} placeholder="OEM product name" />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Your Model#</div>
              <Input value={draft.customerModelNo} onChange={(e) => onChange({ customerModelNo: e.target.value })} placeholder="Customer model number" />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Unit</div>
              <Input value={draft.unit} onChange={(e) => onChange({ unit: e.target.value })} placeholder="pcs" />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Target Price</div>
              <Input value={draft.targetPrice} onChange={(e) => onChange({ targetPrice: e.target.value })} placeholder="0.00" />
            </div>
            <div className="md:col-span-2">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">OEM Summary</div>
              <Textarea value={draft.description} onChange={(e) => onChange({ description: e.target.value })} rows={6} placeholder="Summarize the OEM product, customer requirements, and what makes it custom." />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Technical Package</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Package Summary</div>
              <Textarea value={draft.packageSummary} onChange={(e) => onChange({ packageSummary: e.target.value })} rows={5} placeholder="Summarize drawings, specs, BOM, packaging, and other technical assets." />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Overall Requirement Note</div>
              <Textarea value={draft.packageNote} onChange={(e) => onChange({ packageNote: e.target.value })} rows={5} placeholder="Add the package note that should travel into inquiry." />
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Setup Notes</div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>Use this for customer-owned OEM and custom products that depend on drawings, specs, and file-driven execution.</div>
            <div>The package created here replaces ad hoc OEM entry inside inquiry.</div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Technical Files</div>
              <div className="mt-2 text-sm text-slate-600">Upload drawings, specifications, images, BOM files, packaging references, and other OEM materials.</div>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              Upload Files
              <input type="file" multiple className="hidden" onChange={handleFiles} />
            </label>
          </div>
          <div className="mt-4 space-y-2">
            {draft.files.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No technical files uploaded yet.
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
