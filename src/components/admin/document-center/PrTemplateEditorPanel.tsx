import React from 'react';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { TemplateVersionActionsCard } from './TemplateVersionActionsCard';
import {
  buildAllocationRemarks,
  buildPrCgDraftPlans,
  buildSupplierAllocationSummaries,
  buildTargetCgPlaceholder,
  parseAllocationFields,
  validateProductAllocation,
  type AllocationFields,
  type AllocationValidationResult,
} from './buildPrCgDraftPayloads';

import type {
  QuoteRequirementDocumentData,
  QuoteRequirementPreviewLayout,
  QuoteRequirementTextOverrides,
} from '../../documents/templates/QuoteRequirementDocument';

interface PrTemplateEditorPanelProps {
  publishedVersion?: string;
  draftVersion?: string;
  prTemplateVersionNote: string;
  setPrTemplateVersionNote: (value: string) => void;
  onRestoreLatest: () => void;
  restoreDisabled: boolean;
  prTemplateTextOverrides: QuoteRequirementTextOverrides;
  updatePrTemplateText: (field: keyof QuoteRequirementTextOverrides, value: string) => void;
  prTemplateData: QuoteRequirementDocumentData;
  updatePrTemplateData: <K extends keyof QuoteRequirementDocumentData>(
    field: K,
    value: QuoteRequirementDocumentData[K]
  ) => void;
  prTemplateLayout: QuoteRequirementPreviewLayout;
  updatePrTemplateLayout: <K extends keyof QuoteRequirementPreviewLayout>(
    field: K,
    value: QuoteRequirementPreviewLayout[K]
  ) => void;
  versionHistoryPanel: React.ReactNode;
}

