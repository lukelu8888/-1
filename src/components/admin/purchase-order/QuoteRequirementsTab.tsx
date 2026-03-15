import React from 'react';
import { Search, Trash2, Eye, Edit, Calculator } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { QuoteRequirement } from '../../../contexts/QuoteRequirementContext';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Input } from '../../ui/input';
import { TabsContent } from '../../ui/tabs';
import { calculateRequirementStatus, getUrgencyConfig } from './purchaseOrderUtils';

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
  handleCreateRFQFromRequirement: (req: QuoteRequirement) => void;
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
  handleCreateRFQFromRequirement,
  handleCreateOrderFromRequirement,
  handleSmartFeedback,
  handlePushToSalesInquiry,
  deleteRequirement,
}) => {
  return (
    <TabsContent value="requirements" className="m-0">
      {/* 需求统计 */}
      <div className="px-3 py-3 bg-gray-50 border-b border-gray-200">
        <div className="grid grid-cols-5 gap-2">
          <div className="text-center">
            <p className="text-[14px] text-gray-500">总 QR</p>
            <p className="text-base font-bold text-gray-900">{requirementStats.total}</p>
          </div>
          <div className="text-center">
            <p className="text-[14px] text-gray-500">待处理</p>
            <p className="text-base font-bold text-amber-600">{requirementStats.pending}</p>
          </div>
          <div className="text-center">
            <p className="text-[14px] text-gray-500">部分提交</p>
            <p className="text-base font-bold text-orange-600">{requirementStats.partial}</p>
          </div>
          <div className="text-center">
            <p className="text-[14px] text-gray-500">已发供应商</p>
            <p className="text-base font-bold text-blue-600">{requirementStats.processing}</p>
          </div>
          <div className="text-center">
            <p className="text-[14px] text-gray-500">紧急 QR</p>
            <p className="text-base font-bold text-red-600">{requirementStats.highUrgency}</p>
          </div>
        </div>
      </div>

      {/* 需求列表 */}
      <div className="px-3 py-2">
        {/* 🔥 搜索框和批量操作 */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <Input
                placeholder="搜索 QR 编号、来源单号、区域..."
                value={requirementSearchTerm}
                onChange={(e) => setRequirementSearchTerm(e.target.value)}
                className="pl-8 h-8 text-xs w-80"
              />
            </div>
            {selectedRequirementIds.length > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleBatchDeleteRequirements}
                className="h-8 text-xs px-3 border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                批量删除 ({selectedRequirementIds.length})
              </Button>
            )}
          </div>
          <p className="text-[14px] text-gray-600">共 {filteredRequirements.length} 条 QR</p>
        </div>

        <div className="border border-gray-200 rounded overflow-hidden">
          <table className="w-full text-[14px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-10">
                  <input
                    type="checkbox"
                    className="w-4 h-4 cursor-pointer appearance-none border-2 border-gray-600 bg-white rounded checked:bg-white checked:border-gray-600 checked:after:content-['✓'] checked:after:text-gray-600 checked:after:text-xs checked:after:flex checked:after:items-center checked:after:justify-center"
                    checked={selectedRequirementIds.length === filteredRequirements.length && filteredRequirements.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRequirementIds(filteredRequirements.map(r => r.id));
                      } else {
                        setSelectedRequirementIds([]);
                      }
                    }}
                  />
                </th>
                <th className="text-center py-1.5 px-2 font-medium text-gray-700 w-12">#</th>
                <th className="text-left py-1.5 px-2 font-medium text-gray-700">QR编号</th>
                <th className="text-left py-1.5 px-2 font-medium text-gray-700">来源单号</th>
                <th className="text-left py-1.5 px-2 font-medium text-gray-700">区域</th>
                <th className="text-center py-1.5 px-2 font-medium text-gray-700">产品数</th>
                <th className="text-left py-1.5 px-2 font-medium text-gray-700">要求日期</th>
                <th className="text-left py-1.5 px-2 font-medium text-gray-700">紧急程度</th>
                <th className="text-left py-1.5 px-2 font-medium text-gray-700">状态</th>
                <th className="text-center py-1.5 px-2 font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequirements.map((req, idx) => {
                const urgencyConfig = getUrgencyConfig(req.urgency);
                const itemCount = req.items?.length || 0;

                // 🔥 动态计算状态
                const dynamicStatus = calculateRequirementStatus(req);
                const hasLinkedXJ = hasDownstreamXJForRequirement(req);

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
                      <button
                        onClick={() => {
                          setViewRequirement(req);
                          setShowRequirementDialog(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-semibold"
                      >
                        {req.requirementNo}
                      </button>
                      <div className="text-[12px] text-gray-500">{req.createdDate}</div>
                    </td>
                    <td className="py-2 px-2">
                      <div className="text-gray-900">{req.source}</div>
                      {req.sourceRef && <div className="text-[12px] text-blue-600 font-mono">{req.sourceRef}</div>}
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
                      <div className="text-gray-900">{req.requiredDate}</div>
                    </td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[12px] border ${urgencyConfig.color}`}>
                        {urgencyConfig.label}
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
                          disabled={hasLinkedXJ}
                          className={`h-6 text-[12px] px-2 gap-1 ${
                            hasLinkedXJ
                              ? 'border-gray-200 text-gray-300 cursor-not-allowed'
                              : 'border-blue-300 text-blue-600 hover:bg-blue-50'
                          }`}
                          title="编辑报价请求单"
                        >
                          <Edit className="w-3 h-3" />
                          <span>编辑</span>
                        </Button>

                        {!hasLinkedXJ && (dynamicStatus === 'pending' || dynamicStatus === 'partial') && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleCreateRFQFromRequirement(req)}
                              className="h-6 text-[12px] bg-blue-600 hover:bg-blue-700 px-2"
                            >
                              创建询价单
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleCreateOrderFromRequirement(req)}
                              className="h-6 text-[12px] bg-[#F96302] hover:bg-[#E05502] px-2"
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

                        {/* 采购侧只保留下推业务员询报，不再显示"创建报价" */}
                        <Button
                          size="sm"
                          onClick={() => handlePushToSalesInquiry(req)}
                          disabled={!req.purchaserFeedback || !!req.pushedToQuotation}
                          className={`h-6 text-[12px] px-2 gap-1 ${
                            !req.purchaserFeedback || req.pushedToQuotation
                              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                              : 'bg-orange-500 hover:bg-orange-600 text-white'
                          }`}
                          title={
                            !req.purchaserFeedback
                              ? '请先完成智能对比建议并保存采购反馈'
                              : req.pushedToQuotation
                                ? '已下推业务员询报'
                                : '下推业务员询报'
                          }
                        >
                          <Calculator className="w-3 h-3" />
                          <span>{req.pushedToQuotation ? '已下推业务员询报' : '下推业务员询报'}</span>
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
    </TabsContent>
  );
};
