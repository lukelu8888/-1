import React from 'react';

import type { SalesContractData } from '../../documents/templates/SalesContractDocument';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { TemplateTableColumnsPanel } from './TemplateTableColumnsPanel';
import { TemplateVersionActionsCard } from './TemplateVersionActionsCard';
import { WorkspaceLayoutPanel } from './WorkspaceLayoutPanel';
import { buildPaymentTermsText } from '../../../lib/paymentFlow';

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

interface ScTemplateEditorPanelProps {
  publishedVersion?: string;
  draftVersion?: string;
  scTemplateVersionNote: string;
  setScTemplateVersionNote: (value: string) => void;
  onRestoreLatest: () => void;
  restoreDisabled: boolean;
  versionHistoryPanel: React.ReactNode;
  scTemplateLayout: WorkspacePreviewLayout;
  updateScTemplateLayout: <K extends keyof WorkspacePreviewLayout>(
    field: K,
    value: WorkspacePreviewLayout[K]
  ) => void;
  scTemplateData: SalesContractData;
  updateScTemplateData: <K extends keyof SalesContractData>(
    field: K,
    value: SalesContractData[K]
  ) => void;
  productTableColumns: TemplateTableColumn[];
  moveScProductTableColumn: (index: number, direction: 'up' | 'down') => void;
  updateScProductTableColumn: (index: number, patch: Partial<TemplateTableColumn>) => void;
}

