import React from 'react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { TemplateVersionActionsCard } from './TemplateVersionActionsCard';

import type {
  QuoteRequirementDocumentData,
  QuoteRequirementPreviewLayout,
  QuoteRequirementTextOverrides,
} from '../../documents/templates/QuoteRequirementDocument';

interface QrTemplateVersionSummary {
  version?: string;
}

interface QrTemplateEditorPanelProps {
  publishedVersion?: string;
  draftVersion?: string;
  qrTemplateVersionNote: string;
  setQrTemplateVersionNote: (value: string) => void;
  onRestoreLatest: () => void;
  restoreDisabled: boolean;
  qrTemplateTextOverrides: QuoteRequirementTextOverrides;
  updateQrTemplateText: (field: keyof QuoteRequirementTextOverrides, value: string) => void;
  qrTemplateData: QuoteRequirementDocumentData;
  updateQrTemplateData: <K extends keyof QuoteRequirementDocumentData>(
    field: K,
    value: QuoteRequirementDocumentData[K]
  ) => void;
  qrTemplateLayout: QuoteRequirementPreviewLayout;
  updateQrTemplateLayout: <K extends keyof QuoteRequirementPreviewLayout>(
    field: K,
    value: QuoteRequirementPreviewLayout[K]
  ) => void;
  versionHistoryPanel: React.ReactNode;
}

export function QrTemplateEditorPanel({
  publishedVersion,
  draftVersion,
  qrTemplateVersionNote,
  setQrTemplateVersionNote,
  onRestoreLatest,
  restoreDisabled,
  qrTemplateTextOverrides,
  updateQrTemplateText,
  qrTemplateData,
  updateQrTemplateData,
  qrTemplateLayout,
  updateQrTemplateLayout,
  versionHistoryPanel,
}: QrTemplateEditorPanelProps) {
  return (
    <>
      <TemplateVersionActionsCard
        publishedVersion={publishedVersion}
        draftVersion={draftVersion}
        noteField={(
          <div className="mt-2">
            <Label className="text-[11px] text-violet-700">版本备注</Label>
            <Textarea
              value={qrTemplateVersionNote}
              onChange={(e) => setQrTemplateVersionNote(e.target.value)}
              className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
            />
          </div>
        )}
        onRestoreLatest={onRestoreLatest}
        restoreDisabled={restoreDisabled}
      />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">模板标题</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">中文标题</Label>
            <Input
              value={qrTemplateTextOverrides.documentTitle}
              onChange={(e) => updateQrTemplateText('documentTitle', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">英文标题</Label>
            <Input
              value={qrTemplateTextOverrides.documentTitleEn}
              onChange={(e) => updateQrTemplateText('documentTitleEn', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">业务部说明标题</Label>
            <Input
              value={qrTemplateTextOverrides.salesInstructionsTitle}
              onChange={(e) => updateQrTemplateText('salesInstructionsTitle', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">单据信息</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-gray-500">QR编号</Label>
            <Input
              value={qrTemplateData.requirementNo}
              onChange={(e) => updateQrTemplateData('requirementNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">来源询价单</Label>
            <Input
              value={qrTemplateData.sourceInquiryNo}
              onChange={(e) => updateQrTemplateData('sourceInquiryNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">要求回复日期</Label>
            <Input
              value={qrTemplateData.requiredResponseDate}
              onChange={(e) => updateQrTemplateData('requiredResponseDate', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">要求交货日期</Label>
            <Input
              value={qrTemplateData.requiredDeliveryDate}
              onChange={(e) => updateQrTemplateData('requiredDeliveryDate', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">客户信息</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">客户名称</Label>
            <Input
              value={qrTemplateData.customer.companyName}
              onChange={(e) =>
                updateQrTemplateData('customer', {
                  ...qrTemplateData.customer,
                  companyName: e.target.value,
                })
              }
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-gray-500">联系人</Label>
              <Input
                value={qrTemplateData.customer.contactPerson}
                onChange={(e) =>
                  updateQrTemplateData('customer', {
                    ...qrTemplateData.customer,
                    contactPerson: e.target.value,
                  })
                }
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">区域</Label>
              <Input
                value={qrTemplateData.customer.region}
                onChange={(e) =>
                  updateQrTemplateData('customer', {
                    ...qrTemplateData.customer,
                    region: e.target.value,
                  })
                }
                className="mt-1 h-7 text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">客户背景说明</Label>
            <Textarea
              value={qrTemplateTextOverrides.customerIntroText}
              onChange={(e) => updateQrTemplateText('customerIntroText', e.target.value)}
              className="mt-1 min-h-[96px] text-xs leading-6"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">业务员姓名</Label>
            <Input
              value={qrTemplateData.createdBy}
              onChange={(e) => updateQrTemplateData('createdBy', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">业务部说明</p>
        <div>
          <Label className="text-[11px] text-gray-500">说明内容</Label>
          <Textarea
            value={qrTemplateData.salesDeptNotes || ''}
            onChange={(e) => updateQrTemplateData('salesDeptNotes', e.target.value)}
            className="mt-1 min-h-[180px] text-xs leading-6"
          />
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">采购部反馈</p>
        <div>
          <Label className="text-[11px] text-gray-500">反馈区内容</Label>
          <Textarea
            value={qrTemplateData.purchaseDeptFeedback || ''}
            onChange={(e) => updateQrTemplateData('purchaseDeptFeedback', e.target.value)}
            className="mt-1 min-h-[96px] text-xs leading-6"
          />
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">版式参数</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-gray-500">画布宽度(mm)</Label>
            <Input
              type="number"
              value={qrTemplateLayout.canvasWidthMm}
              onChange={(e) => updateQrTemplateLayout('canvasWidthMm', Number(e.target.value) || 210)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">最小高度(mm)</Label>
            <Input
              type="number"
              value={qrTemplateLayout.canvasMinHeightMm}
              onChange={(e) => updateQrTemplateLayout('canvasMinHeightMm', Number(e.target.value) || 297)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">上边距(mm)</Label>
            <Input
              type="number"
              value={qrTemplateLayout.contentPaddingTopMm}
              onChange={(e) => updateQrTemplateLayout('contentPaddingTopMm', Number(e.target.value) || 10)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">下边距(mm)</Label>
            <Input
              type="number"
              value={qrTemplateLayout.contentPaddingBottomMm}
              onChange={(e) => updateQrTemplateLayout('contentPaddingBottomMm', Number(e.target.value) || 12)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">字体(pt)</Label>
            <Input
              type="number"
              value={qrTemplateLayout.fontSizePt}
              onChange={(e) => updateQrTemplateLayout('fontSizePt', Number(e.target.value) || 10)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">行高</Label>
            <Input
              type="number"
              step="0.1"
              value={qrTemplateLayout.lineHeight}
              onChange={(e) => updateQrTemplateLayout('lineHeight', Number(e.target.value) || 1.5)}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">底部说明</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">底部说明 1</Label>
            <Textarea
              value={qrTemplateTextOverrides.footerNote1}
              onChange={(e) => updateQrTemplateText('footerNote1', e.target.value)}
              className="mt-1 min-h-[52px] text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">底部说明 2</Label>
            <Textarea
              value={qrTemplateTextOverrides.footerNote2}
              onChange={(e) => updateQrTemplateText('footerNote2', e.target.value)}
              className="mt-1 min-h-[52px] text-xs"
            />
          </div>
        </div>
      </div>
      {versionHistoryPanel}
    </>
  );
}
