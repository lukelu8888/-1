import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Banknote,
  Brain,
  CalendarRange,
  ClipboardList,
  Eye,
  PieChart,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { MfModuleHeader } from '../components/MfModuleHeader';
import { useManagementFinance } from '../context/ManagementFinanceContext';
import type { MfAiJob, MfAiJobType } from '../types';

interface AiCapability {
  type: MfAiJobType;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  tone: string;
}

const AI_CAPABILITIES: AiCapability[] = [
  { type: 'profit_analysis',    title: 'AI 真实利润分析',    desc: '对单据级利润进行全成本归集与异常拆解，输出每单毛利驱动因素 / 改善建议', icon: PieChart,    tone: 'bg-emerald-50 text-emerald-700' },
  { type: 'expense_anomaly',    title: 'AI 费用异常检测',    desc: '识别报销/付款的金额、时间窗口、人员、关联订单异常，按 σ 阈值给出可疑度', icon: AlertTriangle, tone: 'bg-amber-50 text-amber-700' },
  { type: 'cashflow_forecast',  title: 'AI 现金流预测',      desc: '基于近 N 期 AR/AP/工资/税费/汇兑预测未来 4-12 周现金缺口与可释放节点',     icon: TrendingUp,  tone: 'bg-blue-50 text-blue-700' },
  { type: 'budget_forecast',    title: 'AI 预算预测',        desc: '基于历史执行 & 季节性预测 Q3/Q4 预算上下限，给出超预算概率',                 icon: CalendarRange,tone: 'bg-purple-50 text-purple-700' },
  { type: 'voucher_suggestion', title: 'AI 凭证建议',        desc: '对未归集的银行流水/费用申请建议借贷科目与成本中心，人工一键采纳',          icon: Banknote,    tone: 'bg-indigo-50 text-indigo-700' },
  { type: 'cost_attribution',   title: 'AI 成本归集',        desc: '将公共分摊费用按订单/项目/部门权重智能归集，可调权重模型',                 icon: ClipboardList,tone: 'bg-rose-50 text-rose-700' },
  { type: 'board_briefing',     title: 'AI 董事会简报',      desc: '一键生成 CEO/CFO 月度简报 PDF：业务亮点、风险、KPI、行动建议',              icon: Sparkles,    tone: 'bg-slate-100 text-slate-800' },
];

