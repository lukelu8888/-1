import React, { useMemo, useState } from 'react';
import { Search, Trash2, Eye, Edit, Calculator } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { QuoteRequirement } from '../../../contexts/QuoteRequirementContext';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { TabsContent } from '../../ui/tabs';
import { calculateRequirementStatus } from './purchaseOrderUtils';
import {
  ERP_LIST_DELETE_BUTTON_CLASS,
  ERP_LIST_DELETE_BUTTON_STYLE,
  ERP_LIST_UI_SPEC_V1,
  getErpListFilterPillClass,
  getErpListFilterPillStyle,
} from '../../shared/erpListUiSpec';
import { normalizeLegacyQrNumber } from '../../../utils/quoteRequirementNumber';

type RequirementStats = {
  total: number;
  pending: number;
  partial: number;
  processing: number;
  highUrgency: number;
};

type QuoteRequirementsTabProps = {
  requirementStats: RequirementStats;
  requirementSearchTerm: string;
  setRequirementSearchTerm: React.Dispatch<React.SetStateAction<string>>;
  selectedRequirementIds: string[];
  setSelectedRequirementIds: React.Dispatch<React.SetStateAction<string[]>>;
  filteredRequirements: QuoteRequirement[];
  handleBatchDeleteRequirements: () => void;
  hasDownstreamXJForRequirement: (req: QuoteRequirement) => boolean;
  setViewRequirement: (req: QuoteRequirement) => void;
  setShowRequirementDialog: (show: boolean) => void;
  handleCreateXJFromRequirement: (req: QuoteRequirement) => void;
  handleCreateOrderFromRequirement: (req: QuoteRequirement) => void;
  handleSmartFeedback: (req: QuoteRequirement) => void;
  handlePushToSalesInquiry: (req: QuoteRequirement) => void;
  deleteRequirement: (id: string) => Promise<void>;
};

