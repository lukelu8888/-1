import React from 'react';

import type { CommercialInvoiceData } from '../../documents/templates/CommercialInvoiceDocument';
import {
  prepareCustomerInquiryDocumentData,
  type CustomerInquiryData,
} from '../../documents/templates/CustomerInquiryDocument';
import type { PackingListData } from '../../documents/templates/PackingListDocument';
import type { ProformaInvoiceData } from '../../documents/templates/ProformaInvoiceDocument';
import type { PurchaseOrderData } from '../../documents/templates/PurchaseOrderDocument';
import type { QuotationData } from '../../documents/templates/QuotationDocument';
import type {
  QuoteRequirementDocumentData,
  QuoteRequirementTextOverrides,
} from '../../documents/templates/QuoteRequirementDocument';
import type { SalesContractData } from '../../documents/templates/SalesContractDocument';
import type { StatementOfAccountData } from '../../documents/templates/StatementOfAccountDocument';
import type { SupplierQuotationData } from '../../documents/templates/SupplierQuotationDocument';
import type { XJData } from '../../documents/templates/XJDocument';
import { CommercialInvoiceDocumentA4Pages } from '../../documents/templates/paginated/CommercialInvoiceDocumentA4';
import { CustomerInquiryDocumentA4Pages } from '../../documents/templates/paginated/CustomerInquiryDocumentA4';
import { PackingListDocumentA4Pages } from '../../documents/templates/paginated/PackingListDocumentA4';
import { ProformaInvoiceDocumentA4Pages } from '../../documents/templates/paginated/ProformaInvoiceDocumentA4';
import { PurchaseOrderDocumentA4Pages } from '../../documents/templates/paginated/PurchaseOrderDocumentA4';
import { QuotationDocumentA4Pages } from '../../documents/templates/paginated/QuotationDocumentA4';
import { QuoteRequirementDocumentA4Pages } from '../../documents/templates/paginated/QuoteRequirementDocumentA4';
import { SalesContractDocumentA4Pages } from '../../documents/templates/paginated/SalesContractDocumentA4';
import { StatementOfAccountDocumentA4Pages } from '../../documents/templates/paginated/StatementOfAccountDocumentA4';
import { SupplierQuotationDocumentA4Pages } from '../../documents/templates/paginated/SupplierQuotationDocumentA4';
import { XJDocumentA4Pages } from '../../documents/templates/paginated/XJDocumentA4';

interface TemplateDescriptor {
  id: string;
  icon: React.ReactNode;
  name: string;
  nameEn: string;
  description: string;
  usedInModules: Array<string | { description?: string; module?: string; subModule?: string }>;
}

interface WorkspaceMetaLike {
  currentVersion: string;
  status: string;
}