export function ScTemplateEditorPanel({
  publishedVersion,
  draftVersion,
  scTemplateVersionNote,
  setScTemplateVersionNote,
  onRestoreLatest,
  restoreDisabled,
  versionHistoryPanel,
  scTemplateLayout,
  updateScTemplateLayout,
  scTemplateData,
  updateScTemplateData,
  productTableColumns,
  moveScProductTableColumn,
  updateScProductTableColumn,
}: ScTemplateEditorPanelProps) {
  return (
    <>
      <TemplateVersionActionsCard
        publishedVersion={publishedVersion}
        draftVersion={draftVersion}
        noteField={(
          <div className="mt-2">
            <Label className="text-[11px] text-violet-700">版本备注</Label>
            <Textarea
              value={scTemplateVersionNote}
              onChange={(e) => setScTemplateVersionNote(e.target.value)}
              className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
            />
          </div>
        )}
        onRestoreLatest={onRestoreLatest}
        restoreDisabled={restoreDisabled}
      />
      {versionHistoryPanel}
      <WorkspaceLayoutPanel layout={scTemplateLayout} onChange={updateScTemplateLayout} />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">合同信息</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-gray-500">合同编号</Label>
            <Input
              value={scTemplateData.contractNo}
              onChange={(e) => updateScTemplateData('contractNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">合同日期</Label>
            <Input
              value={scTemplateData.contractDate}
              onChange={(e) => updateScTemplateData('contractDate', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">报价单号</Label>
            <Input
              value={scTemplateData.quotationNo || ''}
              onChange={(e) => updateScTemplateData('quotationNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">区域</Label>
            <Input
              value={scTemplateData.region}
              onChange={(e) =>
                updateScTemplateData('region', (e.target.value || 'NA') as SalesContractData['region'])
              }
              className="mt-1 h-7 text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">卖方信息</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">公司名称</Label>
            <Input
              value={scTemplateData.seller.nameEn}
              onChange={(e) =>
                updateScTemplateData('seller', { ...scTemplateData.seller, nameEn: e.target.value })
              }
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">地址</Label>
            <Textarea
              value={scTemplateData.seller.addressEn}
              onChange={(e) =>
                updateScTemplateData('seller', { ...scTemplateData.seller, addressEn: e.target.value })
              }
              className="mt-1 min-h-[52px] text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-gray-500">电话</Label>
              <Input
                value={scTemplateData.seller.tel}
                onChange={(e) =>
                  updateScTemplateData('seller', { ...scTemplateData.seller, tel: e.target.value })
                }
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">邮箱</Label>
              <Input
                value={scTemplateData.seller.email}
                onChange={(e) =>
                  updateScTemplateData('seller', { ...scTemplateData.seller, email: e.target.value })
                }
                className="mt-1 h-7 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">买方信息</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">客户名称</Label>
            <Input
              value={scTemplateData.buyer.companyName}
              onChange={(e) =>
                updateScTemplateData('buyer', { ...scTemplateData.buyer, companyName: e.target.value })
              }
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">客户地址</Label>
            <Textarea
              value={scTemplateData.buyer.address}
              onChange={(e) =>
                updateScTemplateData('buyer', { ...scTemplateData.buyer, address: e.target.value })
              }
              className="mt-1 min-h-[52px] text-xs"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-gray-500">联系人</Label>
              <Input
                value={scTemplateData.buyer.contactPerson}
                onChange={(e) =>
                  updateScTemplateData('buyer', {
                    ...scTemplateData.buyer,
                    contactPerson: e.target.value,
                  })
                }
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">邮箱</Label>
              <Input
                value={scTemplateData.buyer.email}
                onChange={(e) =>
                  updateScTemplateData('buyer', { ...scTemplateData.buyer, email: e.target.value })
                }
                className="mt-1 h-7 text-xs"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">产品清单</p>
        <div className="space-y-3">
          {scTemplateData.products.map((product, index) => (
            <div key={`${product.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
              <div className="mb-2 text-[11px] font-semibold text-gray-700">产品 {product.no}</div>
              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] text-gray-500">产品描述</Label>
                  <Textarea
                    value={product.description}
                    onChange={(e) =>
                      updateScTemplateData(
                        'products',
                        scTemplateData.products.map((item, itemIndex) =>
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
                        updateScTemplateData(
                          'products',
                          scTemplateData.products.map((item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, quantity: Number(e.target.value) || 0 }
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
                        updateScTemplateData(
                          'products',
                          scTemplateData.products.map((item, itemIndex) =>
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
        title="ARTICLE 1 表格列设置"
        description="可直接修改 SC 产品表的列标题和列宽百分比。保存草稿或发布版本后会一起保存。"
        columns={productTableColumns}
        onMove={moveScProductTableColumn}
        onPatch={updateScProductTableColumn}
      />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">关键条款</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">贸易条款</Label>
            <Input
              value={scTemplateData.terms.tradeTerms}
              onChange={(e) =>
                updateScTemplateData('terms', { ...scTemplateData.terms, tradeTerms: e.target.value })
              }
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">付款条款</Label>
            <div className="mt-1 flex flex-wrap gap-2">
              {[
                ['定金+出货前余款', buildPaymentTermsText('tt_deposit_balance_before_shipment', 'before_shipment')],
                ['定金+见提单余款', buildPaymentTermsText('tt_deposit_balance_against_bl', 'after_shipment')],
                ['定金+信用证', buildPaymentTermsText('deposit_plus_lc', 'lc_ready')],
                ['100%信用证', buildPaymentTermsText('lc_100', 'lc_ready')],
              ].map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    updateScTemplateData('terms', {
                      ...scTemplateData.terms,
                      paymentTerms: String(value),
                    })
                  }
                  className="rounded border border-gray-300 px-2 py-1 text-[10px] text-gray-600 hover:bg-gray-50"
                >
                  {label}
                </button>
              ))}
            </div>
            <Textarea
              value={scTemplateData.terms.paymentTerms}
              onChange={(e) =>
                updateScTemplateData('terms', {
                  ...scTemplateData.terms,
                  paymentTerms: e.target.value,
                })
              }
              className="mt-1 min-h-[52px] text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">交期</Label>
            <Input
              value={scTemplateData.terms.deliveryTime}
              onChange={(e) =>
                updateScTemplateData('terms', { ...scTemplateData.terms, deliveryTime: e.target.value })
              }
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">包装</Label>
            <Textarea
              value={scTemplateData.terms.packing}
              onChange={(e) =>
                updateScTemplateData('terms', { ...scTemplateData.terms, packing: e.target.value })
              }
              className="mt-1 min-h-[56px] text-xs"
            />
          </div>
        </div>
      </div>
    </>
  );
}
