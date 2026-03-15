import { useState } from 'react';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { normalizeOemData } from '../../types/oem';
import { OemFactoryFacingPreview } from './OemFactoryFacingPreview';
import { adaptInquiryToFactoryFacingOemDocument } from '../../utils/documentDataAdapters';
import { A4DocumentContainer } from '../documents/A4PageContainer';

interface OemInternalProcessingPanelProps {
  inquiry: any;
  onSave: (nextOem: any) => Promise<void>;
  onGenerateFactoryVersion?: (payload: { nextOem: any; factoryVersion: any }) => Promise<void>;
}

const FIELD_OPTIONS = {
  anonymizationStatus: [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ],
  replacementVersionStatus: [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
  ],
  factoryForwardingStatus: [
    { value: 'internal_hold', label: 'Internal Hold' },
    { value: 'ready_for_internal_review', label: 'Ready for Internal Review' },
    { value: 'released_to_factory', label: 'Released to Factory' },
  ],
} as const;

const hasResolvedInternalCode = (value?: string) => {
  const normalized = String(value || '').trim();
  return Boolean(normalized) && !normalized.includes('PENDING');
};

const getFactoryReleaseBlockers = (draft: any, generatedVersion: any) => {
  const blockers: string[] = [];

  if (!generatedVersion?.payload) {
    blockers.push('Generate and save the factory-facing OEM version first.');
  }

  if (draft.internalProcessing.anonymizationStatus !== 'completed') {
    blockers.push('Complete anonymization before factory release.');
  }

  if (draft.internalProcessing.replacementVersionStatus !== 'completed') {
    blockers.push('Complete replacement version handling before factory release.');
  }

  if (!Array.isArray(draft.partNumberMappings) || draft.partNumberMappings.length === 0) {
    blockers.push('Create internal part number mappings before factory release.');
  } else {
    const unresolvedMapping = draft.partNumberMappings.find((mapping: any) => (
      mapping.status !== 'mapped' ||
      !hasResolvedInternalCode(mapping.internalModelNumber) ||
      !hasResolvedInternalCode(mapping.internalSku)
    ));

    if (unresolvedMapping) {
      blockers.push('All customer PN mappings must be confirmed as mapped with final MODEL# and SKU.');
    }
  }

  return blockers;
};

