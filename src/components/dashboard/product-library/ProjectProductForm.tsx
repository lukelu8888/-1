import type { ChangeEvent } from 'react';
import { Upload } from 'lucide-react';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { createOemUploadRecord, type OemUploadedFile } from '../../../types/oem';
import type { CreateProductFormProps } from './createProductFlowTypes';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

const fileLabel = (file: OemUploadedFile) => file.fileName || 'Unnamed file';

export function ProjectProductForm({
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
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Project Root</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Project Code</div>
              <Input value={draft.projectCode} onChange={(e) => onChange({ projectCode: e.target.value })} placeholder="PRJ-001" />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Project Name</div>
              <Input value={draft.projectName} onChange={(e) => onChange({ projectName: e.target.value })} placeholder="Project name" />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Product Name</div>
              <Input value={draft.productName} onChange={(e) => onChange({ productName: e.target.value })} placeholder="Project product name" />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Your Model#</div>
              <Input value={draft.customerModelNo} onChange={(e) => onChange({ customerModelNo: e.target.value })} placeholder="Customer model number" />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current Revision</div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Revision Code</div>
              <Input value={draft.revisionCode} onChange={(e) => onChange({ revisionCode: e.target.value.toUpperCase() })} placeholder="A" />
            </div>
            <div>
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Revision Status</div>
              <Select
                value={draft.revisionStatus}
                onValueChange={(value) => onChange({ revisionStatus: value as CreateProductFormProps['draft']['revisionStatus'] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select revision status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="working">Working</SelectItem>
                  <SelectItem value="quoted">Quoted</SelectItem>
                  <SelectItem value="superseded">Superseded</SelectItem>
                  <SelectItem value="final">Final</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Revision Summary</div>
              <Textarea value={draft.revisionSummary} onChange={(e) => onChange({ revisionSummary: e.target.value })} rows={5} placeholder="Summarize the current revision and what this project product should follow." />
            </div>
            <div className="md:col-span-2">
              <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Revision Note</div>
              <Textarea value={draft.revisionNote} onChange={(e) => onChange({ revisionNote: e.target.value, packageNote: e.target.value })} rows={5} placeholder="Describe what changed in this revision." />
            </div>
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_100%)] p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Revision Notes</div>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div>The current revision is created now as the working baseline.</div>
            <div>Final Revision stays a detail-workspace decision after save.</div>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Current Revision Package</div>
          <div className="mt-4">
            <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Package Summary</div>
            <Textarea value={draft.packageSummary} onChange={(e) => onChange({ packageSummary: e.target.value })} rows={5} placeholder="Summarize the files and technical package for the current revision." />
          </div>
          <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4 text-sm leading-6 text-blue-900">
            Current Revision is created now. Final Revision can be locked later in My Products detail. Inquiry will use Final Revision by default when one exists; otherwise it uses Current Revision.
          </div>
          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="text-sm text-slate-600">Upload revision files, drawings, specs, or execution references.</div>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              <Upload className="h-4 w-4" />
              Upload Files
              <input type="file" multiple className="hidden" onChange={handleFiles} />
            </label>
          </div>
          <div className="mt-4 space-y-2">
            {draft.files.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                No revision files uploaded yet.
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
