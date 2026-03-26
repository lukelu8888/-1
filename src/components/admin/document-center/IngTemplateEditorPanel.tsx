import React from 'react';

import type { CustomerInquiryData } from '../../documents/templates/CustomerInquiryDocument';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { InquiryRequirementsBindingPanel } from './InquiryRequirementsBindingPanel';
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

interface RequirementField {
  key: string;
  label: string;
}

interface IngTemplateEditorPanelProps {
  publishedVersion?: string;
  draftVersion?: string;
  currentLoadedText?: string | null;
  inquiryTemplateVersionNote: string;
  setInquiryTemplateVersionNote: (value: string) => void;
  onRestoreLatest: () => void;
  restoreDisabled: boolean;
  versionHistoryPanel: React.ReactNode;
  inquiryTemplateLayout: WorkspacePreviewLayout;
  updateInquiryTemplateLayout: <K extends keyof WorkspacePreviewLayout>(
    field: K,
    value: WorkspacePreviewLayout[K]
  ) => void;
  inquiryTemplateData: CustomerInquiryData;
  updateInquiryTemplateData: <K extends keyof CustomerInquiryData>(
    field: K,
    value: CustomerInquiryData[K]
  ) => void;
  productTableColumns: TemplateTableColumn[];
  moveInquiryProductTableColumn: (index: number, direction: 'up' | 'down') => void;
  updateInquiryProductTableColumn: (index: number, patch: Partial<TemplateTableColumn>) => void;
  requirementFields: RequirementField[];
  activeRequirementField: string;
  setActiveRequirementField: (value: string) => void;
}

export function IngTemplateEditorPanel({
  publishedVersion,
  draftVersion,
  currentLoadedText,
  inquiryTemplateVersionNote,
  setInquiryTemplateVersionNote,
  onRestoreLatest,
  restoreDisabled,
  versionHistoryPanel,
  inquiryTemplateLayout,
  updateInquiryTemplateLayout,
  inquiryTemplateData,
  updateInquiryTemplateData,
  productTableColumns,
  moveInquiryProductTableColumn,
  updateInquiryProductTableColumn,
  requirementFields,
  activeRequirementField,
  setActiveRequirementField,
}: IngTemplateEditorPanelProps) {
  return (
    <>
      <TemplateVersionActionsCard
        publishedVersion={publishedVersion}
        draftVersion={draftVersion}
        currentLoadedText={currentLoadedText}
        noteField={(
          <div className="mt-2">
            <Label className="text-[11px] text-violet-700">版本备注</Label>
            <Textarea
              value={inquiryTemplateVersionNote}
              onChange={(e) => setInquiryTemplateVersionNote(e.target.value)}
              className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
            />
          </div>
        )}
        onRestoreLatest={onRestoreLatest}
        restoreDisabled={restoreDisabled}
      />
      {versionHistoryPanel}
      <WorkspaceLayoutPanel layout={inquiryTemplateLayout} onChange={updateInquiryTemplateLayout} />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">询价信息</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-gray-500">ING 编号</Label>
            <Input
              value={inquiryTemplateData.inquiryNo}
              onChange={(e) => updateInquiryTemplateData('inquiryNo', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">日期</Label>
            <Input
              value={inquiryTemplateData.inquiryDate}
              onChange={(e) => updateInquiryTemplateData('inquiryDate', e.target.value)}
              className="mt-1 h-7 text-xs"
            />
          </div>
          <div className="col-span-2">
            <Label className="text-[11px] text-gray-500">区域</Label>
            <select
              value={inquiryTemplateData.region}
              onChange={(e) => updateInquiryTemplateData('region', e.target.value as typeof inquiryTemplateData.region)}
              className="mt-1 h-7 w-full rounded-md border border-input bg-background px-3 text-xs"
            >
              <option value="NA">North America</option>
              <option value="SA">South America</option>
              <option value="EU">Europe & Africa</option>
            </select>
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">客户信息</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">客户名称</Label>
            <Input
              value={inquiryTemplateData.customer.companyName}
              onChange={(e) =>
                updateInquiryTemplateData('customer', {
                  ...inquiryTemplateData.customer,
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
                value={inquiryTemplateData.customer.contactPerson}
                onChange={(e) =>
                  updateInquiryTemplateData('customer', {
                    ...inquiryTemplateData.customer,
                    contactPerson: e.target.value,
                  })
                }
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">职位</Label>
              <Input
                value={inquiryTemplateData.customer.position || ''}
                onChange={(e) =>
                  updateInquiryTemplateData('customer', {
                    ...inquiryTemplateData.customer,
                    position: e.target.value,
                  })
                }
                className="mt-1 h-7 text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-gray-500">邮箱</Label>
              <Input
                value={inquiryTemplateData.customer.email}
                onChange={(e) =>
                  updateInquiryTemplateData('customer', {
                    ...inquiryTemplateData.customer,
                    email: e.target.value,
                  })
                }
                className="mt-1 h-7 text-xs"
              />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">电话</Label>
              <Input
                value={inquiryTemplateData.customer.phone || ''}
                onChange={(e) =>
                  updateInquiryTemplateData('customer', {
                    ...inquiryTemplateData.customer,
                    phone: e.target.value,
                  })
                }
                className="mt-1 h-7 text-xs"
              />
            </div>
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">地址</Label>
            <Textarea
              value={inquiryTemplateData.customer.address || ''}
              onChange={(e) =>
                updateInquiryTemplateData('customer', {
                  ...inquiryTemplateData.customer,
                  address: e.target.value,
                })
              }
              className="mt-1 min-h-[64px] text-xs"
            />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">产品需求</p>
        <div className="space-y-3">
          {inquiryTemplateData.products.map((product, index) => (
            <div key={`${product.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
              <div className="mb-2 text-[11px] font-semibold text-gray-700">产品 {product.no}</div>
              <div className="space-y-2">
                <div>
                  <Label className="text-[11px] text-gray-500">产品名称</Label>
                  <Input
                    value={product.productName}
                    onChange={(e) =>
                      updateInquiryTemplateData(
                        'products',
                        inquiryTemplateData.products.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, productName: e.target.value } : row
                        )
                      )
                    }
                    className="mt-1 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-gray-500">规格</Label>
                  <Textarea
                    value={product.specification || ''}
                    onChange={(e) =>
                      updateInquiryTemplateData(
                        'products',
                        inquiryTemplateData.products.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, specification: e.target.value } : row
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
                        updateInquiryTemplateData(
                          'products',
                          inquiryTemplateData.products.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, quantity: Number(e.target.value) || 0 } : row
                          )
                        )
                      }
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-gray-500">目标价</Label>
                    <Input
                      type="number"
                      value={product.targetPrice || 0}
                      onChange={(e) =>
                        updateInquiryTemplateData(
                          'products',
                          inquiryTemplateData.products.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, targetPrice: Number(e.target.value) || 0 } : row
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
        title="产品表格列设置"
        description="可直接修改 ING 产品表的列标题和列宽百分比。保存草稿或发布版本后会一起保存。"
        columns={productTableColumns}
        onMove={moveInquiryProductTableColumn}
        onPatch={updateInquiryProductTableColumn}
      />
      <InquiryRequirementsBindingPanel
        fields={requirementFields}
        requirements={inquiryTemplateData.requirements}
        activeField={activeRequirementField}
        onActiveFieldChange={setActiveRequirementField}
      />
    </>
  );
}
