import { Badge } from '../ui/badge';
import { A4DocumentContainer } from '../documents/A4PageContainer';
import { normalizeOemData } from '../../types/oem';
import {
  getCustomerFacingModelNo,
  getFormalBusinessModelNo,
  shouldShowCustomerRefLine,
} from '../../utils/productModelDisplay';

interface OemInquirySummaryProps {
  inquiry: any;
  audience?: 'customer' | 'internal';
}

const statusLabelMap = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  internal_hold: 'Internal Hold',
  ready_for_internal_review: 'Ready for Internal Review',
  released_to_factory: 'Released to Factory',
} as const;

const badgeToneMap = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  in_progress: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  internal_hold: 'bg-slate-100 text-slate-700 border-slate-200',
  ready_for_internal_review: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  released_to_factory: 'bg-green-50 text-green-700 border-green-200',
} as const;

export function OemInquirySummary({ inquiry, audience = 'customer' }: OemInquirySummaryProps) {
  const rawOem = inquiry?.oem || inquiry?.documentDataSnapshot?.oem || inquiry?.document_data_snapshot?.oem;
  const oemProducts = Array.isArray(inquiry?.products)
    ? inquiry.products.filter((product: any) => Boolean(normalizeOemData(product?.oem).enabled))
    : [];

  if (!rawOem && oemProducts.length === 0) return null;

  const oem = normalizeOemData(rawOem);
  if (!oem.enabled && oemProducts.length === 0) return null;

  return (
    <A4DocumentContainer pageWidth="210mm" pageMinHeight="297mm">
      <section className="h-full">
        <div className="mb-4">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 className="text-[18px] font-semibold tracking-[0.08em] text-slate-900">OEM Module Summary</h3>
              <p className="mt-1 text-[12px] leading-5 text-slate-500">
                OEM files, customer references, and requirement notes submitted with this inquiry.
              </p>
            </div>
            {audience === 'internal' ? (
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={`border ${badgeToneMap[oem.internalProcessing.anonymizationStatus]}`}>
                  Anonymization: {statusLabelMap[oem.internalProcessing.anonymizationStatus]}
                </Badge>
                <Badge className={`border ${badgeToneMap[oem.internalProcessing.replacementVersionStatus]}`}>
                  Replacement Version: {statusLabelMap[oem.internalProcessing.replacementVersionStatus]}
                </Badge>
                <Badge className={`border ${badgeToneMap[oem.internalProcessing.factoryForwardingStatus]}`}>
                  Factory Forwarding: {statusLabelMap[oem.internalProcessing.factoryForwardingStatus]}
                </Badge>
              </div>
            ) : null}
          </div>
          <div className="border-t-2 border-b border-gray-400" style={{ borderTopColor: '#000000', borderTopWidth: '3px' }} />
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(240px,0.9fr)]">
          <div className="space-y-5">
          {oemProducts.length > 0 ? (
            <section>
              <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">OEM Items</div>
              <div className="space-y-4">
                {oemProducts.map((product: any, productIndex: number) => {
                  const productOem = normalizeOemData(product.oem);
                  return (
                    <div key={product.id || `oem-item-${productIndex}`} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="text-[14px] font-semibold text-slate-900">
                          {product.productName || `OEM Item ${productIndex + 1}`}
                        </div>
                        <Badge variant="outline" className="border-orange-300 bg-orange-50 text-[10px] text-orange-700">
                          OEM
                        </Badge>
                        {audience === 'customer' ? (
                          <div className="text-[12px] text-slate-500">
                            Model#: {getCustomerFacingModelNo(product)}
                          </div>
                        ) : (
                          <div className="text-[12px] text-slate-500">
                            Model#: {getFormalBusinessModelNo(product)}
                          </div>
                        )}
                        {shouldShowCustomerRefLine(product) ? (
                          <div className="text-[12px] text-slate-500">
                            Customer Ref: {product.customerModelNo}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.85fr)]">
                        <div className="space-y-4">
                          <section>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Specifications / Description</div>
                            <div className="mt-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-[13px] leading-6 text-slate-700 whitespace-pre-wrap">
                              {productOem.overallRequirementNote || 'No OEM description provided.'}
                            </div>
                          </section>

                          <section>
                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Uploaded OEM Files</div>
                            <div className="mt-2 space-y-3">
                              {productOem.files.length > 0 ? productOem.files.map((file, fileIndex) => (
                                <div key={file.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                                  <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                      <div className="truncate text-[13px] font-semibold text-slate-900">
                                        {fileIndex + 1}. {file.fileName}
                                      </div>
                                      <div className="mt-1 text-[12px] text-slate-500">
                                        {file.fileType || 'Unknown type'} · {(file.fileSize / 1024).toFixed(1)} KB
                                      </div>
                                    </div>
                                    {file.storageUrl ? (
                                      <a
                                        href={file.storageUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-[12px] font-semibold text-blue-700 hover:text-blue-800"
                                      >
                                        Open File
                                      </a>
                                    ) : (
                                      <span className="text-[12px] text-slate-400">No uploaded URL</span>
                                    )}
                                  </div>
                                </div>
                              )) : (
                                <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-4 text-[12px] text-slate-500">
                                  No OEM files attached.
                                </div>
                              )}
                            </div>
                          </section>
                        </div>

                        <div className="space-y-4">
                          <section className="rounded-lg border border-slate-200 bg-white px-4 py-4">
                            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Mold / Quantity Plan</div>
                            <div className="mt-3 text-[13px] leading-6 text-slate-700">
                              {productOem.tooling.toolingCostInvolved ? (
                                <>
                                  <div>1st order quantity: {productOem.tooling.firstOrderQuantity || '-'}</div>
                                  <div>Annual quantity: {productOem.tooling.annualQuantity || '-'}</div>
                                  <div>3-year Quantity: {productOem.tooling.quantityWithinThreeYears || '-'}</div>
                                  <div>Mold lifetime: {productOem.tooling.moldLifetime || '-'}</div>
                                </>
                              ) : (
                                <div>No mold / quantity plan submitted.</div>
                              )}
                            </div>
                          </section>

                          {audience === 'internal' ? (
                            <section className="rounded-lg border border-slate-200 bg-white px-4 py-4">
                              <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Customer PN to Internal MODEL# / SKU</div>
                              <div className="mt-3 space-y-2">
                                {productOem.partNumberMappings.length === 0 ? (
                                  <div className="text-[13px] text-slate-600">No customer part numbers captured.</div>
                                ) : (
                                  productOem.partNumberMappings.map((mapping) => (
                                    <div key={mapping.id} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-[13px] text-slate-700">
                                      <span className="font-semibold text-slate-900">{mapping.customerPartNumber}</span>
                                      <span className="mx-2 text-slate-400">→</span>
                                      <span>{mapping.internalModelNumber || 'Pending internal assignment'}</span>
                                      <span className="mx-2 text-slate-400">/</span>
                                      <span>{mapping.internalSku || 'Pending internal assignment'}</span>
                                    </div>
                                  ))
                                )}
                              </div>
                            </section>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : (
            <>
              <section>
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">Business Requirement Note</div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-[13px] leading-6 text-slate-700 whitespace-pre-wrap">
                  {oem.overallRequirementNote || 'No OEM note submitted.'}
                </div>
              </section>

              <section>
                <div className="mb-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">Uploaded OEM Files</div>
                <div className="space-y-3">
                  {oem.files.map((file, index) => (
                    <div key={file.id} className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13px] font-semibold text-slate-900">
                            {index + 1}. {file.fileName}
                          </div>
                          <div className="mt-1 text-[12px] text-slate-500">
                            {file.fileType || 'Unknown type'} · {(file.fileSize / 1024).toFixed(1)} KB
                          </div>
                        </div>
                        {file.storageUrl ? (
                          <a
                            href={file.storageUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[12px] font-semibold text-blue-700 hover:text-blue-800"
                          >
                            Open File
                          </a>
                        ) : (
                          <span className="text-[12px] text-slate-400">No uploaded URL</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}
          </div>

          <div className="space-y-5">
            {audience === 'internal' ? (
              <section className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">Internal Control Rules</div>
                <div className="mt-3 space-y-2 text-[13px] leading-6 text-slate-700">
                  <div>Factory-facing owner: {oem.forwardingControl.ownerDepartment}</div>
                  <div>Customer-selectable forwarding: No</div>
                  <div>Customer identity hidden in factory docs: Yes</div>
                  <div>Customer P/N replaced with internal MODEL# / SKU: Yes</div>
                </div>
              </section>
            ) : null}

            <section className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
              <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">Tooling / Mold Requirement</div>
              {oem.tooling.toolingCostInvolved ? (
                <div className="mt-3 space-y-2 text-[13px] leading-6 text-slate-700">
                  <div>First order quantity: {oem.tooling.firstOrderQuantity}</div>
                  <div>Annual quantity: {oem.tooling.annualQuantity}</div>
                  <div>Quantity within 3 years: {oem.tooling.quantityWithinThreeYears}</div>
                  <div>Mold lifetime: {oem.tooling.moldLifetime || '-'}</div>
                </div>
              ) : (
                <div className="mt-3 text-[13px] text-slate-600">No tooling or mold cost involved.</div>
              )}
            </section>

            {audience === 'internal' ? (
              <section className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-4">
                <div className="text-[12px] font-semibold uppercase tracking-[0.16em] text-slate-500">Customer PN to Internal MODEL# / SKU</div>
                <div className="mt-3 space-y-2">
                  {oem.partNumberMappings.length === 0 ? (
                    <div className="text-[13px] text-slate-600">No customer part numbers captured.</div>
                  ) : (
                    oem.partNumberMappings.map((mapping) => (
                      <div key={mapping.id} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-[13px] text-slate-700">
                        <span className="font-semibold text-slate-900">{mapping.customerPartNumber}</span>
                        <span className="mx-2 text-slate-400">→</span>
                        <span>{mapping.internalModelNumber || 'Pending internal assignment'}</span>
                        <span className="mx-2 text-slate-400">/</span>
                        <span>{mapping.internalSku || 'Pending internal assignment'}</span>
                      </div>
                    ))
                  )}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </section>
    </A4DocumentContainer>
  );
}
