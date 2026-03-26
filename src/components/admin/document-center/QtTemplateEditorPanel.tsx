import React from 'react';

import type { QuotationData } from '../../documents/templates/QuotationDocument';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { QuotationLayoutPanel } from './QuotationLayoutPanel';
import { QuotationProductsEditorPanel } from './QuotationProductsEditorPanel';
import { TemplateTableColumnsPanel } from './TemplateTableColumnsPanel';
import { TemplateVersionActionsCard } from './TemplateVersionActionsCard';
import { WorkspaceLayoutPanel } from './WorkspaceLayoutPanel';

interface WorkspacePreviewLayout {
  canvasWidthMm: number;
  canvasMinHeightMm: number;
  contentPaddingTopMm: number;
  contentPaddingBottomMm: number;
  fontSizePt: number;
  lineHeight: number;
  qtLogoWidthPx?: number;
  qtLogoHeightPx?: number;
  qtInfoTableWidthPx?: number;
  qtTableCellPaddingY?: number;
  qtCompanyTableWidthPercent?: number;
  qtProductsTableWidthPercent?: number;
  qtTermsTableWidthPercent?: number;
  qtRemarksTableWidthPercent?: number;
  qtPreparedByTableWidthPercent?: number;
}

interface TemplateTableColumn {
  key: string;
  label: string;
  widthPercent: number;
}

interface QtTemplateEditorPanelProps {
  publishedVersion?: string;
  draftVersion?: string;
  quotationTemplateVersionNote: string;
  setQuotationTemplateVersionNote: (value: string) => void;
  onRestoreLatest: () => void;
  restoreDisabled: boolean;
  versionHistoryPanel: React.ReactNode;
  quotationTemplateLayout: WorkspacePreviewLayout;
  updateQuotationTemplateLayout: <K extends keyof WorkspacePreviewLayout>(
    field: K,
    value: WorkspacePreviewLayout[K]
  ) => void;
  quotationTemplateData: QuotationData;
  updateQuotationTemplateData: <K extends keyof QuotationData>(
    field: K,
    value: QuotationData[K]
  ) => void;
  onUpdateProductName: (index: number, value: string) => void;
  onUpdateQuantity: (index: number, value: number) => void;
  onUpdateUnitPrice: (index: number, value: number) => void;
  productTableColumns: TemplateTableColumn[];
  moveQuotationProductTableColumn: (index: number, direction: 'up' | 'down') => void;
  updateQuotationProductTableColumn: (index: number, patch: Partial<TemplateTableColumn>) => void;
}

export function QtTemplateEditorPanel({
  publishedVersion,
  draftVersion,
  quotationTemplateVersionNote,
  setQuotationTemplateVersionNote,
  onRestoreLatest,
  restoreDisabled,
  versionHistoryPanel,
  quotationTemplateLayout,
  updateQuotationTemplateLayout,
  quotationTemplateData,
  updateQuotationTemplateData,
  onUpdateProductName,
  onUpdateQuantity,
  onUpdateUnitPrice,
  productTableColumns,
  moveQuotationProductTableColumn,
  updateQuotationProductTableColumn,
}: QtTemplateEditorPanelProps) {
  return (
    <>
      <TemplateVersionActionsCard
        publishedVersion={publishedVersion}
        draftVersion={draftVersion}
        noteField={(
          <div className="mt-2">
            <Label className="text-[11px] text-violet-700">版本备注</Label>
            <Textarea
              value={quotationTemplateVersionNote}
              onChange={(e) => setQuotationTemplateVersionNote(e.target.value)}
              className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
            />
          </div>
        )}
        onRestoreLatest={onRestoreLatest}
        restoreDisabled={restoreDisabled}
      />
      {versionHistoryPanel}
      <WorkspaceLayoutPanel layout={quotationTemplateLayout} onChange={updateQuotationTemplateLayout} />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">报价信息</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-gray-500">QT 编号</Label>
            <Input
              value={quotationTemplateData.quotationNo}
              onChange={(e) => updateQuotationTemplateData('quotationNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">报价日期</Label>
            <Input
              value={quotationTemplateData.quotationDate}
              onChange={(e) => updateQuotationTemplateData('quotationDate', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">有效期</Label>
            <Input
              value={quotationTemplateData.validUntil}
              onChange={(e) => updateQuotationTemplateData('validUntil', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">来源询价单</Label>
            <Input
              value={quotationTemplateData.inquiryNo || ''}
              onChange={(e) => updateQuotationTemplateData('inquiryNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">客户与销售员</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">客户名称</Label>
            <Input
              value={quotationTemplateData.customer.companyName}
              onChange={(e) =>
                updateQuotationTemplateData('customer', {
                  ...quotationTemplateData.customer,
                  companyName: e.target.value,
                })
              }
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">销售员</Label>
            <Input
              value={quotationTemplateData.salesPerson.name}
              onChange={(e) =>
                updateQuotationTemplateData('salesPerson', {
                  ...quotationTemplateData.salesPerson,
                  name: e.target.value,
                })
              }
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <QuotationProductsEditorPanel
        products={quotationTemplateData.products}
        onUpdateProductName={onUpdateProductName}
        onUpdateQuantity={onUpdateQuantity}
        onUpdateUnitPrice={onUpdateUnitPrice}
      />
      <TemplateTableColumnsPanel
        title="报价产品表格列设置"
        description="可直接修改 QT 产品表的列标题和列宽百分比。保存草稿或发布版本后会一起保存。"
        columns={productTableColumns}
        onMove={moveQuotationProductTableColumn}
        onPatch={updateQuotationProductTableColumn}
      />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">贸易条款</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">Incoterms</Label>
            <Input
              value={quotationTemplateData.tradeTerms.incoterms}
              onChange={(e) =>
                updateQuotationTemplateData('tradeTerms', {
                  ...quotationTemplateData.tradeTerms,
                  incoterms: e.target.value,
                })
              }
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">付款条款</Label>
            <Textarea
              value={quotationTemplateData.tradeTerms.paymentTerms}
              onChange={(e) =>
                updateQuotationTemplateData('tradeTerms', {
                  ...quotationTemplateData.tradeTerms,
                  paymentTerms: e.target.value,
                })
              }
              className="mt-1 min-h-[52px] text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">交期</Label>
            <Input
              value={quotationTemplateData.tradeTerms.deliveryTime}
              onChange={(e) =>
                updateQuotationTemplateData('tradeTerms', {
                  ...quotationTemplateData.tradeTerms,
                  deliveryTime: e.target.value,
                })
              }
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <QuotationLayoutPanel
        layout={quotationTemplateLayout}
        onChange={updateQuotationTemplateLayout}
      />
    </>
  );
}
