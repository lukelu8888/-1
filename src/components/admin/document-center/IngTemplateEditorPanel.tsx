import React from 'react';

import {
  CUSTOMER_INQUIRY_FONT_FAMILY_OPTIONS,
  normalizeCustomerInquiryTypography,
  normalizeCustomerInquiryRequirementFields,
  type CustomerInquiryData,
  type CustomerInquiryTypographySettings,
} from '../../documents/templates/CustomerInquiryDocument';
import { CustomerTradingRequirementsForm } from '../../dashboard/CustomerTradingRequirementsForm';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { TemplateTableColumnsPanel } from './TemplateTableColumnsPanel';
import { TemplateTypographyPanel } from './TemplateTypographyPanel';
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

const INQUIRY_TYPOGRAPHY_FIELDS: Array<{
  sizeKey: keyof CustomerInquiryTypographySettings;
  fontFamilyKey: keyof CustomerInquiryTypographySettings;
  label: string;
}> = [
  { sizeKey: 'headerTitlePt', fontFamilyKey: 'headerTitleFontFamily', label: '主标题' },
  { sizeKey: 'headerMetaPt', fontFamilyKey: 'headerMetaFontFamily', label: '右上角信息表' },
  { sizeKey: 'sectionTitlePt', fontFamilyKey: 'sectionTitleFontFamily', label: '各区块标题' },
  { sizeKey: 'customerSectionHeaderPt', fontFamilyKey: 'customerSectionHeaderFontFamily', label: '客户信息栏头' },
  { sizeKey: 'customerBodyPt', fontFamilyKey: 'customerBodyFontFamily', label: '客户信息正文' },
  { sizeKey: 'productHeaderPt', fontFamilyKey: 'productHeaderFontFamily', label: '产品表头' },
  { sizeKey: 'productBodyPt', fontFamilyKey: 'productBodyFontFamily', label: '产品表正文' },
  { sizeKey: 'productSpecPt', fontFamilyKey: 'productSpecFontFamily', label: '产品规格补充文案' },
  { sizeKey: 'productSummaryPt', fontFamilyKey: 'productSummaryFontFamily', label: '产品金额/合计' },
  { sizeKey: 'requirementIndexPt', fontFamilyKey: 'requirementIndexFontFamily', label: '条款编号' },
  { sizeKey: 'requirementLabelPt', fontFamilyKey: 'requirementLabelFontFamily', label: '条款标题' },
  { sizeKey: 'requirementValuePt', fontFamilyKey: 'requirementValueFontFamily', label: '条款内容' },
  { sizeKey: 'footerPt', fontFamilyKey: 'footerFontFamily', label: '页脚说明' },
];

interface ValidationSummary {
  ok: boolean;
  errors: string[];
  warnings: string[];
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
  publishValidation?: ValidationSummary;
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
  publishValidation,
}: IngTemplateEditorPanelProps) {
  const typography = normalizeCustomerInquiryTypography(inquiryTemplateData.templateSettings?.typography);
  const requirementFormValue = normalizeCustomerInquiryRequirementFields(inquiryTemplateData.requirements);

  const updateTypography = <K extends keyof CustomerInquiryTypographySettings>(
    key: K,
    value: CustomerInquiryTypographySettings[K],
  ) => {
    updateInquiryTemplateData('templateSettings', {
      ...inquiryTemplateData.templateSettings,
      typography: {
        ...typography,
        [key]: value,
      },
    });
  };

  const updateProduct = (index: number, patch: Partial<CustomerInquiryData['products'][number]>) => {
    updateInquiryTemplateData(
      'products',
      inquiryTemplateData.products.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row)),
    );
  };

  const updateRequirements = (nextValue: ReturnType<typeof normalizeCustomerInquiryRequirementFields>) => {
    updateInquiryTemplateData('requirements', {
      ...nextValue,
      certifications: nextValue.certifications
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    });
  };

  return (
    <>
      <TemplateVersionActionsCard
        publishedVersion={publishedVersion}
        draftVersion={draftVersion}
        currentLoadedText={currentLoadedText}
        validationPanel={publishValidation ? (
          <div className={`mt-2 rounded-md border px-2.5 py-2 text-[11px] ${
            publishValidation.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-amber-200 bg-amber-50 text-amber-900'
          }`}>
            <p className="font-semibold">
              {publishValidation.ok ? '发布前预检：通过' : '发布前预检：需处理'}
            </p>
            {publishValidation.errors.length > 0 ? (
              <p className="mt-1 leading-5">阻断项：{publishValidation.errors[0]}</p>
            ) : null}
            {publishValidation.errors.length === 0 && publishValidation.warnings.length > 0 ? (
              <p className="mt-1 leading-5">提醒：{publishValidation.warnings[0]}</p>
            ) : null}
            {publishValidation.ok && publishValidation.warnings.length === 0 ? (
              <p className="mt-1 leading-5">列宽与表头配置满足当前 ING 发布要求。</p>
            ) : null}
          </div>
        ) : null}
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
            <div key={`${product.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2">
              <div className="mb-2 text-[11px] font-semibold text-gray-700">产品 {product.no}</div>
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-gray-500">序号</Label>
                    <Input
                      type="number"
                      value={product.no}
                      onChange={(e) => updateProduct(index, { no: Number(e.target.value) || index + 1 })}
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-gray-500">型号</Label>
                    <Input
                      value={product.modelNo || ''}
                      onChange={(e) => updateProduct(index, { modelNo: e.target.value })}
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] text-gray-500">产品名称</Label>
                  <Input
                    value={product.productName}
                    onChange={(e) => updateProduct(index, { productName: e.target.value })}
                    className="mt-1 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-gray-500">图片链接</Label>
                  <Input
                    value={product.imageUrl || ''}
                    onChange={(e) => updateProduct(index, { imageUrl: e.target.value })}
                    className="mt-1 h-7 text-xs"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-gray-500">规格</Label>
                  <Textarea
                    value={product.specification || ''}
                    onChange={(e) => updateProduct(index, { specification: e.target.value })}
                    className="mt-1 min-h-[48px] text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-gray-500">数量</Label>
                    <Input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => updateProduct(index, { quantity: Number(e.target.value) || 0 })}
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-gray-500">单位</Label>
                    <Input
                      value={product.unit || ''}
                      onChange={(e) => updateProduct(index, { unit: e.target.value })}
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-[11px] text-gray-500">目标价</Label>
                    <Input
                      type="number"
                      value={product.targetPrice || 0}
                      onChange={(e) => updateProduct(index, { targetPrice: Number(e.target.value) || 0 })}
                      className="mt-1 h-7 text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] text-gray-500">币种</Label>
                    <Input
                      value={product.currency || 'USD'}
                      onChange={(e) => updateProduct(index, { currency: e.target.value || 'USD' })}
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
        columns={productTableColumns}
        onMove={moveInquiryProductTableColumn}
        onPatch={updateInquiryProductTableColumn}
      />
      <TemplateTypographyPanel
        title="字体设置"
        values={typography}
        fields={INQUIRY_TYPOGRAPHY_FIELDS}
        fontFamilyOptions={CUSTOMER_INQUIRY_FONT_FAMILY_OPTIONS}
        onChange={updateTypography}
      />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="mb-3 text-xs font-semibold text-gray-900">询价条款</p>
        <CustomerTradingRequirementsForm
          value={requirementFormValue}
          onChange={updateRequirements}
          compact
          className="space-y-3"
        />
      </div>
    </>
  );
}
