import React from 'react';
import { A4PageContainer, A4PrintStyles } from '../A4PageContainer';
import type { OemFactoryFacingDocumentData } from '../../../utils/documentDataAdapters';

interface OemFactoryFacingDocumentProps {
  data: OemFactoryFacingDocumentData;
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-[140px_1fr] gap-3 border-b border-slate-200 py-2 text-[11px]">
    <div className="font-semibold uppercase tracking-[0.12em] text-slate-500">{label}</div>
    <div className="text-slate-800">{value || '-'}</div>
  </div>
);

const formatMoldLifetime = (value?: string) => {
  if (!value) return '-';
  if (value === '10000') return '10k cycles';
  if (value === '100000') return '100k cycles';
  if (value === '300000') return '300k cycles';
  return value;
};

export function OemFactoryFacingDocument({ data }: OemFactoryFacingDocumentProps) {
  return (
    <>
      <A4PrintStyles />
      <A4PageContainer enablePagination>
        <div className="sales-contract-content text-slate-900">
          <header className="border-b-2 border-slate-900 pb-5">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500">Factory Facing OEM Package</p>
                <h1 className="mt-2 text-[24px] font-bold tracking-tight text-slate-950">Procurement Department</h1>
                <p className="mt-2 text-[11px] leading-5 text-slate-600">
                  Internal replacement version for factory communication. Customer identity has been removed and all
                  customer part numbers have been converted to internal MODEL# / SKU.
                </p>
              </div>
              <div className="min-w-[210px] rounded-lg border border-slate-200 bg-slate-50 p-4">
                <InfoRow label="ING No." value={data.inquiryNumber} />
                <InfoRow label="Issue Date" value={data.issueDate} />
                <InfoRow label="Brand" value={data.internalCompany.brandName} />
                <InfoRow label="Contact" value={data.internalCompany.contactPerson} />
              </div>
            </div>
          </header>

          <section className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-4">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-900">Issuing Company</h2>
              <div className="mt-3 space-y-2 text-[11px] leading-5 text-slate-700">
                <p>{data.internalCompany.companyName}</p>
                <p>{data.internalCompany.address}</p>
                <p>{data.internalCompany.email}</p>
                <p>{data.internalCompany.phone}</p>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 p-4">
              <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-900">Project Control</h2>
              <div className="mt-3 space-y-2 text-[11px] leading-5 text-slate-700">
                <p>Project: {data.internalCompany.projectName}</p>
                <p>Owner Department: {data.ownerDepartment}</p>
                <p>Customer Identity: Hidden</p>
                <p>Factory version can be used only for internal procurement and factory coordination.</p>
              </div>
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 p-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-900">Business Requirement Note</h2>
            <p className="mt-3 whitespace-pre-wrap text-[11px] leading-6 text-slate-700">{data.businessRequirementNote || '-'}</p>
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 p-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-900">Tooling / Mold Parameters</h2>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <InfoRow label="Tooling Cost" value={data.tooling.toolingCostInvolved ? 'Yes' : 'No'} />
              <InfoRow label="First Order Qty" value={data.tooling.firstOrderQuantity} />
              <InfoRow label="Annual Qty" value={data.tooling.annualQuantity} />
              <InfoRow label="Qty within 3 Years" value={data.tooling.quantityWithinThreeYears} />
              <InfoRow label="Mold Lifetime" value={formatMoldLifetime(data.tooling.moldLifetime)} />
            </div>
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 p-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-900">OEM Technical Files</h2>
            <table className="product-table mt-4 w-full border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-700">
                  <th className="border border-slate-300 px-2 py-2 font-semibold">Code</th>
                  <th className="border border-slate-300 px-2 py-2 font-semibold">File</th>
                  <th className="border border-slate-300 px-2 py-2 font-semibold">Description</th>
                  <th className="border border-slate-300 px-2 py-2 font-semibold">MODEL#</th>
                  <th className="border border-slate-300 px-2 py-2 font-semibold">SKU</th>
                  <th className="border border-slate-300 px-2 py-2 font-semibold">Factory PN</th>
                </tr>
              </thead>
              <tbody>
                {data.files.map((file) => (
                  <tr key={file.id}>
                    <td className="border border-slate-300 px-2 py-2 align-top">{file.factoryFacingCode}</td>
                    <td className="border border-slate-300 px-2 py-2 align-top">{file.fileName}</td>
                    <td className="border border-slate-300 px-2 py-2 align-top">{file.description || '-'}</td>
                    <td className="border border-slate-300 px-2 py-2 align-top">{file.internalModelNumber || '-'}</td>
                    <td className="border border-slate-300 px-2 py-2 align-top">{file.internalSku || '-'}</td>
                    <td className="border border-slate-300 px-2 py-2 align-top font-semibold text-slate-900">{file.factoryFacingPartNumber}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 p-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-900">Part Number Mapping Record</h2>
            <table className="mt-4 w-full border-collapse text-[10.5px]">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-700">
                  <th className="border border-slate-300 px-2 py-2 font-semibold">Customer PN</th>
                  <th className="border border-slate-300 px-2 py-2 font-semibold">MODEL#</th>
                  <th className="border border-slate-300 px-2 py-2 font-semibold">SKU</th>
                  <th className="border border-slate-300 px-2 py-2 font-semibold">Factory PN</th>
                  <th className="border border-slate-300 px-2 py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.partNumberMappings.map((mapping) => (
                  <tr key={`${mapping.customerPartNumber}-${mapping.internalSku}`}>
                    <td className="border border-slate-300 px-2 py-2">{mapping.customerPartNumber}</td>
                    <td className="border border-slate-300 px-2 py-2">{mapping.internalModelNumber}</td>
                    <td className="border border-slate-300 px-2 py-2">{mapping.internalSku}</td>
                    <td className="border border-slate-300 px-2 py-2 font-semibold text-slate-900">{mapping.factoryFacingPartNumber}</td>
                    <td className="border border-slate-300 px-2 py-2">{mapping.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="mt-6 rounded-lg border border-slate-200 p-4">
            <h2 className="text-[13px] font-bold uppercase tracking-[0.14em] text-slate-900">Redaction Log</h2>
            <div className="mt-4 space-y-3">
              {data.redactionSummary.map((item) => (
                <div key={item.field} className="grid grid-cols-[140px_1fr_1fr] gap-3 border-b border-slate-200 pb-3 text-[10.5px]">
                  <div className="font-semibold text-slate-800">{item.field}</div>
                  <div className="text-slate-500">{item.originalValue || '-'}</div>
                  <div className="font-medium text-slate-900">{item.replacementValue}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </A4PageContainer>
    </>
  );
}
