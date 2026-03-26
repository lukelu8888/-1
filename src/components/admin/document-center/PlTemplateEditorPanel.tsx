import React from 'react';

import type { PackingListData } from '../../documents/templates/PackingListDocument';
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

interface PlTemplateEditorPanelProps {
  publishedVersion?: string;
  draftVersion?: string;
  plTemplateVersionNote: string;
  setPlTemplateVersionNote: (value: string) => void;
  onRestoreLatest: () => void;
  restoreDisabled: boolean;
  versionHistoryPanel: React.ReactNode;
  plTemplateLayout: WorkspacePreviewLayout;
  updatePlTemplateLayout: <K extends keyof WorkspacePreviewLayout>(
    field: K,
    value: WorkspacePreviewLayout[K]
  ) => void;
  plTemplateData: PackingListData;
  updatePlTemplateData: <K extends keyof PackingListData>(
    field: K,
    value: PackingListData[K]
  ) => void;
}

export function PlTemplateEditorPanel({
  publishedVersion,
  draftVersion,
  plTemplateVersionNote,
  setPlTemplateVersionNote,
  onRestoreLatest,
  restoreDisabled,
  versionHistoryPanel,
  plTemplateLayout,
  updatePlTemplateLayout,
  plTemplateData,
  updatePlTemplateData,
}: PlTemplateEditorPanelProps) {
  return (
    <>
      <TemplateVersionActionsCard
        publishedVersion={publishedVersion}
        draftVersion={draftVersion}
        noteField={(
          <div className="mt-2">
            <Label className="text-[11px] text-violet-700">版本备注</Label>
            <Textarea
              value={plTemplateVersionNote}
              onChange={(e) => setPlTemplateVersionNote(e.target.value)}
              className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
            />
          </div>
        )}
        onRestoreLatest={onRestoreLatest}
        restoreDisabled={restoreDisabled}
      />
      {versionHistoryPanel}
      <WorkspaceLayoutPanel layout={plTemplateLayout} onChange={updatePlTemplateLayout} />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">单据信息</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-gray-500">PL 编号</Label>
            <Input
              value={plTemplateData.plNo}
              onChange={(e) => updatePlTemplateData('plNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">CI 编号</Label>
            <Input
              value={plTemplateData.invoiceNo}
              onChange={(e) => updatePlTemplateData('invoiceNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-[11px] text-gray-500">日期</Label>
            <Input
              value={plTemplateData.date}
              onChange={(e) => updatePlTemplateData('date', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">出口方 / 进口方</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">出口方名称</Label>
            <Input
              value={plTemplateData.exporter.name}
              onChange={(e) => updatePlTemplateData('exporter', { ...plTemplateData.exporter, name: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">进口方名称</Label>
            <Input
              value={plTemplateData.importer.name}
              onChange={(e) => updatePlTemplateData('importer', { ...plTemplateData.importer, name: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">唛头</Label>
            <Textarea
              value={plTemplateData.shippingMarks}
              onChange={(e) => updatePlTemplateData('shippingMarks', e.target.value)}
              className="mt-1 min-h-[56px] text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">装箱明细</p>
        <div className="space-y-3">
          {plTemplateData.packages.map((pkg, index) => (
            <div key={`${pkg.cartonNo}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
              <div className="mb-2 text-[11px] font-semibold text-gray-700">包装 {index + 1}</div>
              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] text-gray-500">描述</Label>
                  <Textarea
                    value={pkg.description}
                    onChange={(e) =>
                      updatePlTemplateData(
                        'packages',
                        plTemplateData.packages.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, description: e.target.value } : row
                        )
                      )
                    }
                    className="mt-1 min-h-[52px] text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-gray-500">箱数</Label>
                    <Input
                      type="number"
                      value={pkg.totalCartons}
                      onChange={(e) =>
                        updatePlTemplateData(
                          'packages',
                          plTemplateData.packages.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, totalCartons: Number(e.target.value) || 0 } : row
                          )
                        )
                      }
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-gray-500">总数量</Label>
                    <Input
                      type="number"
                      value={pkg.totalQty}
                      onChange={(e) =>
                        updatePlTemplateData(
                          'packages',
                          plTemplateData.packages.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, totalQty: Number(e.target.value) || 0 } : row
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
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">运输信息</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">装运港</Label>
            <Input
              value={plTemplateData.shipping.portOfLoading}
              onChange={(e) => updatePlTemplateData('shipping', { ...plTemplateData.shipping, portOfLoading: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">卸货港</Label>
            <Input
              value={plTemplateData.shipping.portOfDischarge}
              onChange={(e) => updatePlTemplateData('shipping', { ...plTemplateData.shipping, portOfDischarge: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">提单号</Label>
            <Input
              value={plTemplateData.shipping.blNo || ''}
              onChange={(e) => updatePlTemplateData('shipping', { ...plTemplateData.shipping, blNo: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
    </>
  );
}
