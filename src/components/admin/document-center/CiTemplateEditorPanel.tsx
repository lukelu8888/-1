import React from 'react';

import type { CommercialInvoiceData } from '../../documents/templates/CommercialInvoiceDocument';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
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

interface CiTemplateEditorPanelProps {
  publishedVersion?: string;
  draftVersion?: string;
  ciTemplateVersionNote: string;
  setCiTemplateVersionNote: (value: string) => void;
  onRestoreLatest: () => void;
  restoreDisabled: boolean;
  versionHistoryPanel: React.ReactNode;
  ciTemplateLayout: WorkspacePreviewLayout;
  updateCiTemplateLayout: <K extends keyof WorkspacePreviewLayout>(
    field: K,
    value: WorkspacePreviewLayout[K]
  ) => void;
  ciTemplateData: CommercialInvoiceData;
  updateCiTemplateData: <K extends keyof CommercialInvoiceData>(
    field: K,
    value: CommercialInvoiceData[K]
  ) => void;
  goodsTableColumns: TemplateTableColumn[];
  moveCiGoodsTableColumn: (index: number, direction: 'up' | 'down') => void;
  updateCiGoodsTableColumn: (index: number, patch: Partial<TemplateTableColumn>) => void;
}

export function CiTemplateEditorPanel({
  publishedVersion,
  draftVersion,
  ciTemplateVersionNote,
  setCiTemplateVersionNote,
  onRestoreLatest,
  restoreDisabled,
  versionHistoryPanel,
  ciTemplateLayout,
  updateCiTemplateLayout,
  ciTemplateData,
  updateCiTemplateData,
  goodsTableColumns,
  moveCiGoodsTableColumn,
  updateCiGoodsTableColumn,
}: CiTemplateEditorPanelProps) {
  return (
    <>
      <TemplateVersionActionsCard
        publishedVersion={publishedVersion}
        draftVersion={draftVersion}
        noteField={(
          <div className="mt-2">
            <Label className="text-[11px] text-violet-700">版本备注</Label>
            <Textarea
              value={ciTemplateVersionNote}
              onChange={(e) => setCiTemplateVersionNote(e.target.value)}
              className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
            />
          </div>
        )}
        onRestoreLatest={onRestoreLatest}
        restoreDisabled={restoreDisabled}
      />
      {versionHistoryPanel}
      <WorkspaceLayoutPanel layout={ciTemplateLayout} onChange={updateCiTemplateLayout} />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">发票信息</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-gray-500">CI 编号</Label>
            <Input
              value={ciTemplateData.invoiceNo}
              onChange={(e) => updateCiTemplateData('invoiceNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">日期</Label>
            <Input
              value={ciTemplateData.invoiceDate}
              onChange={(e) => updateCiTemplateData('invoiceDate', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-[11px] text-gray-500">合同号</Label>
            <Input
              value={ciTemplateData.contractNo || ''}
              onChange={(e) => updateCiTemplateData('contractNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">出口方</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">英文名称</Label>
            <Input
              value={ciTemplateData.exporter.nameEn}
              onChange={(e) => updateCiTemplateData('exporter', { ...ciTemplateData.exporter, nameEn: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">英文地址</Label>
            <Textarea
              value={ciTemplateData.exporter.addressEn}
              onChange={(e) => updateCiTemplateData('exporter', { ...ciTemplateData.exporter, addressEn: e.target.value })}
              className="mt-1 min-h-[52px] text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">电话</Label>
            <Input
              value={ciTemplateData.exporter.tel}
              onChange={(e) => updateCiTemplateData('exporter', { ...ciTemplateData.exporter, tel: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">进口方</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">客户名称</Label>
            <Input
              value={ciTemplateData.importer.name}
              onChange={(e) => updateCiTemplateData('importer', { ...ciTemplateData.importer, name: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">地址</Label>
            <Textarea
              value={ciTemplateData.importer.address}
              onChange={(e) => updateCiTemplateData('importer', { ...ciTemplateData.importer, address: e.target.value })}
              className="mt-1 min-h-[52px] text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">货物清单</p>
        <div className="space-y-3">
          {ciTemplateData.goods.map((item, index) => (
            <div key={`${item.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
              <div className="mb-2 text-[11px] font-semibold text-gray-700">货物 {item.no}</div>
              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] text-gray-500">描述</Label>
                  <Textarea
                    value={item.description}
                    onChange={(e) =>
                      updateCiTemplateData(
                        'goods',
                        ciTemplateData.goods.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, description: e.target.value } : row
                        )
                      )
                    }
                    className="mt-1 min-h-[52px] text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-gray-500">数量</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateCiTemplateData(
                          'goods',
                          ciTemplateData.goods.map((row, rowIndex) =>
                            rowIndex === index
                              ? { ...row, quantity: Number(e.target.value) || 0, amount: (Number(e.target.value) || 0) * row.unitPrice }
                              : row
                          )
                        )
                      }
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-gray-500">单价</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        updateCiTemplateData(
                          'goods',
                          ciTemplateData.goods.map((row, rowIndex) =>
                            rowIndex === index
                              ? { ...row, unitPrice: Number(e.target.value) || 0, amount: (Number(e.target.value) || 0) * row.quantity }
                              : row
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
      <TemplateTableColumnsPanel
        title="Description Of Goods 表格列设置"
        description="可直接修改 CI 货物清单表的列标题和列宽百分比。保存草稿或发布版本后会一起保存。"
        columns={goodsTableColumns}
        onMove={moveCiGoodsTableColumn}
        onPatch={updateCiGoodsTableColumn}
      />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">运输与包装</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">贸易条款</Label>
            <Input
              value={ciTemplateData.shipping.tradeTerms}
              onChange={(e) => updateCiTemplateData('shipping', { ...ciTemplateData.shipping, tradeTerms: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">装运港</Label>
            <Input
              value={ciTemplateData.shipping.portOfLoading}
              onChange={(e) => updateCiTemplateData('shipping', { ...ciTemplateData.shipping, portOfLoading: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">总箱数</Label>
            <Input
              type="number"
              value={ciTemplateData.packing.totalCartons}
              onChange={(e) => updateCiTemplateData('packing', { ...ciTemplateData.packing, totalCartons: Number(e.target.value) || 0 })}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
    </>
  );
}
