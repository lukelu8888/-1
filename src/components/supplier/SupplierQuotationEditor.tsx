/**
 * 供应商报价单编辑器 — 专业成本核算模板
 *
 * 核算逻辑（以含税人民币出厂价为基准）：
 *
 * 一、出厂含税价（EXW 含税）
 *   出厂含税价 = 原材料 + 人工 + 制造费用 + 包装 + 管理费用 + 其他 + 利润
 *   其中所有成本项均为含税金额（增值税已含在内）
 *
 * 二、出厂不含税价（EXW 不含税）
 *   出厂不含税价 = 出厂含税价 ÷ (1 + 增值税率)
 *
 * 三、出口退税
 *   退税额/件 = 出厂不含税价 × 退税率
 *   退税后净成本 = 出厂含税价 − 退税额
 *
 * 四、FOB 报价（人民币）
 *   FOB(CNY) = 退税后净成本 + 国内运费 + 报关/港杂费 + 目标利润
 *
 * 五、FOB 报价（美元）
 *   FOB(USD) = FOB(CNY) ÷ 汇率
 *
 * 六、CIF 报价（美元）
 *   CIF(USD) = FOB(USD) + 海运费(USD) + 保险费(USD)
 *
 * 七、利润率定义（毛利率，行业标准）
 *   毛利率 = (报价 − 完全成本) ÷ 报价 × 100%
 *   完全成本 = 退税后净成本 + 国内运费 + 报关港杂
 */