export function PrTemplateEditorPanel({
  publishedVersion,
  draftVersion,
  prTemplateVersionNote,
  setPrTemplateVersionNote,
  onRestoreLatest,
  restoreDisabled,
  prTemplateTextOverrides,
  updatePrTemplateText,
  prTemplateData,
  updatePrTemplateData,
  prTemplateLayout,
  updatePrTemplateLayout,
  versionHistoryPanel,
}: PrTemplateEditorPanelProps) {
  const supplierAllocationSummaries = buildSupplierAllocationSummaries(prTemplateData.products);
  const cgDraftPlans = buildPrCgDraftPlans(prTemplateData, supplierAllocationSummaries);
  const allocationValidationRows = prTemplateData.products.map((product) => ({
    product,
    validation: validateProductAllocation(product),
  }));
  const allocationStats = allocationValidationRows.reduce(
    (acc, row) => {
      acc[row.validation.status] += 1;
      return acc;
    },
    { complete: 0, partial: 0, over: 0 } as Record<AllocationValidationResult['status'], number>,
  );
  const hasAnySupplierAllocation = supplierAllocationSummaries.length > 0;
  const hasOverAllocatedItems = allocationStats.over > 0;
  const hasPendingAllocationItems = allocationStats.partial > 0;
  const cgGenerationReady = hasAnySupplierAllocation && !hasOverAllocatedItems && !hasPendingAllocationItems;
  const cgGenerationChecklist = [
    {
      label: '已至少分配给 1 家供应商',
      passed: hasAnySupplierAllocation,
    },
    {
      label: '所有产品项已完成分配',
      passed: !hasPendingAllocationItems,
    },
    {
      label: '没有产品项分配超量',
      passed: !hasOverAllocatedItems,
    },
  ];

  const handleUpdateProduct = (
    index: number,
    patch: Partial<QuoteRequirementDocumentData['products'][number]>,
  ) => {
    updatePrTemplateData(
      'products',
      prTemplateData.products.map((item, itemIndex) => (
        itemIndex === index ? { ...item, ...patch } : item
      )),
    );
  };

  const handleUpdateAllocationField = (
    index: number,
    field: keyof AllocationFields,
    value: string,
  ) => {
    const product = prTemplateData.products[index];
    const current = parseAllocationFields(product?.remarks);
    const next = {
      ...current,
      [field]: value,
    };
    handleUpdateProduct(index, {
      remarks: buildAllocationRemarks(next),
    });
  };

  const writeBackAllocationSummary = () => {
    const lines = prTemplateData.products.flatMap((product, index) => {
      const allocation = parseAllocationFields(product.remarks);
      if (!allocation.supplierName && !allocation.targetCgNo && !allocation.allocatedQty) return [];
      return [
        `${index + 1}. ${product.productName || product.modelNo || `产品${index + 1}`}`,
        `供应商：${allocation.supplierName || '待定'}`,
        `分配数量：${allocation.allocatedQty || String(product.quantity || '') || '待定'}`,
        `目标CG：${allocation.targetCgNo || '待生成'}`,
        allocation.allocationNotes ? `说明：${allocation.allocationNotes}` : '',
      ].filter(Boolean);
    });

    updatePrTemplateData(
      'purchaseDeptFeedback',
      lines.length > 0
        ? lines.join('\n')
        : '暂未填写供应商分配结果，待采购员完成拆单后回写。',
    );
  };

  const writeBackSupplierSummary = () => {
    const lines = supplierAllocationSummaries.flatMap((summary, index) => {
      const itemLabels = summary.items.map((item) => (
        `${item.productLabel}${item.allocatedQty ? ` × ${item.allocatedQty}` : ''}${item.targetCgNo ? ` -> ${item.targetCgNo}` : ''}`
      ));

      return [
        `${index + 1}. 供应商：${summary.supplierName}`,
        `负责产品：${itemLabels.join('；') || '待补充'}`,
        ...summary.items
          .map((item) => item.allocationNotes.trim())
          .filter(Boolean)
          .map((note) => `说明：${note}`),
      ];
    });

    updatePrTemplateData(
      'purchaseDeptFeedback',
      lines.length > 0
        ? lines.join('\n')
        : '暂未形成供应商分配摘要，待采购员完成拆单后回写。',
    );
  };

  const autoGenerateTargetCgNumbers = () => {
    const supplierOrder = new Map<string, number>();
    let nextSupplierIndex = 0;

    updatePrTemplateData(
      'products',
      prTemplateData.products.map((product) => {
        const allocation = parseAllocationFields(product.remarks);
        const supplierName = allocation.supplierName.trim();
        if (!supplierName) return product;

        if (!supplierOrder.has(supplierName)) {
          supplierOrder.set(supplierName, nextSupplierIndex);
          nextSupplierIndex += 1;
        }

        const targetCgNo = allocation.targetCgNo.trim() || buildTargetCgPlaceholder(
          prTemplateData.requirementNo,
          supplierOrder.get(supplierName) || 0,
        );

        return {
          ...product,
          remarks: buildAllocationRemarks({
            ...allocation,
            targetCgNo,
          }),
        };
      }),
    );
  };

  const syncCgDraftPlanToFeedback = () => {
    const lines = cgDraftPlans.flatMap((plan, index) => [
      `${index + 1}. 待生成CG：${plan.targetCgNo}`,
      `供应商：${plan.supplierName}`,
      `产品项：${plan.productLabels.join('；') || '待补充'}`,
      `预计数量合计：${plan.totalAllocatedQty || 0}`,
      `预计包含 ${plan.totalItems} 个产品项`,
      ...plan.notes.map((note) => `说明：${note}`),
    ]);

    updatePrTemplateData(
      'purchaseDeptFeedback',
      lines.length > 0
        ? lines.join('\n')
        : '暂未形成 CG 草稿计划，待供应商分配完成后生成。',
    );
  };

  return (
    <>
      <TemplateVersionActionsCard
        publishedVersion={publishedVersion}
        draftVersion={draftVersion}
        noteField={(
          <div className="mt-2">
            <Label className="text-[11px] text-violet-700">版本备注</Label>
            <Textarea
              value={prTemplateVersionNote}
              onChange={(e) => setPrTemplateVersionNote(e.target.value)}
              className="mt-1 min-h-[56px] border-violet-200 bg-white text-xs"
            />
          </div>
        )}
        onRestoreLatest={onRestoreLatest}
        restoreDisabled={restoreDisabled}
      />
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">模板标题</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">中文标题</Label>
            <Input value={prTemplateTextOverrides.documentTitle} onChange={(e) => updatePrTemplateText('documentTitle', e.target.value)} className="mt-1 h-7 text-xs" />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">英文标题</Label>
            <Input value={prTemplateTextOverrides.documentTitleEn} onChange={(e) => updatePrTemplateText('documentTitleEn', e.target.value)} className="mt-1 h-7 text-xs" />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">分配说明标题</Label>
            <Input value={prTemplateTextOverrides.salesInstructionsTitle} onChange={(e) => updatePrTemplateText('salesInstructionsTitle', e.target.value)} className="mt-1 h-7 text-xs" />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">单据信息</p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-[11px] text-gray-500">PR编号</Label>
            <Input value={prTemplateData.requirementNo} onChange={(e) => updatePrTemplateData('requirementNo', e.target.value)} className="mt-1 h-7 text-xs" />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">来源销售合同</Label>
            <Input value={prTemplateData.sourceInquiryNo} onChange={(e) => updatePrTemplateData('sourceInquiryNo', e.target.value)} className="mt-1 h-7 text-xs" />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">要求分配完成日期</Label>
            <Input value={prTemplateData.requiredResponseDate} onChange={(e) => updatePrTemplateData('requiredResponseDate', e.target.value)} className="mt-1 h-7 text-xs" />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">要求采购交付日期</Label>
            <Input value={prTemplateData.requiredDeliveryDate} onChange={(e) => updatePrTemplateData('requiredDeliveryDate', e.target.value)} className="mt-1 h-7 text-xs" />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">订单客户信息（脱敏）</p>
        <div className="space-y-2">
          <div>
            <Label className="text-[11px] text-gray-500">脱敏客户名称</Label>
            <Input value={prTemplateData.customer.companyName} onChange={(e) => updatePrTemplateData('customer', { ...prTemplateData.customer, companyName: e.target.value })} className="mt-1 h-7 text-xs" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[11px] text-gray-500">对接角色</Label>
              <Input value={prTemplateData.customer.contactPerson} onChange={(e) => updatePrTemplateData('customer', { ...prTemplateData.customer, contactPerson: e.target.value })} className="mt-1 h-7 text-xs" />
            </div>
            <div>
              <Label className="text-[11px] text-gray-500">目标市场</Label>
              <Input value={prTemplateData.customer.region} onChange={(e) => updatePrTemplateData('customer', { ...prTemplateData.customer, region: e.target.value })} className="mt-1 h-7 text-xs" />
            </div>
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">脱敏说明</Label>
            <Textarea value={prTemplateTextOverrides.customerIntroText} onChange={(e) => updatePrTemplateText('customerIntroText', e.target.value)} className="mt-1 min-h-[96px] text-xs leading-6" />
          </div>
          <div>
            <Label className="text-[11px] text-gray-500">采购分配人</Label>
            <Input value={prTemplateData.createdBy} onChange={(e) => updatePrTemplateData('createdBy', e.target.value)} className="mt-1 h-7 text-xs" />
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">采购分配说明</p>
        <Textarea value={prTemplateData.salesDeptNotes || ''} onChange={(e) => updatePrTemplateData('salesDeptNotes', e.target.value)} className="min-h-[180px] text-xs leading-6" />
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold text-gray-900">供应商分配结果</p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={autoGenerateTargetCgNumbers}
              className="rounded border border-orange-300 px-2 py-1 text-[11px] text-orange-700 hover:bg-orange-50"
            >
              自动生成目标CG
            </button>
            <button
              type="button"
              onClick={writeBackAllocationSummary}
              className="rounded border border-gray-300 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
            >
              回写到采购反馈
            </button>
          </div>
        </div>
        <div className="space-y-3">
          {prTemplateData.products.map((product, index) => {
            const allocation = parseAllocationFields(product.remarks);
            const validation = validateProductAllocation(product);
            return (
              <div key={`${product.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 p-2.5">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div className="text-[11px] font-semibold text-gray-700">分配产品 {product.no}</div>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] ${
                      validation.status === 'complete'
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : validation.status === 'over'
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-amber-200 bg-amber-50 text-amber-700'
                    }`}
                  >
                    {validation.status === 'complete'
                      ? '已分配完成'
                      : validation.status === 'over'
                        ? '分配超量'
                        : '仍有未分配'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] text-gray-500">产品名称</Label>
                      <Input
                        value={product.productName}
                        onChange={(e) => handleUpdateProduct(index, { productName: e.target.value })}
                        className="mt-1 h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-gray-500">型号</Label>
                      <Input
                        value={product.modelNo}
                        onChange={(e) => handleUpdateProduct(index, { modelNo: e.target.value })}
                        className="mt-1 h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-gray-500">产品规格 / 拆分依据</Label>
                    <Textarea
                      value={product.specification}
                      onChange={(e) => handleUpdateProduct(index, { specification: e.target.value })}
                      className="mt-1 min-h-[56px] text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] text-gray-500">订单数量</Label>
                      <Input
                        type="number"
                        value={product.quantity}
                        onChange={(e) => handleUpdateProduct(index, { quantity: Number(e.target.value) || 0 })}
                        className="mt-1 h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-gray-500">建议供应商</Label>
                      <Input
                        value={allocation.supplierName}
                        onChange={(e) => handleUpdateAllocationField(index, 'supplierName', e.target.value)}
                        className="mt-1 h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px] text-gray-500">分配数量</Label>
                      <Input
                        value={allocation.allocatedQty}
                        onChange={(e) => handleUpdateAllocationField(index, 'allocatedQty', e.target.value)}
                        className="mt-1 h-7 text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-[11px] text-gray-500">目标 CG 编号</Label>
                      <Input
                        value={allocation.targetCgNo}
                        onChange={(e) => handleUpdateAllocationField(index, 'targetCgNo', e.target.value)}
                        className="mt-1 h-7 text-xs"
                      />
                    </div>
                  </div>
                  <div className="rounded bg-white px-2 py-1.5 text-[11px] text-gray-500">
                    订单数量：{validation.totalRequiredQty} | 当前分配：{validation.allocatedQty} | 剩余待分配：
                    <span className={validation.remainingQty < 0 ? 'text-red-600' : validation.remainingQty > 0 ? 'text-amber-600' : 'text-emerald-600'}>
                      {` ${validation.remainingQty}`}
                    </span>
                  </div>
                  <div>
                    <Label className="text-[11px] text-gray-500">分配说明</Label>
                    <Textarea
                      value={allocation.allocationNotes}
                      onChange={(e) => handleUpdateAllocationField(index, 'allocationNotes', e.target.value)}
                      className="mt-1 min-h-[52px] text-xs"
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-900">分配校验总览</p>
            <p className="mt-1 text-[11px] text-gray-500">检查每个产品项是否已经完整分配到供应商，避免后续生成 CG 时出现缺口或超量。</p>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">完成 {allocationStats.complete}</span>
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">未完成 {allocationStats.partial}</span>
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-red-700">超量 {allocationStats.over}</span>
          </div>
        </div>
        <div className="space-y-2">
          {allocationValidationRows.map(({ product, validation }, index) => (
            <div key={`validation-${product.no}-${index}`} className="rounded border border-gray-100 bg-gray-50 px-3 py-2 text-[11px] text-gray-600">
              <div className="flex items-center justify-between gap-3">
                <span className="font-medium text-gray-800">{product.productName || product.modelNo || `产品${index + 1}`}</span>
                <span>
                  {validation.status === 'complete'
                    ? '已完整分配'
                    : validation.status === 'over'
                      ? '分配超量，请回调'
                      : `还差 ${validation.remainingQty} 待分配`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-900">多供应商分配摘要</p>
            <p className="mt-1 text-[11px] text-gray-500">
              当前已分配 {supplierAllocationSummaries.length} 家供应商，建议后续生成 {supplierAllocationSummaries.length} 份 CG
            </p>
          </div>
          <button
            type="button"
            onClick={writeBackSupplierSummary}
            className="rounded border border-gray-300 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
          >
            同步摘要到采购反馈
          </button>
        </div>
        {supplierAllocationSummaries.length > 0 ? (
          <div className="space-y-2">
            {supplierAllocationSummaries.map((summary) => (
              <div key={summary.supplierName} className="rounded border border-orange-100 bg-orange-50 p-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-gray-900">{summary.supplierName}</p>
                  <span className="rounded-full border border-orange-200 bg-white px-2 py-0.5 text-[10px] text-orange-700">
                    {summary.items.length} 个产品项
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {summary.items.map((item, itemIndex) => (
                    <div key={`${summary.supplierName}-${itemIndex}`} className="rounded bg-white px-2 py-1.5 text-[11px] text-gray-600">
                      <div>{item.productLabel}</div>
                      <div className="mt-1 text-gray-500">
                        数量：{item.allocatedQty || '待补充'}
                        {item.targetCgNo ? ` | 目标CG：${item.targetCgNo}` : ''}
                      </div>
                      {item.allocationNotes ? (
                        <div className="mt-1 text-gray-500">说明：{item.allocationNotes}</div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded border border-dashed border-gray-200 px-3 py-3 text-[11px] text-gray-400">
            还没有填写供应商分配结果。先在上方逐产品填写供应商、数量和目标 CG，这里会自动汇总。
          </div>
        )}
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-gray-900">CG 草稿生成预览</p>
            <p className="mt-1 text-[11px] text-gray-500">
              基于当前供应商分配结果，预计将生成 {cgDraftPlans.length} 份 CG 草稿
            </p>
          </div>
          <button
            type="button"
            onClick={syncCgDraftPlanToFeedback}
            className="rounded border border-gray-300 px-2 py-1 text-[11px] text-gray-700 hover:bg-gray-50"
          >
            回写CG计划到采购反馈
          </button>
        </div>
        <div
          className={`mb-3 rounded border px-3 py-2 text-[11px] ${
            cgGenerationReady
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-amber-200 bg-amber-50 text-amber-700'
          }`}
        >
          {cgGenerationReady
            ? `当前 PR 已满足生成 CG 草稿的前置条件，预计可生成 ${cgDraftPlans.length} 份 CG。`
            : '当前 PR 还未满足生成 CG 草稿的全部前置条件，请先完成下方校验项。'}
        </div>
        <div className="mb-3 grid grid-cols-1 gap-2">
          {cgGenerationChecklist.map((item) => (
            <div
              key={item.label}
              className={`rounded px-3 py-2 text-[11px] ${
                item.passed
                  ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                  : 'border border-gray-200 bg-gray-50 text-gray-500'
              }`}
            >
              {item.passed ? '已满足' : '待完成'}：{item.label}
            </div>
          ))}
        </div>
        {cgDraftPlans.length > 0 ? (
          <div className="space-y-2">
            {cgDraftPlans.map((plan) => (
              <div key={plan.targetCgNo} className="rounded border border-blue-100 bg-blue-50 p-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-900">{plan.targetCgNo}</p>
                    <p className="mt-1 text-[11px] text-gray-600">供应商：{plan.supplierName}</p>
                  </div>
                  <span className="rounded-full border border-blue-200 bg-white px-2 py-0.5 text-[10px] text-blue-700">
                    {plan.totalItems} 项 / 合计 {plan.totalAllocatedQty}
                  </span>
                </div>
                <div className="mt-2 rounded bg-white px-2 py-1.5 text-[11px] text-gray-600">
                  产品：{plan.productLabels.join('；') || '待补充'}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-gray-500">
                  <div className="rounded bg-white px-2 py-1.5">草稿交期：{plan.requiredDeliveryDate || '待补充'}</div>
                  <div className="rounded bg-white px-2 py-1.5">采购项合计：{plan.totalAllocatedQty || 0}</div>
                </div>
                {plan.notes.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {plan.notes.map((note, index) => (
                      <div key={`${plan.targetCgNo}-note-${index}`} className="rounded bg-white px-2 py-1 text-[11px] text-gray-500">
                        说明：{note}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded border border-dashed border-gray-200 px-3 py-3 text-[11px] text-gray-400">
            先填写供应商分配结果并生成目标 CG 编号，这里会预览将要生成的采购合同草稿。
          </div>
        )}
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-900">{'PR -> CG 字段映射预览'}</p>
          <p className="mt-1 text-[11px] text-gray-500">
            这部分用于确认当前 PR 分配结果，未来生成 CG 草稿时会如何落到采购合同核心字段。
          </p>
        </div>
        {cgDraftPlans.length > 0 ? (
          <div className="space-y-2">
            {cgDraftPlans.map((plan) => (
              <div key={`${plan.targetCgNo}-mapping`} className="rounded border border-slate-200 bg-slate-50 p-2.5">
                <div className="mb-2 text-[11px] font-semibold text-slate-800">{plan.targetCgNo}</div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600">
                  <div className="rounded bg-white px-2 py-1.5">来源 PR：{prTemplateData.requirementNo}</div>
                  <div className="rounded bg-white px-2 py-1.5">来源 SC：{plan.sourceSalesContractNo || '待补充'}</div>
                  <div className="rounded bg-white px-2 py-1.5">父级 PR 链路：{plan.cgBusinessDraft.parentRequestPoNumber}</div>
                  <div className="rounded bg-white px-2 py-1.5">业务状态：{plan.cgBusinessDraft.procurementRequestStatus}</div>
                  <div className="rounded bg-white px-2 py-1.5">买方联系人：{plan.cgDraftData.buyer.contactPerson || plan.buyerName || '待补充'}</div>
                  <div className="rounded bg-white px-2 py-1.5">供应商：{plan.cgDraftData.supplier.companyName || plan.supplierName || '待补充'}</div>
                  <div className="rounded bg-white px-2 py-1.5">交付日期：{plan.cgDraftData.requiredDeliveryDate || plan.requiredDeliveryDate || '待补充'}</div>
                  <div className="rounded bg-white px-2 py-1.5">币种建议：{plan.cgDraftData.terms.currency || plan.currencyHint}</div>
                  <div className="rounded bg-white px-2 py-1.5">合同金额：{plan.cgDraftData.terms.totalAmount || 0}</div>
                  <div className="rounded bg-white px-2 py-1.5">产品项数：{plan.cgDraftData.products.length}</div>
                  <div className="rounded bg-white px-2 py-1.5">记录状态：{plan.cgBusinessDraft.status}</div>
                  <div className="rounded bg-white px-2 py-1.5">付款状态：{plan.cgBusinessDraft.paymentStatus}</div>
                  <div className="rounded bg-white px-2 py-1.5 col-span-2">
                    产品映射：{plan.cgDraftData.products.map((product) => product.description).join('；') || '待补充'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded border border-dashed border-gray-200 px-3 py-3 text-[11px] text-gray-400">
            当前还没有可映射到 CG 的供应商分配结果。先完成供应商分配，这里会显示每份 CG 草稿的核心字段来源。
          </div>
        )}
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">采购分配回写</p>
        <Textarea value={prTemplateData.purchaseDeptFeedback || ''} onChange={(e) => updatePrTemplateData('purchaseDeptFeedback', e.target.value)} className="min-h-[96px] text-xs leading-6" />
      </div>
      <div className="rounded-lg border border-gray-200 p-3">
        <p className="text-xs font-semibold text-gray-900 mb-3">版式参数</p>
        <div className="grid grid-cols-2 gap-2">
          <div><Label className="text-[11px] text-gray-500">画布宽度(mm)</Label><Input type="number" value={prTemplateLayout.canvasWidthMm} onChange={(e) => updatePrTemplateLayout('canvasWidthMm', Number(e.target.value) || 210)} className="mt-1 h-7 text-xs" /></div>
          <div><Label className="text-[11px] text-gray-500">最小高度(mm)</Label><Input type="number" value={prTemplateLayout.canvasMinHeightMm} onChange={(e) => updatePrTemplateLayout('canvasMinHeightMm', Number(e.target.value) || 297)} className="mt-1 h-7 text-xs" /></div>
          <div><Label className="text-[11px] text-gray-500">上边距(mm)</Label><Input type="number" value={prTemplateLayout.contentPaddingTopMm} onChange={(e) => updatePrTemplateLayout('contentPaddingTopMm', Number(e.target.value) || 10)} className="mt-1 h-7 text-xs" /></div>
          <div><Label className="text-[11px] text-gray-500">下边距(mm)</Label><Input type="number" value={prTemplateLayout.contentPaddingBottomMm} onChange={(e) => updatePrTemplateLayout('contentPaddingBottomMm', Number(e.target.value) || 12)} className="mt-1 h-7 text-xs" /></div>
        </div>
      </div>
      {versionHistoryPanel}
    </>
  );
}
