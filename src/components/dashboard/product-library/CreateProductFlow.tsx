import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../ui/dialog';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { toast } from 'sonner';
import { customerProductLibraryService } from '../../../lib/customerProductLibrary';
import type {
  CreateProductCompletion,
  CreateProductDraft,
  CreateProductFlowMode,
  CreateProductIntent,
  CreateProductKind,
} from './createProductFlowTypes';
import {
  buildCreateProductPayload,
  buildInitialCreateProductDraft,
  getCreateFlowModeLabel,
  getCreateFlowStepLabel,
  getCreateFlowTitle,
  getCreateProductKindLabel,
  getIntentLabel,
  isCreateProductDraftValid,
} from './createProductFlowHelpers';
import { ProductTypeSelector } from './ProductTypeSelector';
import { StandardProductForm } from './StandardProductForm';
import { OemProductForm } from './OemProductForm';
import { ProjectProductForm } from './ProjectProductForm';
import { ServiceProductForm } from './ServiceProductForm';

type CreateProductFlowProps = {
  open: boolean;
  mode: CreateProductFlowMode;
  onOpenChange: (open: boolean) => void;
  onComplete: (result: CreateProductCompletion) => void | Promise<void>;
  initialKind?: CreateProductKind | null;
};

export function CreateProductFlow({
  open,
  mode,
  onOpenChange,
  onComplete,
  initialKind = null,
}: CreateProductFlowProps) {
  const [selectedKind, setSelectedKind] = useState<CreateProductKind | null>(initialKind);
  const [draft, setDraft] = useState<CreateProductDraft | null>(
    initialKind ? buildInitialCreateProductDraft(initialKind) : null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [savedDraftRecordId, setSavedDraftRecordId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setSelectedKind(initialKind);
    setDraft(initialKind ? buildInitialCreateProductDraft(initialKind) : null);
    setSavedDraftRecordId(null);
    setIsSubmitting(false);
  }, [initialKind, open]);

  const canPrimarySubmit = useMemo(() => (draft ? isCreateProductDraftValid(draft) : false), [draft]);

  const closeFlow = () => onOpenChange(false);

  const handleKindSelect = (kind: CreateProductKind) => {
    setSelectedKind(kind);
  };

  const handleContinue = () => {
    if (!selectedKind) return;
    setDraft(buildInitialCreateProductDraft(selectedKind));
  };

  const handleBack = () => {
    setDraft(null);
  };

  const handleDraftChange = (patch: Partial<CreateProductDraft>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current));
  };

  const handleFilesChange = (files: CreateProductDraft['files']) => {
    setDraft((current) => (current ? { ...current, files } : current));
  };

  const saveRecord = async (intent: CreateProductIntent) => {
    if (!draft) return;
    if (intent !== 'save-draft' && !isCreateProductDraftValid(draft)) {
      toast.error('Please complete the required fields before saving.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = buildCreateProductPayload(draft, intent);
      const record = customerProductLibraryService.upsertFromManualItem(
        {
          ...payload,
          customerProductId: savedDraftRecordId,
        },
        {},
      );
      setSavedDraftRecordId(record.id);
      toast.success(getIntentLabel(intent));

      if (intent === 'save-draft') {
        return;
      }

      await Promise.resolve(onComplete({ intent, mode, record }));
      closeFlow();
    } catch (error) {
      console.error('[CreateProductFlow] save failed:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForm = (formDraft: CreateProductDraft) => {
    const commonProps = {
      draft: formDraft,
      mode,
      isSubmitting,
      onChange: handleDraftChange,
      onFilesChange: handleFilesChange,
      onBack: handleBack,
      onCancel: closeFlow,
      onSaveDraft: () => void saveRecord('save-draft'),
      onPrimaryAction: () => void saveRecord(mode === 'inquiry-return' ? 'save-and-use' : 'create-product'),
    };

    if (formDraft.kind === 'oem') return <OemProductForm {...commonProps} />;
    if (formDraft.kind === 'project') return <ProjectProductForm {...commonProps} />;
    if (formDraft.kind === 'qc_service' || formDraft.kind === 'general_service') {
      return <ServiceProductForm {...commonProps} />;
    }
    return <StandardProductForm {...commonProps} />;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1180px] p-0" hideClose={false}>
        <div className="grid h-[90vh] max-h-[90vh] grid-rows-[auto_1fr_auto] overflow-hidden bg-slate-50">
          <DialogHeader className="border-b border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f8fafc_45%,#eef2ff_100%)] px-6 py-5 lg:px-8">
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                      {getCreateFlowModeLabel(mode)}
                    </Badge>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                      {getCreateFlowStepLabel(Boolean(draft))}
                    </Badge>
                    {selectedKind ? (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {getCreateProductKindLabel(selectedKind)}
                      </Badge>
                    ) : null}
                  </div>
                  <DialogTitle className="text-[28px] font-semibold tracking-tight text-slate-950">
                    {getCreateFlowTitle(mode)}
                  </DialogTitle>
                  <div className="max-w-3xl text-sm leading-6 text-slate-600">
                    {mode === 'inquiry-return'
                      ? 'Create a formal product asset inside a structured workflow, then return to inquiry with the new product already prepared for selection.'
                      : 'Build a reusable customer product asset with package files, revision context, and inquiry-ready structure from a single workflow.'}
                  </div>
                </div>
                <div className="rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-sm text-slate-600 shadow-sm">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Outcome</div>
                  <div className="mt-2 max-w-[320px]">
                    {mode === 'inquiry-return'
                      ? 'Save the asset, then return it directly into the current inquiry selection.'
                      : 'Save the asset, then open it inside the My Products workspace.'}
                  </div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className={`rounded-2xl border px-4 py-3 ${!draft ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>
                  <div className={`text-[11px] font-medium uppercase tracking-[0.16em] ${!draft ? 'text-slate-200' : 'text-slate-500'}`}>Step 1</div>
                  <div className={`mt-2 text-sm font-semibold ${!draft ? 'text-white' : 'text-slate-900'}`}>Select Type</div>
                  <div className={`mt-1 text-sm ${!draft ? 'text-slate-200' : 'text-slate-600'}`}>Choose the asset structure first.</div>
                </div>
                <div className={`rounded-2xl border px-4 py-3 ${draft ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white text-slate-600'}`}>
                  <div className={`text-[11px] font-medium uppercase tracking-[0.16em] ${draft ? 'text-slate-200' : 'text-slate-500'}`}>Step 2</div>
                  <div className={`mt-2 text-sm font-semibold ${draft ? 'text-white' : 'text-slate-900'}`}>Create Product</div>
                  <div className={`mt-1 text-sm ${draft ? 'text-slate-200' : 'text-slate-600'}`}>Fill the setup form in a compact editing workspace.</div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-600">
                  <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">Step 3</div>
                  <div className="mt-2 text-sm font-semibold text-slate-900">Asset Workspace</div>
                  <div className="mt-1 text-sm text-slate-600">Finish inside the full product workspace after save.</div>
                </div>
              </div>
            </div>
          </DialogHeader>
          <div className="min-h-0 overflow-y-auto px-6 py-5 lg:px-8">
            {draft
              ? renderForm(draft)
              : (
                <ProductTypeSelector
                  mode={mode}
                  selectedKind={selectedKind}
                  onSelect={handleKindSelect}
                  onContinue={handleContinue}
                  onCancel={closeFlow}
                />
              )}
          </div>
          <div className="border-t border-slate-200 bg-white px-6 py-4 lg:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="text-sm text-slate-600">
                {draft
                  ? canPrimarySubmit
                    ? 'The required fields are complete. You can save a draft or continue with the primary action.'
                    : 'Complete the required fields to continue. You can still save a draft at any time.'
                  : 'Select one asset type to unlock the setup workspace.'}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                {draft ? (
                  <>
                    <Button variant="outline" onClick={handleBack} disabled={isSubmitting}>
                      Back to Type
                    </Button>
                    <Button variant="ghost" onClick={closeFlow} disabled={isSubmitting}>
                      {mode === 'inquiry-return' ? 'Return to Inquiry' : 'Cancel'}
                    </Button>
                    <Button variant="outline" onClick={() => void saveRecord('save-draft')} disabled={isSubmitting}>
                      Save Draft
                    </Button>
                    <Button
                      onClick={() => void saveRecord(mode === 'inquiry-return' ? 'save-and-use' : 'create-product')}
                      disabled={isSubmitting || !canPrimarySubmit}
                    >
                      {mode === 'inquiry-return' ? 'Save and Use in Inquiry' : 'Create Product'}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={closeFlow}>
                      {mode === 'inquiry-return' ? 'Back to Inquiry Selection' : 'Cancel'}
                    </Button>
                    <Button onClick={handleContinue} disabled={!selectedKind}>
                      Continue to Product Setup
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