export function OemInternalProcessingPanel({ inquiry, onSave, onGenerateFactoryVersion }: OemInternalProcessingPanelProps) {
  const rawOem = inquiry?.oem || inquiry?.documentDataSnapshot?.oem || inquiry?.document_data_snapshot?.oem;
  if (!rawOem) return null;

  const normalized = normalizeOemData(rawOem);
  if (!normalized.enabled) return null;

  const [draft, setDraft] = useState(normalized);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const generatedVersion =
    inquiry?.oemFactoryDispatch
      ? {
          generatedAt: inquiry.oemFactoryDispatch.generatedAt,
          releasedAt: inquiry.oemFactoryDispatch.releasedAt,
          payload: inquiry.oemFactoryDispatch.payload,
        }
      : null;
  const releaseBlockers = getFactoryReleaseBlockers(draft, generatedVersion);

  const updateStatus = (key: keyof typeof draft.internalProcessing, value: string) => {
    setDraft((prev) => ({
      ...prev,
      internalProcessing: {
        ...prev.internalProcessing,
        [key]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (draft.internalProcessing.factoryForwardingStatus === 'released_to_factory' && releaseBlockers.length > 0) {
      toast.error(releaseBlockers[0]);
      return;
    }

    setSaving(true);
    try {
      await onSave(draft);
      toast.success('OEM internal processing updated.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update OEM internal processing.');
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateFactoryVersion = async () => {
    if (!onGenerateFactoryVersion) return;

    const nextOem = {
      ...draft,
      internalProcessing: {
        ...draft.internalProcessing,
        anonymizationStatus: 'completed',
        replacementVersionStatus: 'completed',
        factoryForwardingStatus:
          draft.internalProcessing.factoryForwardingStatus === 'internal_hold'
            ? 'ready_for_internal_review'
            : draft.internalProcessing.factoryForwardingStatus,
      },
    };

    const factoryVersion = {
      generatedAt: new Date().toISOString(),
      payload: adaptInquiryToFactoryFacingOemDocument({
        ...inquiry,
        oem: nextOem,
      }),
    };

    setGenerating(true);
    try {
      await onGenerateFactoryVersion({ nextOem, factoryVersion });
      setDraft(nextOem);
      toast.success('Factory-facing OEM version generated and saved.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to generate factory-facing OEM version.');
    } finally {
      setGenerating(false);
    }
  };

  const handleReleaseToFactory = async () => {
    if (!onGenerateFactoryVersion) return;
    if (releaseBlockers.length > 0) {
      toast.error(releaseBlockers[0]);
      return;
    }

    const nextOem = {
      ...draft,
      internalProcessing: {
        ...draft.internalProcessing,
        anonymizationStatus: 'completed',
        replacementVersionStatus: 'completed',
        factoryForwardingStatus: 'released_to_factory',
      },
    };

    const factoryVersion = {
      ...(generatedVersion || {}),
      generatedAt: generatedVersion?.generatedAt || new Date().toISOString(),
      releasedAt: new Date().toISOString(),
      payload: generatedVersion?.payload || adaptInquiryToFactoryFacingOemDocument({
        ...inquiry,
        oem: nextOem,
      }),
    };

    setGenerating(true);
    try {
      await onGenerateFactoryVersion({ nextOem, factoryVersion });
      setDraft(nextOem);
      toast.success('OEM flow released to factory.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to release OEM flow to factory.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <A4DocumentContainer pageWidth="210mm" pageMinHeight="297mm">
      <section className="h-full">
        <div className="mb-4">
          <h3 className="text-[18px] font-semibold tracking-[0.08em] text-slate-900">OEM Internal Processing</h3>
          <p className="mt-1 text-[12px] leading-5 text-slate-500">
            Internal-only controls for Mainline B. Saved through inquiry update to Supabase.
          </p>
          {generatedVersion?.generatedAt ? (
            <p className="mt-2 text-[12px] leading-5 text-emerald-600">
              Factory-facing version generated at {new Date(generatedVersion.generatedAt).toLocaleString()}.
            </p>
          ) : null}
          <div className="mt-3 border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }} />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
          <Label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">Anonymization Status</Label>
          <Select
            value={draft.internalProcessing.anonymizationStatus}
            onValueChange={(value) => updateStatus('anonymizationStatus', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_OPTIONS.anonymizationStatus.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
          <div>
          <Label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">Replacement Version Status</Label>
          <Select
            value={draft.internalProcessing.replacementVersionStatus}
            onValueChange={(value) => updateStatus('replacementVersionStatus', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_OPTIONS.replacementVersionStatus.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
          <div>
          <Label className="text-[12px] font-semibold uppercase tracking-[0.14em] text-slate-500">Factory Forwarding Status</Label>
          <Select
            value={draft.internalProcessing.factoryForwardingStatus}
            onValueChange={(value) => updateStatus('factoryForwardingStatus', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FIELD_OPTIONS.factoryForwardingStatus.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>
        <div className="mt-5 border-t border-slate-200 pt-5">
          <div className="flex flex-wrap items-center gap-2">
          <Badge className={releaseBlockers.length === 0 ? 'border border-emerald-200 bg-emerald-50 text-emerald-700' : 'border border-amber-200 bg-amber-50 text-amber-700'}>
            {releaseBlockers.length === 0 ? 'Factory release ready' : `${releaseBlockers.length} release gate${releaseBlockers.length > 1 ? 's' : ''} pending`}
          </Badge>
          {generatedVersion?.releasedAt ? (
            <Badge className="border border-indigo-200 bg-indigo-50 text-indigo-700">
              Released {new Date(generatedVersion.releasedAt).toLocaleString()}
            </Badge>
          ) : null}
          </div>
          {releaseBlockers.length > 0 ? (
            <div className="mt-3 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">Factory Release Gates</p>
              {releaseBlockers.map((blocker) => (
                <p key={blocker} className="text-sm text-amber-900">
                  {blocker}
                </p>
              ))}
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
              Factory release gate passed. Internal OEM flow can move to factory-facing release.
            </div>
          )}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4">
          <div className="flex flex-wrap items-center gap-3">
            <OemFactoryFacingPreview inquiry={inquiry} oemDraft={draft} />
            <Button
              variant="outline"
              className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              onClick={handleGenerateFactoryVersion}
              disabled={generating || !onGenerateFactoryVersion}
            >
              {generating ? 'Generating...' : 'Generate Factory Version'}
            </Button>
            <Button
              variant="outline"
              className="border-indigo-300 bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              onClick={handleReleaseToFactory}
              disabled={generating || !onGenerateFactoryVersion || releaseBlockers.length > 0}
            >
              {generating ? 'Processing...' : 'Release to Factory'}
            </Button>
          </div>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Saving...' : 'Save OEM Processing'}
          </Button>
        </div>
      </section>
    </A4DocumentContainer>
  );
}
