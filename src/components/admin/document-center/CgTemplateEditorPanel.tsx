import React from 'react';

import type { PurchaseOrderData } from '../../documents/templates/PurchaseOrderDocument';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
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

interface CgTemplateEditorPanelProps {
  publishedVersion?: string;
  draftVersion?: string;
  cgTemplateVersionNote: string;
  setCgTemplateVersionNote: (value: string) => void;
  onRestoreLatest: () => void;
  restoreDisabled: boolean;
  versionHistoryPanel: React.ReactNode;
  cgTemplateLayout: WorkspacePreviewLayout;
  updateCgTemplateLayout: <K extends keyof WorkspacePreviewLayout>(
    field: K,
    value: WorkspacePreviewLayout[K]
  ) => void;
  cgTemplateData: PurchaseOrderData;
  updateCgTemplateData: <K extends keyof PurchaseOrderData>(
    field: K,
    value: PurchaseOrderData[K]
  ) => void;
  productTableColumns: TemplateTableColumn[];
  moveCgProductTableColumn: (index: number, direction: 'up' | 'down') => void;
  updateCgProductTableColumn: (index: number, patch: Partial<TemplateTableColumn>) => void;
}

export function CgTemplateEditorPanel({
  publishedVersion,
  draftVersion,
  cgTemplateVersionNote,
  setCgTemplateVersionNote,
  onRestoreLatest,
  restoreDisabled,
  versionHistoryPanel,
  cgTemplateLayout,
  updateCgTemplateLayout,
  cgTemplateData,
  updateCgTemplateData,
  productTableColumns,
  moveCgProductTableColumn,
  updateCgProductTableColumn,
}: CgTemplateEditorPanelProps) {
  return (
    <>
      <TemplateVersionActionsCard
        publishedVersion={publishedVersion}
        draftVersion={draftVersion}
        noteField={(
          <div className="mt-2">
            <Label className="text-[11px] text-violet-700">版本备注</Label>
            <Textarea
              value={cgTemplateVersionNote}
              onChange={(e) => setCgTemplateVersionNote(e.target.value)}
              className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
            />
          </div>
        )}
        onRestoreLatest={onRestoreLatest}
        restoreDisabled={restoreDisabled}
      />
      {versionHistoryPanel}
      <WorkspaceLayoutPanel layout={cgTemplateLayout} onChange={updateCgTemplateLayout} />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="mb-3 text-xs font-semibold text-gray-900">合同信息</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-gray-500">CG 编号</Label>
            <Input
              value={cgTemplateData.poNo}
              onChange={(e) => updateCgTemplateData('poNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">合同日期</Label>
            <Input
              value={cgTemplateData.poDate}
              onChange={(e) => updateCgTemplateData('poDate', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">结算币种</Label>
            <Select
              value={String(cgTemplateData.terms.currency || 'CNY').toUpperCase() === 'USD' ? 'USD' : 'CNY'}
              onValueChange={(value) => {
                const nextCurrency = value === 'USD' ? 'USD' : 'CNY';
                updateCgTemplateData('terms', { ...cgTemplateData.terms, currency: nextCurrency });
                updateCgTemplateData(
                  'products',
                  cgTemplateData.products.map((item) => ({ ...item, currency: nextCurrency })),
                );
              }}
            >
              <SelectTrigger className="mt-1 h-7 text-xs">
                <SelectValue placeholder="选择币种" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CNY">人民币 (CNY)</SelectItem>
                <SelectItem value="USD">美元 (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-[11px] text-gray-500">要求交期</Label>
            <Input
              value={cgTemplateData.requiredDeliveryDate}
              onChange={(e) => updateCgTemplateData('requiredDeliveryDate', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="mb-3 text-xs font-semibold text-gray-900">采购方信息</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">公司名称</Label>
            <Input
              value={cgTemplateData.buyer.name}
              onChange={(e) => updateCgTemplateData('buyer', { ...cgTemplateData.buyer, name: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">英文名称</Label>
            <Input
              value={cgTemplateData.buyer.nameEn}
              onChange={(e) => updateCgTemplateData('buyer', { ...cgTemplateData.buyer, nameEn: e.target.value })}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-gray-500">联系人</Label>
              <Input
                value={cgTemplateData.buyer.contactPerson}
                onChange={(e) =>
                  updateCgTemplateData('buyer', { ...cgTemplateData.buyer, contactPerson: e.target.value })
                }
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">邮箱</Label>
              <Input
                value={cgTemplateData.buyer.email}
                onChange={(e) => updateCgTemplateData('buyer', { ...cgTemplateData.buyer, email: e.target.value })}
                className="mt-1 h-7 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="mb-3 text-xs font-semibold text-gray-900">供应商信息</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">供应商名称</Label>
            <Input
              value={cgTemplateData.supplier.companyName}
              onChange={(e) =>
                updateCgTemplateData('supplier', { ...cgTemplateData.supplier, companyName: e.target.value })
              }
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">供应商地址</Label>
            <Textarea
              value={cgTemplateData.supplier.address}
              onChange={(e) =>
                updateCgTemplateData('supplier', { ...cgTemplateData.supplier, address: e.target.value })
              }
              className="mt-1 min-h-[52px] text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-gray-500">联系人</Label>
              <Input
                value={cgTemplateData.supplier.contactPerson}
                onChange={(e) =>
                  updateCgTemplateData('supplier', {
                    ...cgTemplateData.supplier,
                    contactPerson: e.target.value,
                  })
                }
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">邮箱</Label>
              <Input
                value={cgTemplateData.supplier.email}
                onChange={(e) =>
                  updateCgTemplateData('supplier', { ...cgTemplateData.supplier, email: e.target.value })
                }
                className="mt-1 h-7 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="mb-3 text-xs font-semibold text-gray-900">产品清单</p>
        <div className="space-y-3">
          {cgTemplateData.products.map((product, index) => (
            <div key={`${product.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
              <div className="mb-2 text-[11px] font-semibold text-gray-700">产品 {product.no}</div>
              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] text-gray-500">物料编码</Label>
                  <Input
                    value={product.itemCode || ''}
                    onChange={(e) =>
                      updateCgTemplateData(
                        'products',
                        cgTemplateData.products.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, itemCode: e.target.value } : item
                        )
                      )
                    }
                    className="mt-1 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-gray-500">产品描述</Label>
                  <Textarea
                    value={product.description}
                    onChange={(e) =>
                      updateCgTemplateData(
                        'products',
                        cgTemplateData.products.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, description: e.target.value } : item
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
                      value={product.quantity}
                      onChange={(e) =>
                        updateCgTemplateData(
                          'products',
                          cgTemplateData.products.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  quantity: Number(e.target.value) || 0,
                                  amount: (Number(e.target.value) || 0) * item.unitPrice,
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
                      value={product.unitPrice}
                      onChange={(e) =>
                        updateCgTemplateData(
                          'products',
                          cgTemplateData.products.map((item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  unitPrice: Number(e.target.value) || 0,
                                  amount: (Number(e.target.value) || 0) * item.quantity,
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
        title="采购明细表格列设置"
        description="可直接修改 CG 采购明细表的列标题和列宽百分比。保存草稿或发布版本后会一起保存。"
        columns={productTableColumns}
        onMove={moveCgProductTableColumn}
        onPatch={updateCgProductTableColumn}
      />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="mb-3 text-xs font-semibold text-gray-900">关键条款</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">付款条款</Label>
            <Textarea
              value={cgTemplateData.terms.paymentTerms}
              onChange={(e) =>
                updateCgTemplateData('terms', { ...cgTemplateData.terms, paymentTerms: e.target.value })
              }
              className="mt-1 min-h-[52px] text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">交货条款</Label>
            <Input
              value={cgTemplateData.terms.deliveryTerms}
              onChange={(e) =>
                updateCgTemplateData('terms', { ...cgTemplateData.terms, deliveryTerms: e.target.value })
              }
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">交货地址</Label>
            <Textarea
              value={cgTemplateData.terms.deliveryAddress}
              onChange={(e) =>
                updateCgTemplateData('terms', { ...cgTemplateData.terms, deliveryAddress: e.target.value })
              }
              className="mt-1 min-h-[56px] text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">包装要求</Label>
            <Textarea
              value={cgTemplateData.terms.packaging || ''}
              onChange={(e) =>
                updateCgTemplateData('terms', { ...cgTemplateData.terms, packaging: e.target.value })
              }
              className="mt-1 min-h-[56px] text-xs"
            />
          </div>
        </div>
      </div>
    </>
  );
}