export const QuoteRequirementsTab: React.FC<QuoteRequirementsTabProps> = ({
  requirementStats,
  requirementSearchTerm,
  setRequirementSearchTerm,
  selectedRequirementIds,
  setSelectedRequirementIds,
  filteredRequirements,
  handleBatchDeleteRequirements,
  hasDownstreamXJForRequirement,
  setViewRequirement,
  setShowRequirementDialog,
  handleCreateXJFromRequirement,
  handleCreateOrderFromRequirement,
  handleSmartFeedback,
  handlePushToSalesInquiry,
  deleteRequirement,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'partial' | 'processing'>('all');
  const [expandedRelatedIds, setExpandedRelatedIds] = useState<string[]>([]);
  const hasPositivePricingPayload = (req: QuoteRequirement) => {
    const feedbackProducts = Array.isArray(req.purchaserFeedback?.products)
      ? req.purchaserFeedback.products
      : [];
    return feedbackProducts.some((product: any) => {
      const unitPrice = Number(product?.sourcePricing?.unitPrice ?? product?.costPrice ?? 0);
      const amount = Number(product?.amount ?? 0);
      return (Number.isFinite(unitPrice) && unitPrice > 0) || (Number.isFinite(amount) && amount > 0);
    });
  };

  const hasActualSalesInquiryPush = (req: QuoteRequirement) =>
    Boolean(
      req.pushedToQuotation &&
      (
        String(req.pushedToQuotationDate || '').trim() ||
        String(req.pushedBy || '').trim() ||
        String((req as any).quotationNumber || '').trim()
      ) &&
      hasPositivePricingPayload(req)
    );

  const displayRequirements = useMemo(() => {
    if (statusFilter === 'all') return filteredRequirements;
    return filteredRequirements.filter((req) => calculateRequirementStatus(req) === statusFilter);
  }, [filteredRequirements, statusFilter]);

  const formatDateOnly = (value?: string | null) => {
    const text = String(value || '').trim();
    if (!text) return '-';
    return text.includes('T') ? text.slice(0, 10) : text;
  };

  return (
    <TabsContent value="requirements" className="m-0 flex flex-1 min-h-0 flex-col">
      {/* 需求列表 */}
      <div className="px-3 py-2 flex flex-1 min-h-0 flex-col">
        {/* 🔥 搜索框和批量操作 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="搜索编号、关联编号、区域..."
                value={requirementSearchTerm}
                onChange={(e) => setRequirementSearchTerm(e.target.value)}
                className={`pl-8 h-8 w-80 ${ERP_LIST_UI_SPEC_V1.buttonTextClass}`}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[
              ['all', '全部', requirementStats.total],
              ['pending', '待处理', requirementStats.pending],
              ['partial', '部分提交', requirementStats.partial],
              ['processing', '已发供应商', requirementStats.processing],
            ].map(([value, label, count]) => (
              <Button
                key={String(value)}
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter(value as any)}
                style={getErpListFilterPillStyle(statusFilter === value)}
                className={getErpListFilterPillClass(statusFilter === value).replace('h-9', 'h-8').replace('px-4', 'px-3')}
              >
                {label} ({count})
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              onClick={handleBatchDeleteRequirements}
              disabled={selectedRequirementIds.length === 0}
              style={ERP_LIST_DELETE_BUTTON_STYLE}
              className={ERP_LIST_DELETE_BUTTON_CLASS.replace('h-9', 'h-8').replace('text-[12px]', ERP_LIST_UI_SPEC_V1.buttonTextClass)}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1" />
              批量删除{selectedRequirementIds.length > 0 ? ` (${selectedRequirementIds.length})` : ''}
            </Button>
          </div>
        </div>

        <div className="border border-gray-200 rounded bg-white flex flex-1 min-h-0 flex-col overflow-visible min-h-[calc(100dvh-360px)]">
          <div className="overflow-x-auto overflow-y-visible bg-white flex-1 rounded-[inherit] min-h-0">
          <table className="w-full text-[14px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                    checked={selectedRequirementIds.length === displayRequirements.length && displayRequirements.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRequirementIds(displayRequirements.map(r => r.id));
                      } else {
                        setSelectedRequirementIds([]);
                      }
                    }}
                  />
                </th>
                <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-12">#</th>
                <th className="text-left py-1.5 px-2 font-medium text-gray-700">日期</th>
                <th className="text-left py-1.5 px-2 font-medium text-gray-700">编号</th>
                <th className="text-left py-1.5 px-2 font-medium text-gray-700">区域</th>
                <th className="text-center py-1.5 px-2 font-medium text-gray-700">产品数</th>
                <th className="text-left py-1.5 px-2 font-medium text-gray-700">状态</th>
                <th className="text-center py-1.5 px-2 font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {displayRequirements.map((req, idx) => {
                const itemCount = req.items?.length || 0;

                // 🔥 动态计算状态
                const dynamicStatus = calculateRequirementStatus(req);
                const hasLinkedXJ = hasDownstreamXJForRequirement(req);
                const disableEdit = false;
                const relatedRefs = [
                  String(req.sourceRef || '').trim(),
                  String(req.sourceInquiryNumber || '').trim(),
                  String((req as any).quotationNumber || '').trim(),
                  String((req as any).xjNumber || '').trim(),
                ].filter((value, index, array) => value && array.indexOf(value) === index);
                const relatedRefsExpanded = expandedRelatedIds.includes(req.id);

                // 🔥 区域标签配置
                // region 统一用 Supabase 存储的 code（NA/SA/EA）
                const regionCode = req.region?.toUpperCase().replace('NORTH AMERICA','NA').replace('SOUTH AMERICA','SA').replace('EUROPE & AFRICA','EA').replace('EUROPE-AFRICA','EA');
                const regionConfig = regionCode === 'NA' ? { label: 'NA', color: 'bg-blue-100 text-blue-700' }
                  : regionCode === 'SA' ? { label: 'SA', color: 'bg-green-100 text-green-700' }
                  : regionCode === 'EA' ? { label: 'EA', color: 'bg-purple-100 text-purple-700' }
                  : null;

                return (
                  <tr key={req.id} className={`border-b border-gray-100 hover:bg-gray-50 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="py-2 px-2 text-center">
                      <input
                        type="checkbox"
                        className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                        checked={selectedRequirementIds.includes(req.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRequirementIds([...selectedRequirementIds, req.id]);
                          } else {
                            setSelectedRequirementIds(selectedRequirementIds.filter(id => id !== req.id));
                          }
                        }}
                      />
                    </td>
                    <td className="py-2 px-2 text-center text-gray-500">
                      {idx + 1}
                    </td>
                    <td className="py-2 px-2">
                      <div className="space-y-1 text-gray-900">
                        <div>
                          <span className="mr-1 text-[12px] text-gray-500">提交日期</span>
                          {formatDateOnly(req.createdDate)}
                        </div>
                        <div>
                          <span className="mr-1 text-[12px] text-gray-500">截止日期</span>
                          {formatDateOnly(req.requiredDate)}
                        </div>
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="relative inline-block">
                      <button
                        onClick={() => {
                          setViewRequirement(req);
                          setShowRequirementDialog(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                      >
                        {normalizeLegacyQrNumber(req.requirementNo) || '-'}
                      </button>
                      {relatedRefs.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => {
                            setExpandedRelatedIds((current) =>
                              current.includes(req.id)
                                ? current.filter((id) => id !== req.id)
                                : [...current, req.id],
                            );
                          }}
                          className="mt-1 block text-[12px] font-semibold leading-[1.35] text-slate-500 hover:text-slate-700"
                        >
                          {relatedRefsExpanded ? '收起关联编号' : `展开关联编号 (${relatedRefs.length})`}
                        </button>
                      ) : null}
                      {relatedRefsExpanded ? (
                        <div className="absolute left-0 top-full z-20 mt-2 min-w-[280px] space-y-1 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
                          {relatedRefs.map((ref) => (
                            <div key={`${req.id}-${ref}`} className="whitespace-nowrap text-left text-[12px] font-mono text-blue-600">
                              {ref}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      </div>
                    </td>
                    <td className="py-2 px-2">
                      {regionConfig ? (
                        <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] font-medium ${regionConfig.color}`}>
                          {regionConfig.label}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[12px]">-</span>
                      )}
                    </td>
                    <td className="py-2 px-2 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-semibold">
                        {itemCount}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] border ${
                        dynamicStatus === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                        dynamicStatus === 'partial' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                        dynamicStatus === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                        'bg-green-50 text-green-700 border-green-200'
                      }`}>
                        {dynamicStatus === 'pending' ? '待处理' :
                         dynamicStatus === 'partial' ? '部分提交' :
                         dynamicStatus === 'processing' ? '全部提交' : '已完成'}
                      </span>
                    </td>
                    <td className="py-2 px-2 text-center">
                      <div className="flex gap-1 justify-center">
                        {/* 🔥 查看按钮 */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setViewRequirement(req);
                            setShowRequirementDialog(true);
                          }}
                          className="h-6 text-[12px] px-2 border-gray-300 text-gray-600 hover:bg-gray-50 gap-1"
                          title="查看报价请求单详情"
                        >
                          <Eye className="w-3 h-3" />
                          <span>查看</span>
                        </Button>

                        {/* 🔥 编辑按钮 */}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            // TODO: 实现编辑功能
                            toast.info('编辑功能开发中...', {
                              description: '即将支持编辑报价请求单',
                              duration: 2000
                            });
                          }}
                          disabled={disableEdit}
                          className={`h-6 text-[12px] px-2 gap-1 ${
                            disableEdit
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                              : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                          }`}
                          title="编辑报价请求单"
                        >
                          <Edit className="w-3 h-3" />
                          <span>编辑</span>
                        </Button>

                        {(dynamicStatus === 'pending' || dynamicStatus === 'partial') && (
                          <Button
                            size="sm"
                            onClick={() => handleCreateXJFromRequirement(req)}
                            className="h-6 text-[12px] bg-blue-600 hover:bg-blue-700 px-2"
                            title={dynamicStatus === 'partial' ? '继续为剩余未提交产品创建询价单' : '创建询价单'}
                          >
                            创建询价单
                          </Button>
                        )}
                        {!hasLinkedXJ && (dynamicStatus === 'pending' || dynamicStatus === 'partial') && (
                          <>
                            {/* Phase 3d: legacy path — visually downgraded to signal non-standard use.
                                Standard path is PR → admin allocation → CG (via 创建询价单 → 供应商分配).
                                This button bypasses PR and creates a CG directly (no parentRequestPoNumber). */}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleCreateOrderFromRequirement(req)}
                              className="h-6 text-[12px] border-gray-300 text-gray-500 hover:text-gray-700 hover:bg-gray-50 px-2"
                              title="旧流程：直接创建采购单（不经过PR审批流）"
                            >
                              直接下单
                            </Button>
                          </>
                        )}
                        {/* 采购侧固定显示智能对比建议按钮，避免在某些状态下"消失" */}
                        <Button
                          size="sm"
                          onClick={() => handleSmartFeedback(req)}
                          className="h-6 text-[12px] bg-emerald-600 hover:bg-emerald-700 px-2 gap-1"
                          title={req.purchaserFeedback ? '重新查看/调整智能对比建议' : '智能提取BJ报价，生成对比建议'}
                        >
                          <Calculator className="w-3 h-3" />
                          <span>智能对比建议</span>
                        </Button>

                        {req.purchaserFeedback && (
                          <Badge className="h-6 px-2 bg-green-100 text-green-700 border-green-300 text-[12px]">
                            ✓ 已反馈
                          </Badge>
                        )}

                        {/* 采购侧只保留反馈业务员询报，不再显示"创建报价" */}
                        <Button
                          size="sm"
                          onClick={() => handlePushToSalesInquiry(req)}
                          className={`h-6 text-[12px] px-2 gap-1 ${
                            hasActualSalesInquiryPush(req)
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-200 border border-amber-300'
                              : 'bg-orange-500 hover:bg-orange-600 text-white'
                          }`}
                          title={
                            hasActualSalesInquiryPush(req)
                              ? '重新反馈业务员询报'
                              : '反馈业务员询报'
                          }
                        >
                          <Calculator className="w-3 h-3" />
                          <span>{hasActualSalesInquiryPush(req) ? '重新反馈业务员询报' : '反馈业务员询报'}</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            if (hasLinkedXJ) {
                              toast.error('该报价请求单已生成下游询价(XJ)，不可删除');
                              return;
                            }
                            if (window.confirm(`确定要删除报价请求单 "${req.requirementNo}" 吗？\n\n产品: ${req.productName}\n数量: ${req.quantity} ${req.unit}`)) {
                              try {
                                await deleteRequirement(req.id);
                                toast.success('报价请求单已删除', {
                                  description: `${req.requirementNo} - ${req.productName}`,
                                  duration: 3000
                                });
                              } catch (error: any) {
                                toast.error(`删除报价请求单失败：${error?.message || '未知错误'}`);
                              }
                            }
                          }}
                          disabled={hasLinkedXJ}
                          className={`h-6 text-[12px] px-2 ${
                            hasLinkedXJ
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                              : 'border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400'
                          }`}
                          title="删除报价请求单"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </TabsContent>
  );
};
