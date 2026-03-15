import type React from 'react';
import { Upload, FileText, Trash2, CircleHelp, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip';
import type { InquiryOemData, OemMoldLifetime } from '../../types/oem';
import {
  OEM_MOLD_LIFETIME_OPTIONS,
  createEmptyOemData,
  createOemUploadRecord,
  normalizeOemData,
} from '../../types/oem';

interface OemModuleSectionProps {
  value: InquiryOemData;
  onChange: (nextValue: InquiryOemData) => void;
  hideToggle?: boolean;
  submitFormId?: string;
  submitLabel?: string;
  submitting?: boolean;
}

const formatFileSize = (value: number) => {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const FieldHelp = ({ text }: { text: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <button
        type="button"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-slate-400 text-slate-500 hover:border-slate-600 hover:text-slate-700"
      >
        <CircleHelp className="h-3 w-3" />
      </button>
    </TooltipTrigger>
    <TooltipContent side="top" className="max-w-[260px] text-xs leading-5">
      {text}
    </TooltipContent>
  </Tooltip>
);

export function OemModuleSection({
  value,
  onChange,
  hideToggle = false,
  submitFormId,
  submitLabel = 'Add OEM Item',
  submitting = false,
}: OemModuleSectionProps) {
  const oem = normalizeOemData(value);

  const updateOem = (patch: Partial<InquiryOemData>) => {
    const nextValue = normalizeOemData({
      ...oem,
      ...patch,
    });
    onChange(nextValue);
  };

  const removeFile = (fileId: string) => {
    updateOem({
      files: oem.files.filter((file) => file.id !== fileId),
    });
  };

  const handleFileSelection = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []).map(createOemUploadRecord);
    if (selectedFiles.length === 0) return;
    updateOem({
      files: [...oem.files, ...selectedFiles],
    });
    event.target.value = '';
  };

  const updateTooling = (patch: Partial<InquiryOemData['tooling']>) => {
    updateOem({
      tooling: {
        ...oem.tooling,
        ...patch,
      },
    });
  };

  return (
    <div className="rounded-sm border-2 border-gray-200 bg-white">
      <div className="border-b-2 border-gray-200 px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-gray-900 uppercase tracking-wide" style={{ fontSize: '14px', fontWeight: 600 }}>
              <h3>OEM DOCUMENTS FOR THIS ITEM</h3>
              <FieldHelp text="Use this section only for items that need customer drawings, branding files, technical documents, or customer part references." />
            </div>
          </div>
          {!hideToggle ? (
            <div className="inline-flex rounded-sm border border-gray-200 bg-gray-50 p-1">
              <Button
                type="button"
                variant={oem.enabled ? 'default' : 'ghost'}
                className={oem.enabled ? 'bg-[#F96302] text-white hover:bg-[#E05502]' : 'text-gray-600'}
                onClick={() => updateOem({ enabled: true })}
              >
                Yes
              </Button>
              <Button
                type="button"
                variant={!oem.enabled ? 'default' : 'ghost'}
                className={!oem.enabled ? 'bg-slate-700 text-white hover:bg-slate-800' : 'text-gray-600'}
                onClick={() => onChange(createEmptyOemData())}
              >
                No
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {!oem.enabled && !hideToggle ? (
        <div className="px-6 py-5 text-[13px] text-gray-600">
          Add OEM files only when this item needs custom drawings, customer specifications, or part-number references.
        </div>
      ) : (
        <div className="space-y-6 p-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                  <Label style={{ fontSize: '13px', fontWeight: 600 }}>
                    Technical document <span className="text-red-500">*</span>
                  </Label>
                  <FieldHelp text="Upload drawings, OEM specifications, BOM files, labels, packaging references, or related technical documents for this item." />
                </div>
              </div>
              <Label
                htmlFor="oem-file-upload"
                className="inline-flex h-9 cursor-pointer items-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Label>
              <Input
                id="oem-file-upload"
                type="file"
                multiple
                className="hidden"
                onChange={handleFileSelection}
              />
            </div>

            {oem.files.length === 0 ? (
              <div className="rounded-sm border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-[13px] text-gray-500">
                No OEM files added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {oem.files.map((file, index) => (
                  <div key={file.id} className="rounded-sm border border-gray-200 bg-gray-50 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-gray-900">
                          <FileText className="h-4 w-4 flex-shrink-0 text-[#0D3B66]" />
                          <span className="truncate text-[13px] font-semibold">{file.fileName}</span>
                        </div>
                        <p className="mt-1 text-[12px] text-gray-500">
                          File {index + 1} · {formatFileSize(file.fileSize)} · {file.fileType}
                        </p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => removeFile(file.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Label htmlFor="oem-overall-note" style={{ fontSize: '13px', fontWeight: 600 }}>
                Specifications / Description <span className="text-red-500">*</span>
              </Label>
              <FieldHelp text="Use this single field to summarize the OEM specifications, technical requirements, packaging or branding needs, and other important notes for this item." />
            </div>
            <Textarea
              id="oem-overall-note"
              className="mt-2"
              rows={5}
              placeholder=""
              value={oem.overallRequirementNote}
              onChange={(event) => updateOem({ overallRequirementNote: event.target.value })}
            />
          </div>

          <div className="rounded-sm border border-gray-200 bg-white">
            <div className="border-b border-gray-200 px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-[13px] font-semibold text-gray-900">Mold / Quantity Plan</h4>
                    <FieldHelp text="Select Yes only when tooling or mold cost is part of this OEM item. The quantity and mold lifetime fields become required." />
                  </div>
                </div>
                <div className="inline-flex rounded-sm border border-gray-200 bg-gray-50 p-1">
                  <Button
                    type="button"
                    variant={oem.tooling.toolingCostInvolved ? 'default' : 'ghost'}
                    className={oem.tooling.toolingCostInvolved ? 'bg-[#F96302] text-white hover:bg-[#E05502]' : 'text-gray-600'}
                    onClick={() => updateTooling({ toolingCostInvolved: true })}
                  >
                    Yes
                  </Button>
                  <Button
                    type="button"
                    variant={!oem.tooling.toolingCostInvolved ? 'default' : 'ghost'}
                    className={!oem.tooling.toolingCostInvolved ? 'bg-slate-700 text-white hover:bg-slate-800' : 'text-gray-600'}
                    onClick={() =>
                      updateTooling({
                        toolingCostInvolved: false,
                        firstOrderQuantity: '',
                        annualQuantity: '',
                        quantityWithinThreeYears: '',
                        moldLifetime: '',
                      })
                    }
                  >
                    No
                  </Button>
                </div>
              </div>
            </div>

            {oem.tooling.toolingCostInvolved && (
              <div className="grid gap-4 p-4 md:grid-cols-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="oem-first-order-qty" style={{ fontSize: '13px', fontWeight: 600 }}>
                      1st order quantity <span className="text-red-500">*</span>
                    </Label>
                    <FieldHelp text="Planned quantity for the first production order of this OEM item." />
                  </div>
                  <Input
                    id="oem-first-order-qty"
                    className="mt-2"
                    placeholder=""
                    value={oem.tooling.firstOrderQuantity}
                    onChange={(event) => updateTooling({ firstOrderQuantity: event.target.value })}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="oem-annual-qty" style={{ fontSize: '13px', fontWeight: 600 }}>
                      Annual quantity <span className="text-red-500">*</span>
                    </Label>
                    <FieldHelp text="Estimated annual demand for this OEM item." />
                  </div>
                  <Input
                    id="oem-annual-qty"
                    className="mt-2"
                    placeholder=""
                    value={oem.tooling.annualQuantity}
                    onChange={(event) => updateTooling({ annualQuantity: event.target.value })}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="oem-three-year-qty" style={{ fontSize: '13px', fontWeight: 600 }}>
                      3-year Quantity <span className="text-red-500">*</span>
                    </Label>
                    <FieldHelp text="Expected cumulative quantity within three years for this OEM item." />
                  </div>
                  <Input
                    id="oem-three-year-qty"
                    className="mt-2"
                    placeholder=""
                    value={oem.tooling.quantityWithinThreeYears}
                    onChange={(event) => updateTooling({ quantityWithinThreeYears: event.target.value })}
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Label style={{ fontSize: '13px', fontWeight: 600 }}>
                      Mold lifetime <span className="text-red-500">*</span>
                    </Label>
                    <FieldHelp text="Choose the expected mold lifetime or cycle target for this OEM item." />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {OEM_MOLD_LIFETIME_OPTIONS.map((option) => (
                      <Button
                        key={option.value}
                        type="button"
                        variant={oem.tooling.moldLifetime === option.value ? 'default' : 'outline'}
                        className={oem.tooling.moldLifetime === option.value ? 'bg-[#0D3B66] text-[13px] text-white hover:bg-[#0A2F52]' : 'text-[13px]'}
                        onClick={() => updateTooling({ moldLifetime: option.value as OemMoldLifetime })}
                      >
                        {option.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {submitFormId ? (
            <Button
              type="submit"
              form={submitFormId}
              disabled={submitting}
              className="h-11 w-full justify-center gap-2 bg-[#F96302] text-white hover:bg-[#E05502]"
            >
              <Plus className="h-4 w-4" />
              {submitting ? 'Generating Model#...' : submitLabel}
            </Button>
          ) : null}

        </div>
      )}
    </div>
  );
}
