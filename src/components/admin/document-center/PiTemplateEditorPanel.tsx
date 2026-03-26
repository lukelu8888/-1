import React from 'react';

import type { ProformaInvoiceData } from '../../documents/templates/ProformaInvoiceDocument';
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

interface PiTemplateEditorPanelProps {
  publishedVersion?: string;
  draftVersion?: string;
  piTemplateVersionNote: string;
  setPiTemplateVersionNote: (value: string) => void;
  onRestoreLatest: () => void;
  restoreDisabled: boolean;
  versionHistoryPanel: React.ReactNode;
  piTemplateLayout: WorkspacePreviewLayout;
  updatePiTemplateLayout: <K extends keyof WorkspacePreviewLayout>(
    field: K,
    value: WorkspacePreviewLayout[K]
  ) => void;
  piTemplateData: ProformaInvoiceData;
  updatePiTemplateData: <K extends keyof ProformaInvoiceData>(
    field: K,
    value: ProformaInvoiceData[K]
  ) => void;
  goodsTableColumns: TemplateTableColumn[];
  movePiGoodsTableColumn: (index: number, direction: 'up' | 'down') => void;
  updatePiGoodsTableColumn: (index: number, patch: Partial<TemplateTableColumn>) => void;
}

export function PiTemplateEditorPanel({
  publishedVersion,
  draftVersion,
  piTemplateVersionNote,
  setPiTemplateVersionNote,
  onRestoreLatest,
  restoreDisabled,
  versionHistoryPanel,
  piTemplateLayout,
  updatePiTemplateLayout,
  piTemplateData,
  updatePiTemplateData,
  goodsTableColumns,
  movePiGoodsTableColumn,
  updatePiGoodsTableColumn,
}: PiTemplateEditorPanelProps) {
  return (
    <>
      <TemplateVersionActionsCard
        publishedVersion={publishedVersion}
        draftVersion={draftVersion}
        noteField={(
          <div className="mt-2">
            <Label className="text-[11px] text-violet-700">版本备注</Label>
            <Textarea
              value={piTemplateVersionNote}
              onChange={(e) => setPiTemplateVersionNote(e.target.value)}
              className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
            />
          </div>
        )}
        onRestoreLatest={onRestoreLatest}
        restoreDisabled={restoreDisabled}
      />
      {versionHistoryPanel}
      <WorkspaceLayoutPanel layout={piTemplateLayout} onChange={updatePiTemplateLayout} />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="mb-3 text-xs font-semibold text-gray-900">发票信息</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-gray-500">发票编号</Label>
            <Input
              value={piTemplateData.invoiceNo}
              onChange={(e) => updatePiTemplateData('invoiceNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">日期</Label>
            <Input
              value={piTemplateData.invoiceDate}
              onChange={(e) => updatePiTemplateData('invoiceDate', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">Cost No.</Label>
            <Input
              value={piTemplateData.costNo || ''}
              onChange={(e) => updatePiTemplateData('costNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">S/C No.</Label>
            <Input
              value={piTemplateData.scNo || ''}
              onChange={(e) => updatePiTemplateData('scNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="mb-3 text-xs font-semibold text-gray-900">卖方信息</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">英文公司名</Label>
            <Input
              value={piTemplateData.seller.nameEn}
              onChange={(e) => updatePiTemplateData('seller', { ...piTemplateData.seller, nameEn: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-gray-500">手机</Label>
              <Input
                value={piTemplateData.seller.cell || ''}
                onChange={(e) => updatePiTemplateData('seller', { ...piTemplateData.seller, cell: e.target.value })}
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">邮箱</Label>
              <Input
                value={piTemplateData.seller.email || ''}
                onChange={(e) => updatePiTemplateData('seller', { ...piTemplateData.seller, email: e.target.value })}
                className="mt-1 h-7 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="mb-3 text-xs font-semibold text-gray-900">买方信息</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">客户名称</Label>
            <Input
              value={piTemplateData.buyer.companyName}
              onChange={(e) => updatePiTemplateData('buyer', { ...piTemplateData.buyer, companyName: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">P.O. Box</Label>
            <Input
              value={piTemplateData.buyer.poBox || ''}
              onChange={(e) => updatePiTemplateData('buyer', { ...piTemplateData.buyer, poBox: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">联系人</Label>
            <Input
              value={piTemplateData.buyer.contactPerson || ''}
              onChange={(e) => updatePiTemplateData('buyer', { ...piTemplateData.buyer, contactPerson: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="mb-3 text-xs font-semibold text-gray-900">货物清单</p>
        <div className="space-y-3">
          {piTemplateData.products.map((product, index) => (
            <div key={`${product.seqNo}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
              <div className="mb-2 text-[11px] font-semibold text-gray-700">产品 {product.seqNo}</div>
              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] text-gray-500">描述</Label>
                  <Textarea
                    value={product.description}
                    onChange={(e) =>
                      updatePiTemplateData(
                        'products',
                        piTemplateData.products.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, description: e.target.value } : item
                        )
                      )
                    }
                    className="mt-1 min-h-[52px] text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-gray-500">规格</Label>
                  <Input
                    value={product.specification || ''}
                    onChange={(e) =>
                      updatePiTemplateData(
                        'products',
                        piTemplateData.products.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, specification: e.target.value } : item
                        )
                      )
                    }
                    className="mt-1 h-7 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-gray-500">数量</Label>
                    <Input
                      type="number"
                      value={product.quantity}
                      onChange={(e) =>
                        updatePiTemplateData(
                          'products',
                          piTemplateData.products.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  quantity: Number(e.target.value) || 0,
                                  extendedValue: (Number(e.target.value) || 0) * item.unitPrice,
                                }
                              : item
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
                      step="0.001"
                      value={product.unitPrice}
                      onChange={(e) =>
                        updatePiTemplateData(
                          'products',
                          piTemplateData.products.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  unitPrice: Number(e.target.value) || 0,
                                  extendedValue: (Number(e.target.value) || 0) * item.quantity,
                                }
                              : item
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
        title="Description of Goods 表格列设置"
        description="可直接修改 PI 货物清单表的列标题和列宽百分比。保存草稿或发布版本后会一起保存。"
        columns={goodsTableColumns}
        onMove={movePiGoodsTableColumn}
        onPatch={updatePiGoodsTableColumn}
      />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="mb-3 text-xs font-semibold text-gray-900">付款与备注</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">价格条款</Label>
            <Input
              value={piTemplateData.priceTerms || ''}
              onChange={(e) => updatePiTemplateData('priceTerms', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">付款条款</Label>
            <Textarea
              value={piTemplateData.remarks.paymentTerms || ''}
              onChange={(e) =>
                updatePiTemplateData('remarks', { ...piTemplateData.remarks, paymentTerms: e.target.value })
              }
              className="mt-1 min-h-[56px] text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">装运港</Label>
            <Input
              value={piTemplateData.remarks.portOfLoading || ''}
              onChange={(e) =>
                updatePiTemplateData('remarks', { ...piTemplateData.remarks, portOfLoading: e.target.value })
              }
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
    </>
  );
}