import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '../ui/tooltip';
import {
  Calculator, Save, Send, X, TrendingUp, DollarSign, Package, Truck,
  Users, Settings, AlertCircle, Info, CheckCircle, ChevronDown, ChevronUp,
  RefreshCw, Percent, Globe, HelpCircle, Zap
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { supplierQuotationService } from '../../lib/supabaseService';
import { buildSourcePricingBasis } from '../../types/pricingBasis';

// ─── 带问号 Tooltip 的字段标签 ────────────────────────────────────────────────
interface FieldLabelProps {
  children: React.ReactNode;
  tip: React.ReactNode;        // 解释文字
  formula?: React.ReactNode;   // 计算公式（可选）
  className?: string;
}
const FieldLabel: React.FC<FieldLabelProps> = ({ children, tip, formula, className = '' }) => (
  <TooltipProvider delayDuration={100}>
    <Tooltip>
      <div className={`flex items-center gap-0.5 ${className}`}>
        <span className="text-[11px] text-slate-600 leading-none">{children}</span>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex items-center text-slate-400 hover:text-blue-500 transition-colors focus:outline-none" tabIndex={-1}>
            <HelpCircle className="w-3 h-3" />
          </button>
        </TooltipTrigger>
      </div>
      <TooltipContent
        side="top"
        className="max-w-xs bg-slate-900 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-[9999]"
      >
        <div className="space-y-1.5">
          <p className="leading-relaxed">{tip}</p>
          {formula && (
            <div className="border-t border-slate-600 pt-1.5">
              <p className="text-slate-300 text-[10px] font-semibold mb-0.5">计算公式</p>
              <div className="text-slate-100 font-mono text-[10px] leading-relaxed">{formula}</div>
            </div>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

interface SupplierQuotationEditorProps {
  quotation: any;
  onSave: (updatedQuotation: any) => void;
  onCancel: () => void;
}

// ─── 税务与汇率设置 ────────────────────────────────────────────────────────────
interface TaxSettings {
  vatRate: number;          // 增值税率 %（常见：13% 一般货物，9% 农产品/建材，6% 服务）
  exportRebateRate: number; // 出口退税率 %（0~13%，视商品 HS 编码）
  hasExportRebate: boolean; // 是否享受出口退税
  usdRate: number;          // 人民币兑美元汇率（如 7.25）
  eurRate: number;          // 人民币兑欧元汇率
}

// ─── 成本结构（含税人民币，单件） ─────────────────────────────────────────────
interface CostBreakdown {
  material: number;      // 原材料（含税）
  labor: number;         // 直接人工
  manufacturing: number; // 制造费用（水电、折旧、维修）
  packaging: number;     // 包装费用
  overhead: number;      // 管理费用（含销售、财务、行政）
  other: number;         // 其他（认证、检测、保险等）
  // 国内出口附加费（仅 FOB/CIF 需要）
  domesticFreight: number;  // 国内运费（工厂→港口）
  customsClearance: number; // 报关/港杂费
  // 海运（仅 CIF 需要）
  seaFreight: number;    // 海运费（USD/件，系统自动换算）
  insurance: number;     // 保险费（USD/件）
}

// ─── 报价模式 ─────────────────────────────────────────────────────────────────
type QuoteMode = 'EXW_CNY' | 'FOB_CNY' | 'FOB_USD' | 'CIF_USD';

const QUOTE_MODE_LABELS: Record<QuoteMode, string> = {
  EXW_CNY: 'EXW（工厂交货，人民币）',
  FOB_CNY: 'FOB（离岸价，人民币）',
  FOB_USD: 'FOB（离岸价，美元）',
  CIF_USD: 'CIF（到岸价，美元）',
};

const EMPTY_COST = (): CostBreakdown => ({
  material: 0, labor: 0, manufacturing: 0, packaging: 0,
  overhead: 0, other: 0, domesticFreight: 0, customsClearance: 0,
  seaFreight: 0, insurance: 0,
});

// ─── 工具函数 ─────────────────────────────────────────────────────────────────
const n = (v: string | number | undefined): number => parseFloat(String(v ?? 0)) || 0;
const pct = (v: number) => `${v.toFixed(1)}%`;
const fmt = (v: number, decimals = 2) => v.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });

function calcForItem(cost: CostBreakdown, tax: TaxSettings, mode: QuoteMode) {
  const vatRate = tax.vatRate / 100;
  const rebateRate = tax.hasExportRebate ? tax.exportRebateRate / 100 : 0;

  // 1. 出厂含税价（EXW 含税）= 所有制造成本之和
  const exwIncl = cost.material + cost.labor + cost.manufacturing + cost.packaging + cost.overhead + cost.other;

  // 2. 出厂不含税价
  const exwExcl = exwIncl / (1 + vatRate);

  // 3. 退税额（基于不含税价）
  const rebate = exwExcl * rebateRate;

  // 4. 退税后净成本（出口商实际承担的成本）
  const netCostAfterRebate = exwIncl - rebate;

  // 5. FOB 完全成本（含国内运费+报关）
  const fobFullCostCNY = netCostAfterRebate + cost.domesticFreight + cost.customsClearance;

  // 6. 各模式下的完全成本（用于利润计算）
  let fullCost: number;
  let currencySymbol: string;
  let currencyCode: string;

  if (mode === 'EXW_CNY') {
    fullCost = exwIncl;
    currencySymbol = '¥'; currencyCode = 'CNY';
  } else if (mode === 'FOB_CNY') {
    fullCost = fobFullCostCNY;
    currencySymbol = '¥'; currencyCode = 'CNY';
  } else if (mode === 'FOB_USD') {
    fullCost = fobFullCostCNY / tax.usdRate;
    currencySymbol = '$'; currencyCode = 'USD';
  } else {
    // CIF_USD
    fullCost = fobFullCostCNY / tax.usdRate + cost.seaFreight + cost.insurance;
    currencySymbol = '$'; currencyCode = 'USD';
  }

  return {
    exwIncl, exwExcl, rebate, netCostAfterRebate, fobFullCostCNY,
    fullCost, currencySymbol, currencyCode,
  };
}

// ─── 快速填充预设（基于出厂价百分比） ─────────────────────────────────────────
function quickFillPreset(basePrice: number, mode: QuoteMode): CostBreakdown {
  // 典型中国制造业成本结构
  return {
    material: basePrice * 0.48,
    labor: basePrice * 0.12,
    manufacturing: basePrice * 0.10,
    packaging: basePrice * 0.05,
    overhead: basePrice * 0.08,
    other: basePrice * 0.02,
    domesticFreight: mode !== 'EXW_CNY' ? basePrice * 0.03 : 0,
    customsClearance: mode !== 'EXW_CNY' ? basePrice * 0.02 : 0,
    seaFreight: mode === 'CIF_USD' ? 0.5 : 0,   // USD/件，需用户调整
    insurance: mode === 'CIF_USD' ? 0.1 : 0,
  };
}

// ─── 各成本字段的 tooltip 定义 ────────────────────────────────────────────────
const COST_TIPS: Record<keyof CostBreakdown, { tip: string; formula?: string }> = {
  material:         { tip: '生产该产品所消耗的原材料、零部件、辅料等直接材料的含税采购成本。通常占制造成本的 45–60%。', formula: '原材料成本 = 单位用料量 × 含税单价' },
  labor:            { tip: '直接参与生产的工人工资、社保、福利等人工费用，按单件分摊。通常占 10–18%。', formula: '直接人工 = 工时 × 工时单价（含社保）' },
  manufacturing:    { tip: '生产过程中的间接费用，包括水电费、设备折旧、厂房租金、维修费等，按产量分摊。通常占 8–15%。', formula: '制造费用 = 月度间接费用总额 ÷ 月产量' },
  packaging:        { tip: '出口包装所需的纸箱、泡沫、托盘、标签等包装材料及人工费用。出口品要求较高，通常占 4–8%。', formula: '包装费用 = 包材成本 + 包装人工' },
  overhead:         { tip: '企业管理、销售、财务等间接费用的分摊，包括管理人员薪资、办公费、差旅费、质检费等。通常占 6–12%。', formula: '管理费用 = 月度管理总费用 ÷ 月产量' },
  other:            { tip: '产品认证费（CE/RoHS/UL）、第三方检测费、专利费、样品费等其他杂项成本。通常占 1–5%。', formula: '其他费用 = 年度认证/检测费 ÷ 年产量' },
  domesticFreight:  { tip: '从工厂到出口港口的国内运输费用，包括陆运、装卸、仓储等，按单件分摊。通常占 FOB 价的 2–5%。', formula: '国内运费 = 整批运费 ÷ 批次数量' },
  customsClearance: { tip: '出口报关费、港口操作费（THC）、提单费、商检费、熏蒸费等出口手续费用，按单件分摊。', formula: '报关港杂 = 批次杂费合计 ÷ 批次数量' },
  seaFreight:       { tip: 'CIF 条款下，卖方承担的从出口港到目的港的海运费，以美元/件计算。需根据货物体积重量和航线询价。', formula: '海运费/件 = 整柜运费 ÷ 装箱数量' },
  insurance:        { tip: 'CIF 条款下，卖方为货物投保的海运货物保险费，通常为货值的 0.1–0.3%，以美元/件计算。', formula: '保险费/件 = 货值 × 保险费率（约0.2%）' },
};

// ─── 成本输入行组件 ────────────────────────────────────────────────────────────
const CostRow: React.FC<{
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  field: keyof CostBreakdown;
  costs: CostBreakdown;
  total: number;
  currencySymbol: string;
  onChange: (field: keyof CostBreakdown, val: number) => void;
}> = ({ icon, label, sublabel, field, costs, total, currencySymbol, onChange }) => {
  const val = costs[field];
  const share = total > 0 ? (val / total) * 100 : 0;
  const tipData = COST_TIPS[field];
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-0.5 text-[11px] text-slate-600">
        {icon}
        <FieldLabel tip={tipData.tip} formula={tipData.formula}>
          {label}{sublabel && <span className="text-slate-400 font-normal ml-0.5">({sublabel})</span>}
        </FieldLabel>
      </div>
      <div className="relative">
        <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{currencySymbol}</span>
        <Input
          type="number"
          value={val || ''}
          onChange={(e) => onChange(field, n(e.target.value))}
          placeholder="0.00"
          className="h-7 text-xs pl-5"
          step="0.01"
          min="0"
        />
      </div>
      <div className="text-[10px] text-slate-400">{pct(share)}</div>
    </div>
  );
};

// ─── 主组件 ───────────────────────────────────────────────────────────────────
export default function SupplierQuotationEditor({ quotation, onSave, onCancel }: SupplierQuotationEditorProps) {

  // ── 报价方式：简单 or 详细 ──
  const [pricingMode, setPricingMode] = useState<'simple' | 'detailed'>(
    quotation.pricingMode || 'simple'
  );

  // ── 税务与汇率（默认：含税、不退税，符合工厂出厂含税价场景） ──
  const [tax, setTax] = useState<TaxSettings>({
    vatRate: 13,
    exportRebateRate: 0,
    hasExportRebate: false,
    usdRate: 7.25,
    eurRate: 7.85,
  });

  // ── 报价模式（默认 EXW 含税人民币） ──
  const [quoteMode, setQuoteMode] = useState<QuoteMode>('EXW_CNY');

  // ── 每件单价（最终报价，用户可直接输入或从建议价填入） ──
  const [itemPrices, setItemPrices] = useState<Record<string, string>>(
    quotation.items?.reduce((acc: any, item: any) => {
      acc[item.id] = item.unitPrice?.toString() || '';
      return acc;
    }, {}) || {}
  );

  // ── 成本结构（每件） ──
  const [itemCosts, setItemCosts] = useState<Record<string, CostBreakdown>>(
    quotation.items?.reduce((acc: any, item: any) => {
      acc[item.id] = item.costBreakdown || EMPTY_COST();
      return acc;
    }, {}) || {}
  );

  // ── 目标毛利率 ──
  const [targetMargins, setTargetMargins] = useState<Record<string, string>>(
    quotation.items?.reduce((acc: any, item: any) => {
      acc[item.id] = item.targetMargin?.toString() || '20';
      return acc;
    }, {}) || {}
  );

  // ── 简单报价：每件出厂含税成本（供应商自己知道的成本价） ──
  const [simpleCosts, setSimpleCosts] = useState<Record<string, string>>(
    quotation.items?.reduce((acc: any, item: any) => {
      acc[item.id] = item.simpleCost?.toString() || '';
      return acc;
    }, {}) || {}
  );

  // ── 利润率类型：加成率（markup）或毛利率（gross） ──
  // 加成率 = 利润 ÷ 成本（100% = 成本翻倍，更直观）
  // 毛利率 = 利润 ÷ 售价（财务报表常用，上限<100%）
  const [marginType, setMarginType] = useState<'markup' | 'gross'>(
    quotation.marginType || 'markup'
  );

  // ── 展开状态 ──
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  // ── 交易条款 ──
  const [leadTime, setLeadTime] = useState(quotation.items?.[0]?.leadTime?.toString() || '30');
  const [moq, setMoq] = useState(quotation.items?.[0]?.moq?.toString() || '1000');
  const [paymentTerms, setPaymentTerms] = useState(quotation.paymentTerms || 'T/T 30% 预付，70% 发货前');
  const [deliveryTerms, setDeliveryTerms] = useState(quotation.deliveryTerms || 'FOB 厦门');
  const [remarks, setRemarks] = useState(quotation.generalRemarks || '');
  const [supplierRemarks, setSupplierRemarks] = useState(quotation.supplierRemarks || '');

  // ── 货币符号 ──
  const currencySymbol = (quoteMode === 'EXW_CNY' || quoteMode === 'FOB_CNY') ? '¥' : '$';
  const currencyCode = (quoteMode === 'EXW_CNY' || quoteMode === 'FOB_CNY') ? 'CNY' : 'USD';

  // ── 更新单件成本 ──
  const updateCost = useCallback((itemId: string, field: keyof CostBreakdown, val: number) => {
    setItemCosts(prev => ({ ...prev, [itemId]: { ...prev[itemId], [field]: val } }));
  }, []);

  // ── 计算每件的核算结果 ──
  const calcItem = useCallback((itemId: string) => {
    const cost = itemCosts[itemId] || EMPTY_COST();
    return calcForItem(cost, tax, quoteMode);
  }, [itemCosts, tax, quoteMode]);

  // ═══════════════════════════════════════════════════════════════════════════
  // 严格财务定义（ERP级别，不允许混淆）
  //
  // 【毛利率 Gross Margin】
  //   定义：毛利率 = (售价 - 成本) ÷ 售价
  //   推导：售价 = 成本 ÷ (1 - 毛利率)
  //   约束：毛利率 ∈ [0, 100%)，等于100%时公式无解（分母为0），必须报错
  //
  // 【加成率 Markup Rate】
  //   定义：加成率 = (售价 - 成本) ÷ 成本
  //   推导：售价 = 成本 × (1 + 加成率)
  //   约束：加成率 ≥ 0，无上限限制（100%即翻倍，200%即三倍）
  //
  // 【两者换算关系】
  //   已知加成率 → 毛利率 = 加成率 ÷ (1 + 加成率)
  //   已知毛利率 → 加成率 = 毛利率 ÷ (1 - 毛利率)
  //
  // 验证：
  //   成本=10，加成率=100% → 售价=10×(1+1)=20，毛利率=(20-10)/20=50%  ✓
  //   成本=10，毛利率=50%  → 售价=10÷(1-0.5)=20，加成率=(20-10)/10=100% ✓
  //   成本=10，毛利率=100% → 售价=10÷0=∞，必须报错                      ✓
  // ═══════════════════════════════════════════════════════════════════════════

  // ── 毛利率模式有效性检查 ──
  const isGrossMarginValid = useCallback((itemId: string): boolean => {
    if (marginType !== 'gross') return true;
    const gm = n(targetMargins[itemId]);
    return gm >= 0 && gm < 100;
  }, [marginType, targetMargins]);

  // ── 建议报价（详细模式用，基于 calcItem 完全成本） ──
  const suggestedPrice = useCallback((itemId: string): number => {
    const { fullCost } = calcItem(itemId);
    if (fullCost <= 0) return 0;
    const rate = n(targetMargins[itemId]) / 100;
    if (marginType === 'markup') {
      // 【加成率模式】售价 = 成本 × (1 + 加成率)
      return fullCost * (1 + rate);
    } else {
      // 【毛利率模式】售价 = 成本 ÷ (1 - 毛利率)
      // 毛利率必须 < 100%，否则公式无解
      if (rate >= 1) return 0; // 无效，UI层已拦截
      return fullCost / (1 - rate);
    }
  }, [calcItem, targetMargins, marginType]);

  // ── 实际毛利率（财务定义：利润÷售价） ──
  const actualMargin = useCallback((itemId: string): number => {
    const price = n(itemPrices[itemId]);
    const { fullCost } = calcItem(itemId);
    if (price <= 0) return 0;
    // 毛利率 = (售价 - 成本) ÷ 售价
    return ((price - fullCost) / price) * 100;
  }, [itemPrices, calcItem]);

  // ── 简单模式核算（严格财务定义） ──
  const simpleCalc = useCallback((itemId: string) => {
    // 1. 税务推导
    const costIncl = n(simpleCosts[itemId]);
    const vatRate = tax.vatRate / 100;
    const rebateRate = tax.hasExportRebate ? tax.exportRebateRate / 100 : 0;
    const exwExcl = costIncl / (1 + vatRate);       // 不含税价 = 含税价 ÷ (1 + 税率)
    const rebate  = exwExcl * rebateRate;            // 退税额 = 不含税价 × 退税率
    const netCost = costIncl - rebate;               // 退税后净成本 = 含税价 - 退税额

    // 2. 完全成本（按贸易术语）
    let fullCost: number;
    if      (quoteMode === 'EXW_CNY') fullCost = costIncl;                    // EXW：完全成本 = 出厂含税价
    else if (quoteMode === 'FOB_CNY') fullCost = netCost;                     // FOB CNY：退税后净成本（不含国内运费，由用户在详细模式补充）
    else if (quoteMode === 'FOB_USD') fullCost = netCost / tax.usdRate;       // FOB USD：换算美元
    else                              fullCost = netCost / tax.usdRate;       // CIF USD：基础同FOB，海运险由详细模式补充

    // 3. 建议报价（严格公式）
    const rate = n(targetMargins[itemId]) / 100;
    let suggested = 0;
    let grossMarginError = false;

    if (fullCost > 0) {
      if (marginType === 'markup') {
        // 【加成率】售价 = 成本 × (1 + 加成率)
        // 无上限限制，100% = 翻倍，200% = 三倍
        suggested = fullCost * (1 + rate);
      } else {
        // 【毛利率】售价 = 成本 ÷ (1 - 毛利率)
        // 严格约束：毛利率必须 < 100%
        if (rate >= 1) {
          grossMarginError = true; // 触发错误，不计算
          suggested = 0;
        } else {
          suggested = fullCost / (1 - rate);
        }
      }
    }

    // 4. 实际报价的反算（用于利润分析）
    const price = n(itemPrices[itemId]);
    const effectivePrice = price > 0 ? price : suggested;

    // 毛利率（财务定义）= (售价 - 成本) ÷ 售价
    const actualGrossMargin = effectivePrice > 0
      ? ((effectivePrice - fullCost) / effectivePrice) * 100
      : 0;

    // 加成率（财务定义）= (售价 - 成本) ÷ 成本
    const actualMarkupRate = fullCost > 0
      ? ((effectivePrice - fullCost) / fullCost) * 100
      : 0;

    return {
      costIncl, exwExcl, rebate, netCost, fullCost,
      suggested, grossMarginError,
      actualGrossMargin, actualMarkupRate,
    };
  }, [simpleCosts, tax, quoteMode, targetMargins, itemPrices, marginType]);

  // ── 汇总 ──
  const totals = quotation.items?.reduce((acc: any, item: any) => {
    let fullCost: number;
    let price: number;
    if (pricingMode === 'simple') {
      const sc = simpleCalc(item.id);
      fullCost = sc.fullCost;
      price = n(itemPrices[item.id]) || sc.suggested;
    } else {
      fullCost = calcItem(item.id).fullCost;
      price = n(itemPrices[item.id]);
    }
    acc.revenue += price * item.quantity;
    acc.cost += fullCost * item.quantity;
    return acc;
  }, { revenue: 0, cost: 0 }) || { revenue: 0, cost: 0 };
  const totalProfit = totals.revenue - totals.cost;
  const overallGrossMargin = totals.revenue > 0 ? (totalProfit / totals.revenue) * 100 : 0;
  const overallMarkup = totals.cost > 0 ? (totalProfit / totals.cost) * 100 : 0;
  const overallMargin = overallGrossMargin; // 向后兼容

  // ── 表单有效性 ──
  const isFormValid = () => {
    const pricesOk = pricingMode === 'simple'
      ? quotation.items?.every((item: any) => n(simpleCosts[item.id]) > 0 && n(targetMargins[item.id]) > 0)
      : quotation.items?.every((item: any) => n(itemPrices[item.id]) > 0);
    return pricesOk && n(leadTime) > 0 && n(moq) > 0 && paymentTerms.trim() && deliveryTerms.trim();
  };

  // ── 保存 ──
  const handleSave = async (submitNow: boolean) => {
    if (submitNow && !isFormValid()) {
      toast.error('请填写所有必填项（单价、交货期、MOQ、付款方式、交货条款）');
      return;
    }
    const updatedQuotation = {
      ...quotation,
      pricingMode,
      marginType,
      currency: currencyCode,
      quoteMode,
      taxSettings: tax,
      items: quotation.items.map((item: any) => {
        let price: number;
        let costDetail: any;
        let targetMgn: number;
        let actualMgn: number;

        if (pricingMode === 'simple') {
          const sc = simpleCalc(item.id);
          // Auto-apply suggested price if user hasn't manually set one
          price = n(itemPrices[item.id]) > 0 ? n(itemPrices[item.id]) : sc.suggested;
          costDetail = { simpleCost: n(simpleCosts[item.id]), ...sc };
          targetMgn = n(targetMargins[item.id]);
          actualMgn = price > 0 ? ((price - sc.fullCost) / price) * 100 : 0;
        } else {
          const calc = calcItem(item.id);
          price = n(itemPrices[item.id]);
          costDetail = { costBreakdown: itemCosts[item.id], calcDetail: calc };
          targetMgn = n(targetMargins[item.id]);
          actualMgn = actualMargin(item.id);
        }

        // 将 quoteMode 转成下游统一的 priceType 标识
        // EXW_CNY / FOB_CNY → cny_with_tax（含税人民币出厂价）
        // FOB_USD / CIF_USD → usd
        const derivedPriceType: 'usd' | 'cny_with_tax' | 'cny_no_tax' =
          quoteMode === 'FOB_USD' || quoteMode === 'CIF_USD' ? 'usd' : 'cny_with_tax';
        const pricingBasis = buildSourcePricingBasis({
          unitPrice: price,
          currency: currencyCode,
          priceType: derivedPriceType,
          quoteMode,
          deliveryTerms,
          sourceDocumentNo: quotation.quotationNo,
          supplierQuotationNo: quotation.quotationNo,
          taxSettings: tax,
          sourceFreightUSD: itemCosts[item.id]?.seaFreight,
          sourceInsuranceUSD: itemCosts[item.id]?.insurance,
        });

        return {
          ...item,
          unitPrice: price,
          amount: price * item.quantity,
          currency: currencyCode,
          // 🔥 价格属性：随 item 全程传递，不再丢失
          priceType: derivedPriceType,
          quoteMode,          // 原始贸易术语（EXW_CNY / FOB_USD 等）
          taxSettings: tax,   // 完整税务参数（含税率、退税率、汇率）
          pricingBasis,       // 结构化价格语义，供下游锁定源条款
          leadTime: n(leadTime),
          moq: n(moq),
          simpleCost: pricingMode === 'simple' ? n(simpleCosts[item.id]) : undefined,
          costBreakdown: pricingMode === 'detailed' ? itemCosts[item.id] : undefined,
          targetMargin: targetMgn,
          actualMargin: actualMgn,
          ...costDetail,
        };
      }),
      totalAmount: totals.revenue,
      totalCost: totals.cost,
      totalProfit,
      // 毛利率（Gross Margin）= 利润 ÷ 售价
      overallGrossMargin,
      // 加成率（Markup Rate）= 利润 ÷ 成本
      overallMarkup,
      overallMargin: overallGrossMargin, // 向后兼容
      paymentTerms,
      deliveryTerms,
      generalRemarks: remarks,
      supplierRemarks,
      status: submitNow ? 'submitted' : 'draft',
      version: (quotation.version || 0) + 1,
    };

    if (submitNow) {
      try {
        await supplierQuotationService.upsert({
          id: updatedQuotation.id,
          xjNumber: updatedQuotation.sourceXJ,
          supplierEmail: updatedQuotation.supplierEmail,
          supplierName: updatedQuotation.supplierName,
          currency: currencyCode,
          totalAmount: totals.revenue,
          paymentTerms,
          deliveryTime: deliveryTerms,
          status: 'submitted',
          products: updatedQuotation.items,
          notes: remarks ?? '',
        });
      } catch (err: any) {
        toast.error(err?.message ?? '提交报价失败，请重试');
        return;
      }
    }

    onSave(updatedQuotation);
    toast.success(
      <div className="space-y-1">
        <p className="font-semibold">✅ {submitNow ? '报价单已提交' : '草稿已保存'}</p>
        <p className="text-sm">报价单号: {quotation.quotationNo}</p>
        <p className="text-sm">总金额: {currencySymbol}{fmt(totals.revenue)}</p>
      </div>,
      { duration: 4000 }
    );
  };

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 text-sm">

      {/* ① 顶部信息 */}
      <div className="grid grid-cols-4 gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
        {[
          ['报价单号', quotation.quotationNo],
          ['询价单号', quotation.sourceXJ],
          ['客户', quotation.customerName],
          ['报价日期', quotation.quotationDate],
        ].map(([label, val]) => (
          <div key={label}>
            <div className="text-xs text-blue-600 mb-0.5">{label}</div>
            <div className="font-semibold text-sm truncate">{val}</div>
          </div>
        ))}
      </div>

      {/* ② 报价方式选择 */}
      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
        <span className="text-sm font-semibold text-slate-700 shrink-0">报价方式：</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setPricingMode('simple')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
              pricingMode === 'simple'
                ? 'bg-green-600 text-white border-green-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-300 hover:border-green-400'
            }`}
          >
            <Zap className="w-4 h-4" />
            <div className="text-left">
              <div>简单报价</div>
              <div className={`text-[10px] font-normal ${pricingMode === 'simple' ? 'text-green-100' : 'text-slate-400'}`}>填成本价 + 利润率，一键生成报价</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setPricingMode('detailed')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
              pricingMode === 'detailed'
                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <div className="text-left">
              <div>详细报价</div>
              <div className={`text-[10px] font-normal ${pricingMode === 'detailed' ? 'text-blue-100' : 'text-slate-400'}`}>逐项拆分成本，精确核算利润</div>
            </div>
          </button>
        </div>
        <div className="ml-auto text-xs text-slate-400">
          {pricingMode === 'simple' ? '💡 适合快速报价，系统自动完成税务推导' : '💡 适合精细核算，支持多种成本项目拆分'}
        </div>
      </div>

      {/* ③ 核算参数设置（报价条件，两种模式共用） */}
      <div className="border-2 border-amber-200 rounded-lg overflow-hidden">
        <div className="bg-amber-50 px-3 py-2 border-b border-amber-200 flex items-center gap-2">
          <Settings className="w-4 h-4 text-amber-600" />
          <span className="font-semibold text-amber-900 text-sm">报价条件设置</span>
          <span className="text-xs text-amber-600 ml-1">（两种报价方式均需先设置）</span>
        </div>
        <div className="p-3 bg-white">
          <div className="grid grid-cols-3 gap-x-6 gap-y-3">

            {/* 报价模式 */}
            <div className="col-span-3">
              <div className="mb-1"><FieldLabel tip="选择向买方报价时使用的国际贸易术语（Incoterms）和货币。不同术语决定了哪些费用由卖方承担，直接影响报价金额。" formula={"EXW：工厂交货，买方承担所有费用\nFOB：卖方负责到出口港装船\nCIF：卖方负责运费+保险到目的港"}>报价模式（贸易术语 + 货币）</FieldLabel></div>
              <div className="flex gap-2 flex-wrap">
                {(Object.keys(QUOTE_MODE_LABELS) as QuoteMode[]).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setQuoteMode(mode)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      quoteMode === mode
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'
                    }`}
                  >
                    {QUOTE_MODE_LABELS[mode]}
                  </button>
                ))}
              </div>
            </div>

            {/* 增值税率 */}
            <div>
              <div className="flex items-center gap-1">
                <Percent className="w-3 h-3 text-slate-500" />
                <FieldLabel tip="增值税（VAT）是中国境内销售商品时征收的流转税。成本录入时使用含税价，系统自动推导不含税价。出口时可申请退税。" formula={"不含税价 = 含税价 ÷ (1 + 税率)\n常见税率：一般货物13%，建材/农产品9%，服务6%"}>增值税率 (VAT)</FieldLabel>
              </div>
              <div className="flex gap-1 mt-1">
                {[13, 9, 6].map(r => (
                  <button key={r} type="button"
                    onClick={() => setTax(t => ({ ...t, vatRate: r }))}
                    className={`flex-1 py-1 text-xs rounded border ${tax.vatRate === r ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'}`}
                  >{r}%</button>
                ))}
                <div className="relative flex-1">
                  <Input type="number" value={tax.vatRate} onChange={e => setTax(t => ({ ...t, vatRate: n(e.target.value) }))}
                    className="h-7 text-xs text-center" step="1" min="0" max="17" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">一般货物13%，建材/农产品9%，服务6%</p>
            </div>

            {/* 出口退税 */}
            <div>
              <div className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-slate-500" />
                <FieldLabel tip="出口退税是国家对出口商品退还已缴纳增值税的政策，降低出口成本、提升竞争力。退税率因商品 HS 编码不同而异，部分商品（如木材、矿产）不享受退税。" formula={"退税额 = 出厂不含税价 × 退税率\n退税后净成本 = 出厂含税价 − 退税额\n（退税率 ≤ 增值税率，最高与增值税率相同）"}>出口退税率</FieldLabel>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <button type="button"
                  onClick={() => setTax(t => ({ ...t, hasExportRebate: !t.hasExportRebate }))}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${tax.hasExportRebate ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-500 border-slate-300'}`}
                >
                  {tax.hasExportRebate ? '✓ 享受退税' : '✗ 不退税'}
                </button>
                {tax.hasExportRebate && (
                  <div className="flex gap-1 flex-1">
                    {[13, 9, 5, 0].map(r => (
                      <button key={r} type="button"
                        onClick={() => setTax(t => ({ ...t, exportRebateRate: r }))}
                        className={`flex-1 py-1 text-xs rounded border ${tax.exportRebateRate === r ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 border-slate-300 hover:border-green-400'}`}
                      >{r}%</button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {tax.hasExportRebate
                  ? `退税额 = 不含税价 × ${tax.exportRebateRate}%，降低出口成本`
                  : '部分商品（如木材、矿产）不享受退税'}
              </p>
            </div>

            {/* 汇率 */}
            <div>
              <div className="flex items-center gap-1">
                <Globe className="w-3 h-3 text-slate-500" />
                <FieldLabel tip="人民币兑外币的汇率，用于将人民币成本换算为美元/欧元报价。建议使用当日中国银行中间价，汇率波动会直接影响外币报价的利润。" formula={"FOB(USD) = FOB完全成本(CNY) ÷ USD汇率\nCIF(USD) = FOB(USD) + 海运费 + 保险费"}>汇率设置</FieldLabel>
              </div>
              <div className="grid grid-cols-2 gap-1 mt-1">
                <div>
                  <div className="text-[10px] text-slate-500 mb-0.5">USD/CNY</div>
                  <Input type="number" value={tax.usdRate}
                    onChange={e => setTax(t => ({ ...t, usdRate: n(e.target.value) }))}
                    className="h-7 text-xs" step="0.01" min="1" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 mb-0.5">EUR/CNY</div>
                  <Input type="number" value={tax.eurRate}
                    onChange={e => setTax(t => ({ ...t, eurRate: n(e.target.value) }))}
                    className="h-7 text-xs" step="0.01" min="1" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">请填写当日银行中间价</p>
            </div>

          </div>
        </div>
      </div>

      {/* ④ 汇总指标 */}
      <div className="grid grid-cols-4 gap-2">
        {([
          { label: '报价总额', value: `${currencySymbol}${fmt(totals.revenue)}`, color: 'orange', icon: <DollarSign className="w-4 h-4" />, tip: '所有产品的单价 × 数量之和，即向买方报出的总金额。', formula: '报价总额 = Σ (单价 × 数量)' },
          { label: '完全成本', value: `${currencySymbol}${fmt(totals.cost)}`, color: 'red', icon: <Package className="w-4 h-4" />, tip: '包含退税后净成本、国内运费、报关港杂（及海运保险）的完整成本，是利润计算的基准。', formula: 'EXW: 完全成本 = 出厂含税价 − 退税额\nFOB: + 国内运费 + 报关港杂\nCIF: + 海运费 + 保险费（换算为报价货币）' },
          { label: '预估利润', value: `${currencySymbol}${fmt(totalProfit)}`, color: totalProfit >= 0 ? 'green' : 'red', icon: <TrendingUp className="w-4 h-4" />, tip: '报价总额减去完全成本后的毛利润，未扣除所得税。负数表示亏损。', formula: '预估利润 = 报价总额 − 完全成本' },
          { label: '综合毛利率 / 加成率',
            value: `${overallGrossMargin.toFixed(1)}% / ${overallMarkup.toFixed(1)}%`,
            color: overallGrossMargin >= 15 ? 'green' : overallGrossMargin >= 8 ? 'yellow' : 'red',
            icon: <Percent className="w-4 h-4" />,
            tip: '同时显示两种财务指标，避免混淆。\n【毛利率 Gross Margin】= 利润 ÷ 售价\n【加成率 Markup Rate】= 利润 ÷ 成本',
            formula: `综合毛利率 = ${fmt(totalProfit)} ÷ ${fmt(totals.revenue)} × 100% = ${overallGrossMargin.toFixed(1)}%\n综合加成率 = ${fmt(totalProfit)} ÷ ${fmt(totals.cost)} × 100% = ${overallMarkup.toFixed(1)}%`,
          },
        ] as const).map(({ label, value, color, tip, formula, icon }) => (
          <div key={label} className={`bg-white border-2 border-${color}-200 rounded-lg p-3`}>
            <div className={`flex items-center gap-1 text-${color}-600 mb-1`}>
              {icon}
              <FieldLabel tip={tip} formula={formula}>{label}</FieldLabel>
            </div>
            <div className={`text-xl font-bold text-${color}-600`}>{value}</div>
          </div>
        ))}
      </div>

      {/* ⑤ 产品列表 */}
      <div className="space-y-2">
        {quotation.items?.map((item: any, index: number) => {
          const sc = simpleCalc(item.id);
          const calc = calcItem(item.id);
          const price = n(itemPrices[item.id]);
          const margin = pricingMode === 'simple' ? sc.actualGrossMargin : actualMargin(item.id);
          const suggested = pricingMode === 'simple' ? sc.suggested : suggestedPrice(item.id);
          const isExpanded = expandedItems[item.id] ?? true;

          const marginColor = margin >= 15 ? 'green' : margin >= 8 ? 'yellow' : 'red';

          return (
            <div key={item.id} className="border-2 border-slate-200 rounded-lg overflow-hidden">

              {/* 产品头 */}
              <div className="bg-slate-50 px-3 py-2 border-b border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <Badge variant="outline" className="text-xs font-bold shrink-0">#{index + 1}</Badge>
                  <span className="font-semibold text-sm truncate">{item.productName}</span>
                  {item.modelNo && <span className="text-xs text-slate-500 shrink-0">型号: {item.modelNo}</span>}
                </div>
                <div className="flex items-center gap-3 text-xs shrink-0 ml-2">
                  <span className="text-slate-500">数量: <strong>{item.quantity} {item.unit}</strong></span>
                  <button type="button" onClick={() => setExpandedItems(p => ({ ...p, [item.id]: !isExpanded }))}
                    className="text-slate-400 hover:text-slate-600">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="p-3 bg-white space-y-4">

                  {/* ── 简单报价面板 ── */}
                  {pricingMode === 'simple' && (
                    <div className="space-y-3">
                      {/* 第一行：成本输入 + 税务推导 + 毛利率 + 建议报价 */}
                      <div className="flex flex-wrap gap-3 items-end">

                        {/* 出厂含税成本 */}
                        <div className="w-44 shrink-0">
                          <FieldLabel
                            tip="您知道的该产品出厂含税成本价（含原材料、人工、制造、包装等所有成本，含增值税）。系统会根据报价条件自动推导净成本和报价。"
                            formula="出厂含税成本 = 所有成本项之和（含增值税）"
                          >
                            出厂含税成本（¥）
                          </FieldLabel>
                          <div className="relative mt-1">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">¥</span>
                            <Input
                              type="number"
                              value={simpleCosts[item.id] || ''}
                              onChange={e => setSimpleCosts(p => ({ ...p, [item.id]: e.target.value }))}
                              placeholder="请输入成本价"
                              className="h-9 text-sm font-semibold pl-5 border-2 border-slate-300"
                              step="0.01" min="0"
                            />
                          </div>
                        </div>

                        {/* 税务推导（只读展示，有成本时才显示） */}
                        {n(simpleCosts[item.id]) > 0 && (
                          <div className="flex gap-2 items-end">
                            <div className="text-[11px] text-slate-400 pb-2.5 shrink-0">→ 税务推导</div>
                            {[
                              { label: '不含税价', val: `¥${fmt(sc.exwExcl)}`, bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
                              { label: tax.hasExportRebate ? `退税 ×${tax.exportRebateRate}%` : '退税额', val: tax.hasExportRebate ? `+¥${fmt(sc.rebate)}` : '¥0', bg: 'bg-green-50', border: 'border-green-200', text: tax.hasExportRebate ? 'text-green-700' : 'text-slate-400' },
                              { label: '净成本', val: `¥${fmt(sc.netCost)}`, bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
                            ].map(({ label, val, bg, border, text }) => (
                              <div key={label} className={`${bg} ${border} border rounded-lg px-3 py-1.5 text-center min-w-[72px]`}>
                                <div className="text-[10px] text-slate-400">{label}</div>
                                <div className={`text-xs font-bold ${text}`}>{val}</div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 利润率类型 + 目标值 */}
                        <div className="shrink-0 space-y-1.5">
                          {/* 类型切换 */}
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-slate-500 shrink-0 font-medium">定价方式</span>
                            <div className="flex rounded border border-slate-300 overflow-hidden text-xs font-medium">
                              <button type="button" onClick={() => setMarginType('markup')}
                                className={`px-3 py-1 transition-colors ${marginType === 'markup' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                                加成率
                              </button>
                              <button type="button" onClick={() => setMarginType('gross')}
                                className={`px-3 py-1 border-l border-slate-300 transition-colors ${marginType === 'gross' ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-50'}`}>
                                毛利率
                              </button>
                            </div>
                          </div>
                          {/* 公式说明 */}
                          <div className={`text-[10px] leading-tight px-2 py-1 rounded border ${marginType === 'markup' ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-purple-50 border-purple-200 text-purple-700'}`}>
                            {marginType === 'markup'
                              ? <>加成率 = (售价−成本)÷<strong>成本</strong>　售价 = 成本×(1+加成率)　无上限</>
                              : <>毛利率 = (售价−成本)÷<strong>售价</strong>　售价 = 成本÷(1−毛利率)　必须&lt;100%</>}
                          </div>
                          {/* 输入框 */}
                          <FieldLabel
                            tip={marginType === 'markup'
                              ? '【加成率 Markup Rate】= (售价 - 成本) ÷ 成本\n加成率无上限：100%=翻倍，200%=三倍。\n与毛利率换算：毛利率 = 加成率 ÷ (1 + 加成率)'
                              : '【毛利率 Gross Margin】= (售价 - 成本) ÷ 售价\n严格约束：毛利率必须 < 100%，等于100%时公式无解。\n与加成率换算：加成率 = 毛利率 ÷ (1 - 毛利率)'}
                            formula={marginType === 'markup'
                              ? '售价 = 成本 × (1 + 加成率)\n例：成本¥10，加成率100% → 售价 = 10×2 = ¥20\n例：成本¥10，加成率50%  → 售价 = 10×1.5 = ¥15'
                              : '售价 = 成本 ÷ (1 − 毛利率)\n例：成本¥10，毛利率50% → 售价 = 10÷0.5 = ¥20\n例：成本¥10，毛利率20% → 售价 = 10÷0.8 = ¥12.5\n⚠️ 毛利率=100% → 分母=0，无解，禁止输入'}
                          >
                            目标{marginType === 'markup' ? '加成率' : '毛利率'} (%)
                          </FieldLabel>
                          <Input
                            type="number"
                            value={targetMargins[item.id] || ''}
                            onChange={e => {
                              const raw = e.target.value;
                              // 毛利率模式：实时阻止 ≥ 100 的输入
                              if (marginType === 'gross' && n(raw) >= 100) {
                                toast.error('毛利率不能等于或大于100%（公式无解）', { id: 'gm-limit' });
                                return;
                              }
                              setTargetMargins(p => ({ ...p, [item.id]: raw }));
                            }}
                            placeholder={marginType === 'markup' ? '100' : '50'}
                            className={`h-9 text-sm font-semibold w-28 ${sc.grossMarginError ? 'border-red-400 bg-red-50' : ''}`}
                            step="0.5" min="0"
                          />
                          {/* 换算提示 */}
                          {n(simpleCosts[item.id]) > 0 && n(targetMargins[item.id]) > 0 && !sc.grossMarginError && (
                            <div className="text-[10px] text-slate-500">
                              {marginType === 'markup'
                                ? `≈ 毛利率 ${(n(targetMargins[item.id]) / (100 + n(targetMargins[item.id])) * 100).toFixed(1)}%`
                                : `≈ 加成率 ${(n(targetMargins[item.id]) / (100 - n(targetMargins[item.id])) * 100).toFixed(1)}%`}
                            </div>
                          )}
                        </div>

                        {/* 建议报价 */}
                        <div className="w-52 shrink-0">
                          <FieldLabel
                            tip={marginType === 'markup' ? '售价 = 成本 × (1 + 加成率)' : '售价 = 成本 ÷ (1 − 毛利率)'}
                            formula={marginType === 'markup'
                              ? `售价 = ${fmt(sc.fullCost)} × (1 + ${n(targetMargins[item.id])}%) = ${fmt(sc.suggested)}`
                              : `售价 = ${fmt(sc.fullCost)} ÷ (1 − ${n(targetMargins[item.id])}%) = ${fmt(sc.suggested)}`}
                          >
                            建议报价（{currencyCode}）
                          </FieldLabel>
                          {sc.grossMarginError ? (
                            <div className="mt-1 h-9 flex items-center px-3 bg-red-50 border-2 border-red-400 rounded-md">
                              <span className="text-xs font-bold text-red-600">⚠️ 毛利率不能 ≥ 100%</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1 mt-1">
                              <div className="flex-1 h-9 flex items-center px-3 bg-blue-50 border-2 border-blue-300 rounded-md min-w-0">
                                <span className="text-sm font-bold text-blue-700 truncate">{currencySymbol}{fmt(sc.suggested)}</span>
                              </div>
                              <Button variant="outline" size="sm"
                                className="h-9 text-xs bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 shrink-0 px-3"
                                onClick={() => {
                                  setItemPrices(p => ({ ...p, [item.id]: sc.suggested.toFixed(2) }));
                                  toast.success('已应用建议报价');
                                }}
                              >
                                <TrendingUp className="w-3 h-3 mr-1" /> 应用
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 实际报价 + 利润分析 */}
                      <div className="bg-slate-50 rounded-lg p-3 space-y-2">
                        {/* 第一行：实际报价输入 */}
                        <div className="flex items-end gap-3">
                          <div className="w-56 shrink-0">
                            <FieldLabel tip="最终向买方报出的实际单价。可手动输入或点击上方「应用」填入建议价。">
                              实际报价 * ({currencyCode})
                            </FieldLabel>
                            <div className="relative mt-1">
                              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{currencySymbol}</span>
                              <Input
                                type="number"
                                value={itemPrices[item.id] || ''}
                                onChange={e => setItemPrices(p => ({ ...p, [item.id]: e.target.value }))}
                                placeholder="0.00"
                                className="h-9 text-sm font-bold pl-5 border-2 border-orange-300 bg-orange-50"
                                step="0.01" min="0"
                              />
                            </div>
                          </div>
                          <div className="text-xs text-slate-400 pb-2">← 填写后查看下方利润分析</div>
                        </div>
                        {/* 第二行：利润分析五格（严格财务定义） */}
                        <div className="grid grid-cols-5 gap-2">
                          {(() => {
                            const effectivePrice = price > 0 ? price : sc.suggested;
                            const profit = effectivePrice - sc.fullCost;
                            // 毛利率（Gross Margin）= (售价 - 成本) ÷ 售价
                            const grossMgn = sc.actualGrossMargin;
                            // 加成率（Markup Rate）= (售价 - 成本) ÷ 成本
                            const markupRate = sc.actualMarkupRate;
                            const profitColor = profit >= 0 ? 'green' : 'red';
                            const grossColor = grossMgn >= 15 ? 'green' : grossMgn >= 8 ? 'yellow' : 'red';
                            const markupColor = markupRate >= 20 ? 'green' : markupRate >= 10 ? 'yellow' : 'red';
                            return [
                              {
                                label: '完全成本',
                                val: `${currencySymbol}${fmt(sc.fullCost)}`,
                                sub: '报价下限',
                                color: 'slate',
                                tip: '完全成本 = 出厂含税价（EXW）或退税后净成本（FOB/CIF），是报价的绝对下限。',
                              },
                              {
                                label: '单件利润',
                                val: `${currencySymbol}${fmt(profit)}`,
                                sub: '售价 − 成本',
                                color: profitColor,
                                tip: '单件利润 = 实际报价 − 完全成本',
                              },
                              {
                                label: '加成率',
                                val: `${markupRate.toFixed(1)}%`,
                                sub: '利润 ÷ 成本',
                                color: markupColor,
                                tip: '【加成率 Markup Rate】= (售价 − 成本) ÷ 成本\n无上限，100%=翻倍，200%=三倍',
                              },
                              {
                                label: '毛利率',
                                val: `${grossMgn.toFixed(1)}%`,
                                sub: '利润 ÷ 售价',
                                color: grossColor,
                                tip: '【毛利率 Gross Margin】= (售价 − 成本) ÷ 售价\n财务报表口径，必须 < 100%',
                              },
                              {
                                label: '总利润',
                                val: `${currencySymbol}${fmt(profit * item.quantity)}`,
                                sub: `× ${item.quantity} ${item.unit}`,
                                color: profitColor,
                                tip: '总利润 = 单件利润 × 数量',
                              },
                            ].map(({ label, val, sub, color, tip }) => (
                              <TooltipProvider key={label}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className={`bg-${color}-50 border border-${color}-200 rounded-lg p-2.5 cursor-help`}>
                                      <div className="text-[10px] text-slate-500 mb-1">{label}</div>
                                      <div className={`text-sm font-bold text-${color}-700 truncate`}>{val}</div>
                                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">{sub}</div>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-[220px] text-xs whitespace-pre-line">{tip}</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ));
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── 详细报价面板（原有内容） ── */}
                  {pricingMode === 'detailed' && (<>

                  {/* ── A. 成本录入 ── */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                        <Calculator className="w-3.5 h-3.5" /> 成本录入
                        <span className="font-normal text-slate-400">（含税人民币，单件）</span>
                      </span>
                      <button type="button"
                        onClick={() => {
                          const base = price > 0 ? price * (quoteMode.includes('USD') ? tax.usdRate : 1) : 100;
                          setItemCosts(p => ({ ...p, [item.id]: quickFillPreset(base, quoteMode) }));
                          toast.info('已应用行业标准成本结构');
                        }}
                        className="text-xs text-blue-600 border border-blue-300 rounded px-2 py-0.5 hover:bg-blue-50 flex items-center gap-1">
                        <Settings className="w-3 h-3" /> 快速填充
                      </button>
                    </div>

                    {/* 制造成本 */}
                    <div className="bg-slate-50 rounded-lg p-2 mb-2">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide mb-2">制造成本（含税）</div>
                      <div className="grid grid-cols-6 gap-2">
                        <CostRow icon={<Package className="w-3 h-3" />} label="原材料" sublabel="含税" field="material"
                          costs={itemCosts[item.id] || EMPTY_COST()} total={calc.exwIncl} currencySymbol="¥" onChange={(f, v) => updateCost(item.id, f, v)} />
                        <CostRow icon={<Users className="w-3 h-3" />} label="直接人工" field="labor"
                          costs={itemCosts[item.id] || EMPTY_COST()} total={calc.exwIncl} currencySymbol="¥" onChange={(f, v) => updateCost(item.id, f, v)} />
                        <CostRow icon={<Settings className="w-3 h-3" />} label="制造费用" sublabel="水电/折旧" field="manufacturing"
                          costs={itemCosts[item.id] || EMPTY_COST()} total={calc.exwIncl} currencySymbol="¥" onChange={(f, v) => updateCost(item.id, f, v)} />
                        <CostRow icon={<Package className="w-3 h-3" />} label="包装费用" field="packaging"
                          costs={itemCosts[item.id] || EMPTY_COST()} total={calc.exwIncl} currencySymbol="¥" onChange={(f, v) => updateCost(item.id, f, v)} />
                        <CostRow icon={<DollarSign className="w-3 h-3" />} label="管理费用" sublabel="销售/行政" field="overhead"
                          costs={itemCosts[item.id] || EMPTY_COST()} total={calc.exwIncl} currencySymbol="¥" onChange={(f, v) => updateCost(item.id, f, v)} />
                        <CostRow icon={<AlertCircle className="w-3 h-3" />} label="其他费用" sublabel="认证/检测" field="other"
                          costs={itemCosts[item.id] || EMPTY_COST()} total={calc.exwIncl} currencySymbol="¥" onChange={(f, v) => updateCost(item.id, f, v)} />
                      </div>
                    </div>

                    {/* 出口附加费（FOB/CIF 才显示） */}
                    {quoteMode !== 'EXW_CNY' && (
                      <div className="bg-blue-50 rounded-lg p-2 mb-2">
                        <div className="text-[10px] font-semibold text-blue-600 uppercase tracking-wide mb-2">出口附加费（人民币）</div>
                        <div className="grid grid-cols-6 gap-2">
                          <CostRow icon={<Truck className="w-3 h-3" />} label="国内运费" sublabel="工厂→港口" field="domesticFreight"
                            costs={itemCosts[item.id] || EMPTY_COST()} total={calc.fobFullCostCNY} currencySymbol="¥" onChange={(f, v) => updateCost(item.id, f, v)} />
                          <CostRow icon={<Package className="w-3 h-3" />} label="报关/港杂" sublabel="THC/文件费" field="customsClearance"
                            costs={itemCosts[item.id] || EMPTY_COST()} total={calc.fobFullCostCNY} currencySymbol="¥" onChange={(f, v) => updateCost(item.id, f, v)} />
                          <div className="col-span-4 flex items-end">
                            <div className="text-xs text-blue-700 bg-blue-100 rounded p-2 w-full">
                              <FieldLabel tip="FOB 条款下卖方需承担的全部成本，包含退税后净成本、国内运费和报关港杂费。这是 FOB 报价的成本下限。" formula="FOB完全成本 = 退税后净成本 + 国内运费 + 报关港杂">FOB 完全成本（CNY）</FieldLabel>
                              <div className="text-base font-bold mt-0.5">¥{fmt(calc.fobFullCostCNY)}</div>
                              {(quoteMode === 'FOB_USD' || quoteMode === 'CIF_USD') && (
                                <div className="text-[10px] mt-0.5 text-blue-500">
                                  ÷ {tax.usdRate} = ${fmt(calc.fobFullCostCNY / tax.usdRate)} USD
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 海运费（CIF 才显示） */}
                    {quoteMode === 'CIF_USD' && (
                      <div className="bg-purple-50 rounded-lg p-2 mb-2">
                        <div className="text-[10px] font-semibold text-purple-600 uppercase tracking-wide mb-2">海运费用（美元，单件）</div>
                        <div className="grid grid-cols-6 gap-2">
                          <CostRow icon={<Truck className="w-3 h-3" />} label="海运费" sublabel="USD/件" field="seaFreight"
                            costs={itemCosts[item.id] || EMPTY_COST()} total={calc.fullCost} currencySymbol="$" onChange={(f, v) => updateCost(item.id, f, v)} />
                          <CostRow icon={<AlertCircle className="w-3 h-3" />} label="保险费" sublabel="USD/件" field="insurance"
                            costs={itemCosts[item.id] || EMPTY_COST()} total={calc.fullCost} currencySymbol="$" onChange={(f, v) => updateCost(item.id, f, v)} />
                          <div className="col-span-4 flex items-end">
                            <div className="text-xs text-purple-700 bg-purple-100 rounded p-2 w-full">
                              <FieldLabel tip="CIF 条款下卖方需承担的全部成本（美元），包含 FOB 成本换算为美元后，再加上海运费和保险费。这是 CIF 报价的成本下限。" formula="CIF完全成本(USD) = FOB完全成本(CNY)÷汇率 + 海运费 + 保险费">CIF 完全成本（USD）</FieldLabel>
                              <div className="text-base font-bold mt-0.5">${fmt(calc.fullCost)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 税务推导过程 */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                      <div className="text-[10px] font-semibold text-green-700 uppercase tracking-wide mb-2">增值税 & 退税推导</div>
                      <div className="grid grid-cols-4 gap-2 text-xs">
                        <div className="bg-white rounded p-1.5 border border-green-200">
                          <FieldLabel tip="所有成本项目之和（含增值税），即工厂出厂价（EXW含税）。这是成本录入的合计值。" formula="出厂含税价 = 原材料 + 人工 + 制造 + 包装 + 管理 + 其他">出厂含税价（EXW）</FieldLabel>
                          <div className="font-bold text-slate-800 mt-0.5">¥{fmt(calc.exwIncl)}</div>
                        </div>
                        <div className="bg-white rounded p-1.5 border border-green-200">
                          <FieldLabel tip="将含税价换算为不含税价，用于计算出口退税额。这是出口报关时发票上的价格基准。" formula={`出厂不含税价 = 含税价 ÷ (1 + ${tax.vatRate}%)`}>出厂不含税价</FieldLabel>
                          <div className="font-bold text-slate-800 mt-0.5">¥{fmt(calc.exwExcl)}</div>
                        </div>
                        <div className="bg-white rounded p-1.5 border border-green-200">
                          <FieldLabel
                            tip={tax.hasExportRebate ? '国家退还给出口企业的增值税金额，相当于降低了出口成本。退税率越高，实际成本越低。' : '该商品不享受出口退税政策，成本中已缴纳的增值税无法退回，需计入完全成本。'}
                            formula={tax.hasExportRebate ? `退税额 = 出厂不含税价 × ${tax.exportRebateRate}%` : '退税额 = 0（不退税商品）'}
                          >
                            {tax.hasExportRebate ? `退税额 ×${tax.exportRebateRate}%` : '退税额（不退税）'}
                          </FieldLabel>
                          <div className={`font-bold mt-0.5 ${tax.hasExportRebate ? 'text-green-700' : 'text-slate-400'}`}>
                            {tax.hasExportRebate ? `+¥${fmt(calc.rebate)}` : '¥0.00'}
                          </div>
                        </div>
                        <div className="bg-white rounded p-1.5 border border-green-200">
                          <FieldLabel tip="扣除退税收益后的实际净成本，是计算 FOB/CIF 完全成本的起点。退税相当于政府补贴，降低了出口成本。" formula="退税后净成本 = 出厂含税价 − 退税额">退税后净成本</FieldLabel>
                          <div className="font-bold text-orange-700 mt-0.5">¥{fmt(calc.netCostAfterRebate)}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* ── B. 报价与利润 ── */}
                  <div className="border-t pt-3">
                    <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" /> 报价与利润核算
                    </div>
                    <div className="grid grid-cols-12 gap-2 items-end">

                      {/* 目标毛利率 */}
                      <div className="col-span-2">
                        <FieldLabel tip="您期望达到的毛利率目标，系统据此反推建议报价。毛利率 = 利润 ÷ 售价（而非利润÷成本）。外贸建议 ≥ 10%，优质品牌可达 20–30%。" formula={"建议报价 = 完全成本 ÷ (1 − 目标毛利率)\n例：成本¥10，目标毛利率15% → 报价 = 10÷0.85 = ¥11.76"}>目标毛利率 (%)</FieldLabel>
                        <Input type="number" value={targetMargins[item.id] || ''}
                          onChange={e => setTargetMargins(p => ({ ...p, [item.id]: e.target.value }))}
                          placeholder="15" className="mt-1 h-8 text-sm font-semibold" step="0.5" min="0" max="99" />
                      </div>

                      {/* 建议报价 */}
                      <div className="col-span-3">
                        <FieldLabel tip="基于完全成本和目标毛利率自动计算的建议报价，可点击「应用报价」填入实际报价栏。" formula={"建议报价 = 完全成本 ÷ (1 − 目标毛利率%)\n注意：这是毛利率公式，不是加成率公式"}>
                          建议报价（{currencyCode}）<span className="text-slate-400 font-normal ml-1">= 成本÷(1−毛利率)</span>
                        </FieldLabel>
                        <div className="h-8 flex items-center mt-1 px-2 bg-blue-100 border-2 border-blue-300 rounded-md">
                          <span className="text-sm font-bold text-blue-700">
                            {currencySymbol}{fmt(suggested)}
                          </span>
                        </div>
                      </div>

                      {/* 应用建议价 */}
                      <div className="col-span-2">
                        <Button variant="outline" size="sm"
                          className="w-full h-8 text-xs bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100 mt-5"
                          onClick={() => { setItemPrices(p => ({ ...p, [item.id]: suggested.toFixed(2) })); toast.success('已应用建议报价'); }}>
                          <TrendingUp className="w-3 h-3 mr-1" /> 应用报价
                        </Button>
                      </div>

                      {/* 实际单价输入 */}
                      <div className="col-span-2">
                        <FieldLabel tip="您最终向买方报出的实际单价，可手动输入或点击「应用报价」自动填入建议价。此价格用于计算实际毛利率和总利润。">实际报价 * ({currencyCode})</FieldLabel>
                        <div className="relative mt-1">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-slate-400">{currencySymbol}</span>
                          <Input type="number" value={itemPrices[item.id] || ''}
                            onChange={e => setItemPrices(p => ({ ...p, [item.id]: e.target.value }))}
                            placeholder="0.00" className="h-8 text-sm font-bold pl-5 border-2 border-orange-300 bg-orange-50"
                            step="0.01" min="0" />
                        </div>
                      </div>

                      {/* 利润分析 */}
                      <div className="col-span-3">
                        <div className="grid grid-cols-3 gap-1">
                          <div>
                            <FieldLabel tip="实际报价减去完全成本后的单件毛利润。" formula="单件利润 = 实际报价 − 完全成本">单件利润</FieldLabel>
                            <div className={`h-8 flex items-center mt-1 px-1.5 border-2 rounded-md text-xs font-bold ${
                              price - calc.fullCost >= 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                              {currencySymbol}{fmt(price - calc.fullCost)}
                            </div>
                          </div>
                          <div>
                            <FieldLabel tip="实际毛利率，反映报价中利润所占的比例。绿色≥15%，黄色8–15%，红色<8%。" formula="毛利率 = 单件利润 ÷ 实际报价 × 100%">毛利率</FieldLabel>
                            <div className={`h-8 flex items-center mt-1 px-1.5 border-2 rounded-md text-xs font-bold bg-${marginColor}-50 border-${marginColor}-200 text-${marginColor}-700`}>
                              {pct(margin)}
                            </div>
                          </div>
                          <div>
                            <FieldLabel tip="该产品的单件利润乘以订单数量，即本次订单的预估毛利润总额。" formula="总利润 = 单件利润 × 订单数量">总利润</FieldLabel>
                            <div className={`h-8 flex items-center mt-1 px-1.5 border-2 rounded-md text-xs font-bold ${
                              (price - calc.fullCost) * item.quantity >= 0 ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
                            }`}>
                              {currencySymbol}{fmt((price - calc.fullCost) * item.quantity)}
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* 完全成本明细 */}
                    <div className="mt-2 text-[10px] text-slate-500 bg-slate-50 rounded p-2 flex flex-wrap gap-x-4 gap-y-0.5">
                      <span>完全成本: <strong className="text-slate-700">{currencySymbol}{fmt(calc.fullCost)}</strong></span>
                      <span>退税后净成本: <strong>¥{fmt(calc.netCostAfterRebate)}</strong></span>
                      {quoteMode !== 'EXW_CNY' && <span>国内运费+报关: <strong>¥{fmt((itemCosts[item.id]?.domesticFreight || 0) + (itemCosts[item.id]?.customsClearance || 0))}</strong></span>}
                      {(quoteMode === 'FOB_USD' || quoteMode === 'CIF_USD') && <span>汇率: <strong>1 USD = ¥{tax.usdRate}</strong></span>}
                      {quoteMode === 'CIF_USD' && <span>海运+保险: <strong>${fmt((itemCosts[item.id]?.seaFreight || 0) + (itemCosts[item.id]?.insurance || 0))}</strong></span>}
                    </div>
                  </div>
                  </>)}

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ⑥ 交易条款 */}
      <div className="border-2 border-slate-200 rounded-lg overflow-hidden">
        <div className="bg-orange-50 px-3 py-2 border-b border-orange-200 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-orange-600" />
          <span className="font-semibold text-sm">交易条款</span>
        </div>
        <div className="p-3 bg-white">
          <div className="grid grid-cols-4 gap-3 mb-3">
            <div>
              <FieldLabel tip="从收到订单（或确认样品）到货物备妥可发运的生产周期，以自然日计算。需留出合理缓冲，避免因延误产生违约风险。">交货周期（天）</FieldLabel>
              <Input type="number" value={leadTime} onChange={e => setLeadTime(e.target.value)} placeholder="30" className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <FieldLabel tip="Minimum Order Quantity，最小起订量。低于此数量可能无法接单或需加收小单附加费。合理设置 MOQ 有助于摊薄固定成本。">最小起订量 (MOQ)</FieldLabel>
              <Input type="number" value={moq} onChange={e => setMoq(e.target.value)} placeholder="1000" className="mt-1 h-8 text-sm" />
            </div>
            <div>
              <FieldLabel tip="买卖双方约定的货款支付方式。T/T（电汇）最常见；L/C（信用证）风险低但手续复杂；D/P（付款交单）适合中等信任度客户。预付比例越高，对卖方越有利。">付款方式</FieldLabel>
              <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['T/T 30% 预付，70% 发货前', 'T/T 100% 预付', 'T/T 30天', 'T/T 60天', 'L/C at sight', 'L/C 30天', 'D/P 付款交单', '月结30天', '月结60天'].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <FieldLabel tip="国际贸易术语（Incoterms），规定买卖双方在货物运输中各自承担的费用、风险和责任边界。应与上方「报价模式」保持一致。" formula={"EXW：工厂交货，买方承担一切\nFOB：货上船后风险转移给买方\nCIF：卖方负责运费+保险到目的港\nDDP：卖方负责到买方门口（含关税）"}>交货条款</FieldLabel>
              <Select value={deliveryTerms} onValueChange={setDeliveryTerms}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['EXW 工厂', 'FOB 厦门', 'FOB 上海', 'FOB 广州', 'FOB 宁波', 'CIF 目的港', 'DDP 目的地', 'DAP 目的地', 'FCA 货交承运人'].map(v => (
                    <SelectItem key={v} value={v}>{v}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <FieldLabel tip="向买方说明的附加条件，如质保期、包装要求、认证情况、样品政策等。此备注会随报价单一起提交给采购方，请填写清楚。">
                对外备注 <span className="text-slate-400 font-normal text-[10px] ml-1">（提交给采购方）</span>
              </FieldLabel>
              <Textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="例：质保期12个月；包装：每箱6件，纸箱+泡沫；CE/RoHS认证齐全；样品费用：USD 50/件可退..."
                className="mt-1 min-h-20 text-sm"
              />
            </div>
            <div>
              <FieldLabel tip="供应商内部备注，仅供内部参考，不对外显示。可记录成本核算依据、特殊工艺说明、价格有效期、汇率假设等。">
                内部备注 <span className="text-slate-400 font-normal text-[10px] ml-1">（仅内部可见）</span>
              </FieldLabel>
              <Textarea
                value={supplierRemarks}
                onChange={e => setSupplierRemarks(e.target.value)}
                placeholder="例：原材料价格基于2026年2月行情；汇率按7.25计算；若订单量超5000件可降价3%..."
                className="mt-1 min-h-20 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ⑦ 专业提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        <div className="font-semibold mb-1 flex items-center gap-1"><Info className="w-3.5 h-3.5" /> 成本核算专业说明</div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 text-blue-600">
          <div>• <strong>EXW</strong>：工厂交货，买方承担所有运输风险，报价最低</div>
          <div>• <strong>FOB</strong>：货物越过船舷后风险转移，含国内运费+报关</div>
          <div>• <strong>CIF</strong>：卖方承担运费+保险至目的港，报价最高</div>
          <div>• <strong>退税</strong>：出口退税降低实际成本，提升竞争力</div>
          <div>• <strong>毛利率</strong> = 利润 ÷ 售价（非加成率）；建议外贸 ≥ 10%</div>
          <div>• <strong>含税成本</strong>录入后系统自动推导不含税价和退税额</div>
        </div>
      </div>

      {/* ⑧ 操作按钮 */}
      <div className="flex items-center justify-between border-t-2 pt-3">
        <div className="text-sm text-slate-600">
          共 <strong>{quotation.items?.length}</strong> 个产品 · 报价模式: <strong>{QUOTE_MODE_LABELS[quoteMode]}</strong>
          {!isFormValid() && (
            <span className="ml-3 text-xs text-red-600 flex items-center gap-1 inline-flex">
              <AlertCircle className="w-3 h-3" /> 请填写所有必填项后才能提交
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel} className="h-9" disabled={quotation.status === 'submitted'}>
            <X className="w-4 h-4 mr-2" /> 取消
          </Button>
          <Button variant="outline" onClick={() => handleSave(false)} className="h-9" disabled={quotation.status === 'submitted'}>
            <Save className="w-4 h-4 mr-2" /> 保存草稿
          </Button>
          {quotation.status === 'submitted' ? (
            <Button className="bg-green-600 hover:bg-green-600 h-9 cursor-not-allowed" disabled>
              <CheckCircle className="w-4 h-4 mr-2" /> 已报价
            </Button>
          ) : (
            <Button onClick={() => handleSave(true)} className="bg-orange-600 hover:bg-orange-700 h-9" disabled={!isFormValid()}>
              <Send className="w-4 h-4 mr-2" /> 提交报价
            </Button>
          )}
        </div>
      </div>

    </div>
  );
}