export function AiAnalyticsModule() {
  const { aiJobs, enqueueAiJob, refreshSlice } = useManagementFinance();
  const [activeJob, setActiveJob] = useState<MfAiJob | null>(null);

  const onRun = async (type: MfAiJobType) => {
    await enqueueAiJob(type, {});
    await refreshSlice('ai_jobs');
  };

  return (
    <div>
      <MfModuleHeader
        title="AI 经营分析中心"
        subtitle="AI 驱动的 ERP 财务大脑。所有作业落库 mf_ai_jobs，可审计、可回放、可计费。"
        badge={<Badge className="h-7 border-indigo-200 bg-indigo-50 px-2.5 text-[12px] text-indigo-700">GPT-Edge 已对接</Badge>}
      />

      <div className="space-y-3 p-3">
        {/* Capability tiles */}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
          {AI_CAPABILITIES.map((c) => {
            const Icon = c.icon;
            const recent = aiJobs.find((j) => j.job_type === c.type);
            return (
              <div key={c.type} className="flex flex-col gap-2 rounded border border-slate-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded p-1.5 ${c.tone}`}>
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[13px] font-semibold text-slate-800">{c.title}</span>
                  </div>
                  {recent ? (
                    <Badge className={`h-7 border-0 px-2.5 text-[12px] ${jobStatusTone(recent.status)}`}>
                      {jobStatusLabel(recent.status)}
                    </Badge>
                  ) : null}
                </div>
                <p className="text-[12px] leading-snug text-slate-500">{c.desc}</p>
                {recent ? (
                  <div className="rounded border border-slate-100 bg-slate-50/60 p-2 text-[12px] text-slate-600">
                    <div className="line-clamp-2 leading-snug">{recent.result_summary ?? '尚无摘要'}</div>
                    <div className="mt-1 flex items-center justify-between text-[12px] text-slate-400">
                      <span>{new Date(recent.created_at).toLocaleString('zh-CN')}</span>
                      <span>
                        Tokens {recent.cost_tokens?.toLocaleString() ?? 0} · ${recent.cost_usd?.toFixed(2) ?? '0.00'}
                      </span>
                    </div>
                  </div>
                ) : null}
                <div className="mt-auto flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-8 flex-1 gap-1.5 border-slate-200 text-[13px]" onClick={() => onRun(c.type)}>
                    <Brain className="h-3 w-3" /> 运行
                  </Button>
                  {recent ? (
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 border-slate-200 text-[13px]" onClick={() => setActiveJob(recent)}>
                      <Eye className="h-3 w-3" /> 详情
                    </Button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded border border-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-[13px] font-semibold text-slate-800">
            最近作业（{aiJobs.length}）
          </div>
          <div className="divide-y divide-slate-100">
            {aiJobs.map((j) => (
              <div key={j.id} className="grid grid-cols-12 items-center gap-2 px-3 py-2">
                <div className="col-span-3">
                  <div className="text-[13px] font-semibold text-slate-800">{jobTypeLabel(j.job_type)}</div>
                  <div className="text-[12px] text-slate-400">{new Date(j.created_at).toLocaleString('zh-CN')}</div>
                </div>
                <div className="col-span-6 line-clamp-2 text-[12px] leading-snug text-slate-600">{j.result_summary ?? '—'}</div>
                <div className="col-span-2 text-center">
                  <Badge className={`h-7 border-0 px-2.5 text-[12px] ${jobStatusTone(j.status)}`}>{jobStatusLabel(j.status)}</Badge>
                  <div className="mt-0.5 text-[12px] text-slate-400">
                    {j.cost_tokens?.toLocaleString() ?? 0} tk · ${j.cost_usd?.toFixed(2) ?? '0.00'}
                  </div>
                </div>
                <div className="col-span-1 text-right">
                  <Button variant="ghost" size="sm" className="h-8 px-3 text-[13px]" onClick={() => setActiveJob(j)}>
                    <Eye className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {activeJob ? (
          <div className="rounded border border-indigo-200 bg-indigo-50/50 p-3 text-[12px] text-indigo-900">
            <div className="flex items-center gap-1.5 text-[13px] font-semibold text-indigo-900">
              <Activity className="h-3.5 w-3.5" /> 作业详情 · {jobTypeLabel(activeJob.job_type)}
            </div>
            <pre className="mt-1 whitespace-pre-wrap text-[12px] leading-snug text-indigo-900/90">
{JSON.stringify(
  {
    id: activeJob.id,
    status: activeJob.status,
    summary: activeJob.result_summary,
    started_at: activeJob.started_at,
    finished_at: activeJob.finished_at,
    cost_tokens: activeJob.cost_tokens,
    cost_usd: activeJob.cost_usd,
    parameters: activeJob.parameters,
    scope: activeJob.scope,
  },
  null,
  2,
)}
            </pre>
            <Button variant="ghost" size="sm" className="mt-2 h-8 px-3 text-[13px]" onClick={() => setActiveJob(null)}>
              收起
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function jobTypeLabel(t: string): string {
  return {
    profit_analysis: 'AI 真实利润分析',
    expense_anomaly: 'AI 费用异常检测',
    cashflow_forecast: 'AI 现金流预测',
    budget_forecast: 'AI 预算预测',
    voucher_suggestion: 'AI 凭证建议',
    cost_attribution: 'AI 成本归集',
    board_briefing: '董事会简报',
  }[t] ?? t;
}
function jobStatusLabel(s: string): string {
  return {
    queued: '排队中',
    running: '运行中',
    succeeded: '已完成',
    failed: '失败',
    cancelled: '已取消',
  }[s] ?? s;
}
function jobStatusTone(s: string): string {
  return {
    queued: 'bg-slate-100 text-slate-600',
    running: 'bg-indigo-50 text-indigo-700',
    succeeded: 'bg-emerald-50 text-emerald-700',
    failed: 'bg-rose-50 text-rose-700',
    cancelled: 'bg-slate-100 text-slate-500',
  }[s] ?? 'bg-slate-100 text-slate-600';
}
