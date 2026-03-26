import React from 'react';

import type { StatementOfAccountData } from '../../documents/templates/StatementOfAccountDocument';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
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

interface SoaTemplateEditorPanelProps {
  publishedVersion?: string;
  draftVersion?: string;
  soaTemplateVersionNote: string;
  setSoaTemplateVersionNote: (value: string) => void;
  onRestoreLatest: () => void;
  restoreDisabled: boolean;
  versionHistoryPanel: React.ReactNode;
  soaTemplateLayout: WorkspacePreviewLayout;
  updateSoaTemplateLayout: <K extends keyof WorkspacePreviewLayout>(
    field: K,
    value: WorkspacePreviewLayout[K]
  ) => void;
  soaTemplateData: StatementOfAccountData;
  updateSoaTemplateData: <K extends keyof StatementOfAccountData>(
    field: K,
    value: StatementOfAccountData[K]
  ) => void;
}

export function SoaTemplateEditorPanel({
  publishedVersion,
  draftVersion,
  soaTemplateVersionNote,
  setSoaTemplateVersionNote,
  onRestoreLatest,
  restoreDisabled,
  versionHistoryPanel,
  soaTemplateLayout,
  updateSoaTemplateLayout,
  soaTemplateData,
  updateSoaTemplateData,
}: SoaTemplateEditorPanelProps) {
  return (
    <>
      <TemplateVersionActionsCard
        publishedVersion={publishedVersion}
        draftVersion={draftVersion}
        noteField={(
          <div className="mt-2">
            <Label className="text-[11px] text-violet-700">版本备注</Label>
            <Textarea
              value={soaTemplateVersionNote}
              onChange={(e) => setSoaTemplateVersionNote(e.target.value)}
              className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
            />
          </div>
        )}
        onRestoreLatest={onRestoreLatest}
        restoreDisabled={restoreDisabled}
      />
      {versionHistoryPanel}
      <WorkspaceLayoutPanel layout={soaTemplateLayout} onChange={updateSoaTemplateLayout} />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">对账信息</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-gray-500">SOA 编号</Label>
            <Input
              value={soaTemplateData.statementNo}
              onChange={(e) => updateSoaTemplateData('statementNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">对账日期</Label>
            <Input
              value={soaTemplateData.statementDate}
              onChange={(e) => updateSoaTemplateData('statementDate', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">期间开始</Label>
            <Input
              value={soaTemplateData.periodStart}
              onChange={(e) => updateSoaTemplateData('periodStart', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">期间结束</Label>
            <Input
              value={soaTemplateData.periodEnd}
              onChange={(e) => updateSoaTemplateData('periodEnd', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">客户与余额</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">客户名称</Label>
            <Input
              value={soaTemplateData.customer.companyName}
              onChange={(e) => updateSoaTemplateData('customer', { ...soaTemplateData.customer, companyName: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">期末余额</Label>
            <Input
              type="number"
              value={soaTemplateData.closingBalance.amount}
              onChange={(e) => updateSoaTemplateData('closingBalance', { ...soaTemplateData.closingBalance, amount: Number(e.target.value) || 0 })}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">交易明细</p>
        <div className="space-y-3">
          {soaTemplateData.transactions.map((item, index) => (
            <div key={`${item.referenceNo}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
              <div className="mb-2 text-[11px] font-semibold text-gray-700">交易 {index + 1}</div>
              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] text-gray-500">摘要</Label>
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      updateSoaTemplateData(
                        'transactions',
                        soaTemplateData.transactions.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, description: e.target.value } : row
                        )
                      )
                    }
                    className="mt-1 h-7 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-gray-500">借方</Label>
                    <Input
                      type="number"
                      value={item.debit || 0}
                      onChange={(e) =>
                        updateSoaTemplateData(
                          'transactions',
                          soaTemplateData.transactions.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, debit: Number(e.target.value) || 0 } : row
                          )
                        )
                      }
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-gray-500">贷方</Label>
                    <Input
                      type="number"
                      value={item.credit || 0}
                      onChange={(e) =>
                        updateSoaTemplateData(
                          'transactions',
                          soaTemplateData.transactions.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, credit: Number(e.target.value) || 0 } : row
                          )
                        )
                      }
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