interface QuotationPreviewLayoutLike {
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

export interface TemplatePreviewContentProps {
  mode: 'hub' | 'editor';
  activeTemplate: TemplateDescriptor;
  qrTemplateData: QuoteRequirementDocumentData;
  qrTemplateTextOverrides: QuoteRequirementTextOverrides;
  prTemplateData: QuoteRequirementDocumentData;
  prTemplateTextOverrides: QuoteRequirementTextOverrides;
  xjTemplateData: XJData;
  scTemplateData: SalesContractData;
  cgTemplateData: PurchaseOrderData;
  bjTemplateData: SupplierQuotationData;
  piTemplateData: ProformaInvoiceData;
  ciTemplateData: CommercialInvoiceData;
  plTemplateData: PackingListData;
  soaTemplateData: StatementOfAccountData;
  inquiryTemplateData: CustomerInquiryData;
  quotationTemplateData: QuotationData;
  quotationTemplateLayout: QuotationPreviewLayoutLike;
  resolvedActiveTemplateMeta?: WorkspaceMetaLike | null;
  publishStatusLabel?: string;
}

export function TemplatePreviewContent({
  mode,
  activeTemplate,
  qrTemplateData,
  qrTemplateTextOverrides,
  prTemplateData,
  prTemplateTextOverrides,
  xjTemplateData,
  scTemplateData,
  cgTemplateData,
  bjTemplateData,
  piTemplateData,
  ciTemplateData,
  plTemplateData,
  soaTemplateData,
  inquiryTemplateData,
  quotationTemplateData,
  quotationTemplateLayout,
  resolvedActiveTemplateMeta,
  publishStatusLabel,
}: TemplatePreviewContentProps) {
  if (activeTemplate.id === 'qr') {
    return <QuoteRequirementDocumentA4Pages data={qrTemplateData} textOverrides={qrTemplateTextOverrides} />;
  }
  if (activeTemplate.id === 'pr') {
    return <QuoteRequirementDocumentA4Pages data={prTemplateData} textOverrides={prTemplateTextOverrides} />;
  }
  if (activeTemplate.id === 'xj') {
    return <XJDocumentA4Pages data={xjTemplateData} />;
  }
  if (activeTemplate.id === 'sc') {
    return <SalesContractDocumentA4Pages data={scTemplateData} />;
  }
  if (activeTemplate.id === 'cg') {
    return <PurchaseOrderDocumentA4Pages data={cgTemplateData} />;
  }
  if (activeTemplate.id === 'bj') {
    return <SupplierQuotationDocumentA4Pages data={bjTemplateData} />;
  }
  if (activeTemplate.id === 'pi') {
    return <ProformaInvoiceDocumentA4Pages data={piTemplateData} />;
  }
  if (activeTemplate.id === 'ci') {
    return <CommercialInvoiceDocumentA4Pages data={ciTemplateData} />;
  }
  if (activeTemplate.id === 'pl') {
    return <PackingListDocumentA4Pages data={plTemplateData} />;
  }
  if (activeTemplate.id === 'soa') {
    return <StatementOfAccountDocumentA4Pages data={soaTemplateData} />;
  }
  if (activeTemplate.id === 'ing') {
    const preparedInquiryTemplateData = prepareCustomerInquiryDocumentData(inquiryTemplateData);
    return preparedInquiryTemplateData ? <CustomerInquiryDocumentA4Pages data={preparedInquiryTemplateData} /> : null;
  }
  if (activeTemplate.id === 'qt') {
    return <QuotationDocumentA4Pages data={quotationTemplateData} layout={quotationTemplateLayout} />;
  }

  if (mode === 'hub') {
    return (
      <div className="bg-white shadow-lg rounded" style={{ width: '210mm', minHeight: '297mm' }}>
        <div className="flex flex-col items-center justify-center h-full min-h-[297mm] text-center p-12">
          <div className="text-6xl mb-6">{activeTemplate.icon}</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">{activeTemplate.name}</h2>
          <p className="text-base text-gray-500 mb-1">{activeTemplate.nameEn}</p>
          <p className="text-sm text-gray-400 mt-4">{activeTemplate.description}</p>
          <p className="text-xs text-gray-300 mt-8">模板组件接入中，请先在编辑器中完成模板设计</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded bg-white shadow-lg" style={{ width: '210mm', minHeight: '297mm' }}>
      <div className="flex min-h-[297mm] flex-col p-10 text-gray-800">
        <div className="flex items-start justify-between border-b-2 border-gray-900 pb-4">
          <div>
            <div className="text-3xl">{activeTemplate.icon}</div>
            <p className="mt-3 text-2xl font-bold">{activeTemplate.name}</p>
            <p className="mt-1 text-sm text-gray-500">{activeTemplate.nameEn}</p>
          </div>
          <div className="rounded border border-gray-300 px-3 py-2 text-right text-xs">
            <p>模板编号：{activeTemplate.id.toUpperCase()}</p>
            <p className="mt-1">当前版本：{resolvedActiveTemplateMeta?.currentVersion || 'v1.0.0'}</p>
            <p className="mt-1">状态：{publishStatusLabel || '未发布'}</p>
          </div>
        </div>
        <div className="mt-8 space-y-5">
          <div>
            <p className="text-sm font-semibold">模板说明</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">{activeTemplate.description}</p>
          </div>
          <div>
            <p className="text-sm font-semibold">调用节点</p>
            <div className="mt-3 space-y-2">
              {activeTemplate.usedInModules.length > 0
                ? activeTemplate.usedInModules.map((mod, idx) => {
                    const label =
                      typeof mod === 'string'
                        ? mod
                        : mod.description || mod.module || `节点 ${idx + 1}`;
                    const key =
                      typeof mod === 'string'
                        ? mod
                        : `${mod.module}-${mod.subModule}-${idx}`;

                    return (
                      <div key={key} className="rounded border border-gray-200 px-3 py-2 text-sm text-gray-600">
                        {idx + 1}. {label}
                      </div>
                    );
                  })
                : <div className="rounded border border-dashed border-gray-200 px-3 py-3 text-sm text-gray-400">暂无调用节点</div>}
            </div>
          </div>
          <div className="rounded bg-gray-50 px-4 py-4 text-sm leading-6 text-gray-600">
            该模板已接入统一工作台外壳，可在这里保持与 QR 一致的左右双栏编辑体验。
            下一步将继续接入专属表单字段、组件渲染和版本持久化。
          </div>
        </div>
      </div>
    </div>
  );
}
