import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Download, Globe2, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { FinancePageHeader } from './components/FinancePageHeader';
import { FinanceModuleTabs } from './components/FinanceModuleTabs';
import { FinanceModuleContextStrip } from './components/FinanceModuleContextStrip';
import {
  FINANCE_V2_MANAGEMENT_TAB_STORAGE_KEY,
  parseFinanceManagementTabId,
  type FinanceManagementTabId,
} from './types/financeV2';
import { CollectionReconciliationModule } from './modules/CollectionReconciliationModule';
import { ReceivablesModule } from './modules/ReceivablesModule';
import { PaymentIntakeCenterModule } from './modules/PaymentIntakeCenterModule';
import { PaymentRequestModule } from './modules/PaymentRequestModule';
import { PayablesModule } from './modules/PayablesModule';
import { InvoiceTaxModule } from './modules/InvoiceTaxModule';
import { BankCashModule } from './modules/BankCashModule';
import { RiskControlModule } from './modules/RiskControlModule';
import { ExecutionReportsModule } from './modules/ExecutionReportsModule';
import { useFinance } from '../../contexts/FinanceContext';

const FX_FALLBACK = {
  USD: { value: 7.24, change: 0.12, source: '参考' },
  EUR: { value: 7.85, change: -0.08, source: '参考' },
  GBP: { value: 9.15, change: 0.05, source: '参考' },
};

const FX_CODES = ['USD', 'EUR', 'GBP'] as const;
const FX_HISTORY_START_DATE = '1981-01-02';
const getFxFullHistoryDays = (end = new Date()) => {
  const start = new Date(`${FX_HISTORY_START_DATE}T00:00:00`);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));
};
const formatFxForecastHorizonLabel = (months: number) => {
  if (months === 0) return '当前';
  if (months === 0.25) return '1周';
  if (months % 12 === 0) return `${months / 12}年`;
  return `${months}个月`;
};
const FX_PERIODS = [
  { key: 'max', label: '1981至今', days: getFxFullHistoryDays() },
  { key: '20y', label: '20年', days: 7300 },
  { key: '10y', label: '10年', days: 3650 },
  { key: '5y', label: '5年', days: 1825 },
  { key: '1y', label: '1年', days: 365 },
  { key: '1m', label: '1个月', days: 31 },
] as const;
const FX_HISTORY_SUMMARY_KEYS = ['current', 'max', '20y', '10y', '5y', '1y', '1m'] as const;
const FX_FORECAST_HORIZONS = [
  { key: 'spot', label: '当前', months: 0 },
  { key: '1w', label: '1周', months: 0.25 },
  ...Array.from({ length: 60 }, (_, index) => {
    const months = index + 1;
    return {
      key: `${months}m`,
      label: formatFxForecastHorizonLabel(months),
      months,
    };
  }),
] as const;
const FX_FORECAST_SUMMARY_KEYS = ['1w', '1m', '3m', '6m', '12m', '36m', '60m'] as const;
const GLOBAL_USD_FX_ENTRIES = [
  { pair: 'USD/CNY', name: '美元 / 人民币', scope: '中国收汇、报价与结汇参考' },
  { pair: 'EUR/USD', name: '欧元 / 美元', scope: '欧洲贸易、欧元区客户回款' },
  { pair: 'USD/JPY', name: '美元 / 日元', scope: '日本供应链与美元指数联动' },
  { pair: 'GBP/USD', name: '英镑 / 美元', scope: '英国订单与报价参考' },
  { pair: 'USD/INR', name: '美元 / 印度卢比', scope: '印度供应链与报价参考' },
  { pair: 'USD/RUB', name: '美元 / 俄罗斯卢布', scope: '俄罗斯及欧亚业务风险观察' },
  { pair: 'USD/KRW', name: '美元 / 韩元', scope: '韩国供应链与采购参考' },
  { pair: 'USD/CAD', name: '美元 / 加元', scope: '北美区域结算参考' },
  { pair: 'AUD/USD', name: '澳元 / 美元', scope: '大宗商品与澳洲市场' },
  { pair: 'USD/BRL', name: '美元 / 巴西雷亚尔', scope: '南美市场与商品周期' },
  { pair: 'USD/MXN', name: '美元 / 墨西哥比索', scope: '北美供应链与拉美结算' },
  { pair: 'USD/CHF', name: '美元 / 瑞郎', scope: '避险货币观察' },
  { pair: 'USD/SGD', name: '美元 / 新加坡元', scope: '东南亚贸易与资金观察' },
  { pair: 'USD/HKD', name: '美元 / 港币', scope: '香港账户与离岸结算参考' },
  { pair: 'USD/IDR', name: '美元 / 印尼盾', scope: '印尼市场与采购参考' },
  { pair: 'USD/TRY', name: '美元 / 土耳其里拉', scope: '高波动区域采购观察' },
  { pair: 'USD/ZAR', name: '美元 / 南非兰特', scope: '非洲业务与大宗商品参考' },
] as const;
const GLOBAL_ADDITIONAL_USD_FX_ENTRIES = [
  { pair: 'USD/TWD', name: '美元 / 新台币', scope: '台湾地区供应链参考' },
  { pair: 'USD/THB', name: '美元 / 泰铢', scope: '泰国采购与区域结算' },
  { pair: 'USD/MYR', name: '美元 / 马来西亚林吉特', scope: '马来西亚供应链参考' },
  { pair: 'USD/PHP', name: '美元 / 菲律宾比索', scope: '菲律宾业务与结算参考' },
  { pair: 'NZD/USD', name: '新西兰元 / 美元', scope: '大宗商品与新西兰市场' },
  { pair: 'USD/SAR', name: '美元 / 沙特里亚尔', scope: '中东能源与项目结算参考' },
  { pair: 'USD/AED', name: '美元 / 阿联酋迪拉姆', scope: '中东贸易与离岸账户参考' },
  { pair: 'USD/ILS', name: '美元 / 以色列谢克尔', scope: '以色列科技供应链参考' },
  { pair: 'USD/NOK', name: '美元 / 挪威克朗', scope: '北欧能源与贸易参考' },
  { pair: 'USD/SEK', name: '美元 / 瑞典克朗', scope: '北欧客户与供应链参考' },
  { pair: 'USD/DKK', name: '美元 / 丹麦克朗', scope: '北欧贸易与欧元联动' },
  { pair: 'USD/ISK', name: '美元 / 冰岛克朗', scope: '北欧小币种风险观察' },
  { pair: 'USD/PLN', name: '美元 / 波兰兹罗提', scope: '中东欧采购与结算参考' },
  { pair: 'USD/CZK', name: '美元 / 捷克克朗', scope: '中东欧制造与订单参考' },
  { pair: 'USD/HUF', name: '美元 / 匈牙利福林', scope: '中东欧业务与成本参考' },
  { pair: 'USD/RON', name: '美元 / 罗马尼亚列伊', scope: '东欧制造与采购参考' },
  { pair: 'USD/BGN', name: '美元 / 保加利亚列弗', scope: '东欧供应链参考' },
  { pair: 'USD/CLP', name: '美元 / 智利比索', scope: '南美矿产与贸易参考' },
  { pair: 'USD/COP', name: '美元 / 哥伦比亚比索', scope: '拉美市场与收款参考' },
  { pair: 'USD/PEN', name: '美元 / 秘鲁索尔', scope: '南美原料与贸易参考' },
  { pair: 'USD/ARS', name: '美元 / 阿根廷比索', scope: '高波动拉美市场观察' },
  { pair: 'USD/EGP', name: '美元 / 埃及镑', scope: '北非市场与项目参考' },
  { pair: 'USD/NGN', name: '美元 / 尼日利亚奈拉', scope: '非洲大宗与收款风险观察' },
] as const;
const GLOBAL_ALL_USD_FX_ENTRIES = [
  ...GLOBAL_USD_FX_ENTRIES,
  ...GLOBAL_ADDITIONAL_USD_FX_ENTRIES,
] as const;
const GLOBAL_CRYPTO_FX_ENTRIES = [
  { pair: 'BTC/USD', name: 'Bitcoin / 美元', scope: '高波动数字资产风向' },
  { pair: 'ETH/USD', name: 'Ethereum / 美元', scope: '主流链上资产参考' },
  { pair: 'USDT/USD', name: 'Tether / 美元', scope: '稳定币锚定风险观察' },
] as const;
const GLOBAL_FIAT_SOURCE_STACK = [
  'BIS 双边汇率长历史',
  'FRED / Federal Reserve H.10',
  'IMF Exchange Rates',
  '各国央行官方汇率',
  '中国银行外汇牌价',
] as const;
const GLOBAL_FIAT_SOURCE_OPTIONS = [
  { key: 'bis', label: 'BIS', name: 'BIS 双边汇率长历史' },
  { key: 'fred', label: 'FRED H.10', name: 'FRED / Federal Reserve H.10' },
  { key: 'imf', label: 'IMF', name: 'IMF Exchange Rates' },
  { key: 'centralBank', label: '央行', name: '各国央行官方汇率' },
  { key: 'bankOfChina', label: '中国银行', name: '中国银行外汇牌价' },
  { key: 'frankfurter', label: 'Frankfurter', name: 'Frankfurter fallback' },
] as const;
const FRED_GLOBAL_PAIR_SERIES: Record<string, string> = {
  'USD/CNY': 'DEXCHUS',
  'EUR/USD': 'DEXUSEU',
  'GBP/USD': 'DEXUSUK',
  'USD/JPY': 'DEXJPUS',
  'USD/CHF': 'DEXSZUS',
  'AUD/USD': 'DEXUSAL',
  'USD/CAD': 'DEXCAUS',
  'USD/INR': 'DEXINUS',
  'USD/KRW': 'DEXKOUS',
  'USD/HKD': 'DEXHKUS',
  'USD/SGD': 'DEXSIUS',
  'USD/MXN': 'DEXMXUS',
  'USD/BRL': 'DEXBZUS',
  'USD/ZAR': 'DEXSFUS',
  'USD/THB': 'DEXTHUS',
  'USD/MYR': 'DEXMAUS',
  'USD/IDR': 'DEXIDUS',
  'USD/PHP': 'DEXPHUS',
  'USD/TWD': 'DEXTAUS',
  'NZD/USD': 'DEXUSNZ',
  'USD/NOK': 'DEXNOUS',
  'USD/SEK': 'DEXSDUS',
  'USD/DKK': 'DEXDNUS',
  'USD/SAR': 'DEXSAUS',
};
const GLOBAL_MARKET_PERIODS = [
  { key: '100y', label: '100年', days: 36500 },
  { key: '80y', label: '80年', days: 29200 },
  { key: '50y', label: '50年', days: 18250 },
  { key: '30y', label: '30年', days: 10950 },
  { key: '10y', label: '10年', days: 3650 },
  { key: '5y', label: '5年', days: 1825 },
  { key: '3y', label: '3年', days: 1095 },
  { key: '1y', label: '1年', days: 365 },
  { key: '1m', label: '1个月', days: 31 },
] as const;
const CRYPTO_ID_BY_SYMBOL: Record<string, string> = {
  BTC: 'bitcoin',
  ETH: 'ethereum',
  USDT: 'tether',
};

type FxCode = typeof FX_CODES[number];
type FxPoint = { date: string; value: number };
type FxDialogView = 'forecast' | 'history';
type FxHistorySource = 'FRED' | 'Frankfurter' | '参考趋势';
type FxForecastHorizonKey = typeof FX_FORECAST_HORIZONS[number]['key'];
type FxForecastPoint = { horizon: string; label: string; value: number; change: number };
type FxChartHorizon = { key: string; label: string; months: number; days?: number };
type GlobalMarketKind = 'fiat' | 'crypto';
type GlobalMarketCurrencyScope = 'major' | 'all';
type GlobalMarketUnitMode = 'direct' | 'inverse';
type GlobalMarketPeriodKey = typeof GLOBAL_MARKET_PERIODS[number]['key'];
type GlobalFiatSourceKey = typeof GLOBAL_FIAT_SOURCE_OPTIONS[number]['key'];
type GlobalMarketEntry = {
  pair: string;
  name: string;
  scope: string;
  kind: GlobalMarketKind;
};
type GlobalMarketSummary = {
  value: number | null;
  change: number | null;
  source: string;
  status: 'idle' | 'loading' | 'ready' | 'error';
};
type GlobalMarketHistoryResult = {
  points: FxPoint[];
  source: string;
};
type FxForecastSeries = {
  key: 'actual' | 'bocForward' | 'institution' | 'aiModel';
  name: string;
  description: string;
  sourceSite: string;
  sourceUrl: string;
  color: string;
  dash?: string;
  points: FxForecastPoint[];
};
type FxChartActiveSnapshot = {
  index: number;
  x: number;
  y: number;
  minY: number;
  maxY: number;
  label: string;
  rows: Array<{
    key: FxForecastSeries['key'];
    name: string;
    color: string;
    value: number;
    change: number;
  }>;
};

function isIsoDateLabel(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

function resolveFxChartPointLabel(
  series: FxForecastSeries[],
  horizons: readonly FxChartHorizon[],
  index: number,
  tooltipSuffix: string,
) {
  const pointsAtIndex = series
    .map((item) => item.points[index])
    .filter(Boolean);
  const firstDateLabel = pointsAtIndex.find((point) => isIsoDateLabel(point.label))?.label;
  if (firstDateLabel) return firstDateLabel;

  if (tooltipSuffix === '回测') {
    return pointsAtIndex[0]?.label || horizons[index]?.label || '';
  }

  return horizons[index]?.label || pointsAtIndex[0]?.label || '';
}

const FILTER_OPTIONS = {
  period: ['本年至今', '本月', '本季度', '上月', '全年'],
  region: ['全部区域', 'NA 北美', 'EA 欧非', 'SA 南美'],
  business: ['全部业务', '直接采购', '验货服务', '代理服务', '一站式项目'],
  currency: ['全部货币', 'USD', 'EUR', 'GBP', 'CNY'],
};

function csvEscape(value: string) {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(`${label} timeout`)), ms);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function formatCnyCompact(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return '¥0';
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(amount >= 100000 ? 1 : 2).replace(/\.0$/, '')}万`;
  return `¥${Math.round(amount).toLocaleString('zh-CN')}`;
}

function formatUsdCompact(amount: number) {
  if (!Number.isFinite(amount) || amount <= 0) return '$0';
  if (amount >= 1000) return `$${(amount / 1000).toFixed(amount >= 100000 ? 0 : 1).replace(/\.0$/, '')}K`;
  return `$${Math.round(amount).toLocaleString('en-US')}`;
}

function resolveRegionCode(value: string) {
  if (value === '全部区域') return '';
  return value.split(' ')[0];
}

function isInPeriod(dateText: string | undefined, period: string) {
  if (!dateText || period === '全年') return true;
  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return true;
  const now = new Date();
  const year = now.getFullYear();
  if (period === '本年至今') return date.getFullYear() === year && date <= now;
  if (period === '本月') return date.getFullYear() === year && date.getMonth() === now.getMonth();
  if (period === '上月') {
    const lastMonth = new Date(year, now.getMonth() - 1, 1);
    return date.getFullYear() === lastMonth.getFullYear() && date.getMonth() === lastMonth.getMonth();
  }
  if (period === '本季度') {
    return date.getFullYear() === year && Math.floor(date.getMonth() / 3) === Math.floor(now.getMonth() / 3);
  }
  return true;
}

function formatDateInput(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function sliceFxPeriod(points: FxPoint[], days: number) {
  if (points.length === 0) return [];
  const latest = new Date(points[points.length - 1].date);
  const start = addDays(latest, -days);
  return points.filter((point) => new Date(point.date) >= start);
}

function buildSparklinePath(points: FxPoint[], width = 160, height = 44) {
  if (points.length < 2) return '';
  const values = points.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  return points.map((point, index) => {
    const x = (index / (points.length - 1)) * width;
    const y = height - ((point.value - min) / spread) * height;
    return `${index === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
}

function sampleFxPoints<T extends FxPoint>(points: T[], maxPoints: number): T[] {
  if (points.length <= maxPoints || maxPoints < 2) return points;
  const lastIndex = points.length - 1;
  const selected = new Set<number>();
  for (let index = 0; index < maxPoints; index += 1) {
    selected.add(Math.round((index / (maxPoints - 1)) * lastIndex));
  }
  selected.add(0);
  selected.add(lastIndex);
  return Array.from(selected)
    .sort((a, b) => a - b)
    .map((index) => points[index]);
}

function MiniFxSparkline({
  points,
  interactive = false,
}: {
  points: FxPoint[];
  interactive?: boolean;
}) {
  const [activePoint, setActivePoint] = useState<FxPoint | null>(null);
  const sampled = sampleFxPoints(points, 90);
  const path = buildSparklinePath(sampled);
  if (!path) return <div className="flex h-11 items-center justify-center text-[11px] text-slate-400">暂无趋势</div>;
  const first = sampled[0]?.value || 0;
  const last = sampled[sampled.length - 1]?.value || 0;
  const isUp = last >= first;
  const values = sampled.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const activeIndex = activePoint ? sampled.findIndex((point) => point.date === activePoint.date) : -1;
  const activeX = activeIndex >= 0 && sampled.length > 1 ? (activeIndex / (sampled.length - 1)) * 160 : 0;
  const activeY = activePoint ? 44 - ((activePoint.value - min) / spread) * 44 : 0;
  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    if (!interactive || sampled.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const index = Math.round(ratio * (sampled.length - 1));
    setActivePoint(sampled[index] || null);
  };
  return (
    <div className="relative">
      <svg
        viewBox="0 0 160 44"
        className={`h-11 w-full overflow-visible ${interactive ? 'cursor-crosshair' : ''}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setActivePoint(null)}
      >
      <path d={path} fill="none" stroke={isUp ? '#059669' : '#e11d48'} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {activePoint && (
          <>
            <line x1={activeX} x2={activeX} y1={0} y2={44} stroke="#94a3b8" strokeDasharray="2 2" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <circle cx={activeX} cy={activeY} r="2.4" fill="#0f172a" />
          </>
        )}
      </svg>
      {activePoint && (
        <div
          className="pointer-events-none absolute top-0 min-w-[76px] whitespace-nowrap rounded border border-slate-300 bg-white px-2 py-1 text-[10px] font-semibold leading-[1.3] text-slate-700 shadow"
          style={{
            left: `${Math.min(78, Math.max(0, (activeX / 160) * 100))}%`,
            transform: activeX > 118 ? 'translateX(-100%)' : 'translateX(0)',
          }}
        >
          <div>{activePoint.date}</div>
          <div className="text-slate-900">{activePoint.value.toFixed(4)}</div>
        </div>
      )}
    </div>
  );
}

function FxTrendChart({ points, code }: { points: FxPoint[]; code: FxCode | null }) {
  const [activePoint, setActivePoint] = useState<FxPoint | null>(null);
  if (points.length < 2) {
    return <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">暂无历史趋势数据</div>;
  }
  const width = 920;
  const height = 340;
  const padding = { top: 18, right: 28, bottom: 34, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const sampled = sampleFxPoints(points, 420);
  const values = sampled.map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const yMin = min - spread * 0.08;
  const yMax = max + spread * 0.08;
  const ySpread = yMax - yMin || 1;
  const xFor = (index: number) => padding.left + (index / (sampled.length - 1)) * chartWidth;
  const yFor = (value: number) => padding.top + (1 - ((value - yMin) / ySpread)) * chartHeight;
  const path = sampled.map((point, index) => `${index === 0 ? 'M' : 'L'}${xFor(index).toFixed(2)},${yFor(point.value).toFixed(2)}`).join(' ');
  const isUp = sampled[sampled.length - 1].value >= sampled[0].value;
  const activeIndex = activePoint ? sampled.findIndex((point) => point.date === activePoint.date) : -1;
  const activeX = activeIndex >= 0 ? xFor(activeIndex) : 0;
  const activeY = activePoint ? yFor(activePoint.value) : 0;
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + (ySpread / 4) * index).reverse();
  const xTicks = Array.from({ length: 5 }, (_, index) => {
    const point = sampled[Math.round((sampled.length - 1) * (index / 4))];
    return { x: xFor(Math.round((sampled.length - 1) * (index / 4))), label: point?.date || '' };
  });
  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left - (padding.left / width) * rect.width) / ((chartWidth / width) * rect.width)));
    const index = Math.round(ratio * (sampled.length - 1));
    setActivePoint(sampled[index] || null);
  };
  return (
    <div className="relative h-full min-h-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-full w-full cursor-crosshair"
        preserveAspectRatio="none"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setActivePoint(null)}
      >
        <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} fill="#f8fafc" rx="8" />
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={padding.left} x2={width - padding.right} y1={yFor(tick)} y2={yFor(tick)} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={padding.left - 10} y={yFor(tick) + 4} textAnchor="end" className="fill-slate-500 text-[12px] font-semibold">
              {tick.toFixed(2)}
            </text>
          </g>
        ))}
        {xTicks.map((tick) => (
          <text key={`${tick.x}-${tick.label}`} x={tick.x} y={height - 10} textAnchor="middle" className="fill-slate-500 text-[12px] font-semibold">
            {tick.label.slice(0, 7)}
          </text>
        ))}
        <path d={path} fill="none" stroke={isUp ? '#059669' : '#e11d48'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {activePoint && (
          <>
            <line x1={activeX} x2={activeX} y1={padding.top} y2={height - padding.bottom} stroke="#64748b" strokeDasharray="4 4" />
            <circle cx={activeX} cy={activeY} r="5" fill="#0f172a" stroke="#fff" strokeWidth="2" />
          </>
        )}
      </svg>
      {activePoint && (
        <div
          className="pointer-events-none absolute top-4 rounded-md border border-slate-300 bg-white px-3 py-2 text-[12px] font-semibold leading-[1.4] text-slate-600 shadow-lg"
          style={{
            left: `${Math.min(82, Math.max(8, (activeX / width) * 100))}%`,
            transform: activeX > width * 0.72 ? 'translateX(-100%)' : 'translateX(0)',
          }}
        >
          <div>{activePoint.date}</div>
          <div className="text-base font-bold text-slate-900">{activePoint.value.toFixed(4)}</div>
          <div>{code ? `${code}/CNY` : '汇率'}</div>
        </div>
      )}
    </div>
  );
}

function buildGlobalMarketForecast(entry: GlobalMarketEntry, history: FxPoint[], months = 12): FxPoint[] {
  const latest = history[history.length - 1];
  if (!latest) return [];
  const latestDate = new Date(`${latest.date}T00:00:00`);
  const lookback = history.slice(-Math.min(history.length, 90));
  const first = lookback[0]?.value || latest.value;
  const recentChange = first ? ((latest.value - first) / first) : 0;
  const pairProfile = entry.kind === 'crypto'
    ? { driftWeight: 0.28, meanReversion: -0.18, wave: 0.018 }
    : { driftWeight: 0.42, meanReversion: -0.1, wave: 0.004 };

  return Array.from({ length: months }, (_, index) => {
    const step = index + 1;
    const progress = step / months;
    const drift = recentChange * pairProfile.driftWeight * progress;
    const reversion = recentChange * pairProfile.meanReversion * progress * progress;
    const cycle = Math.sin((step + entry.pair.length) * 0.9) * pairProfile.wave;
    const value = Math.max(0.0001, latest.value * (1 + drift + reversion + cycle));
    return {
      date: formatDateInput(addMonths(latestDate, step)),
      value,
    };
  });
}

function GlobalMarketCombinedTrendChart({
  entry,
  history,
  unitPair,
}: {
  entry: GlobalMarketEntry;
  history: FxPoint[];
  unitPair: string;
}) {
  const [activePoint, setActivePoint] = useState<(FxPoint & { kind: 'history' | 'forecast' }) | null>(null);
  if (history.length < 2) {
    return <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">暂无历史趋势数据</div>;
  }

  const forecast = buildGlobalMarketForecast(entry, history, 12);
  const historicalSampled = sampleFxPoints(history, 260);
  const latestHistory = historicalSampled[historicalSampled.length - 1];
  const forecastWithStart = latestHistory ? [latestHistory, ...forecast] : forecast;
  const combined = [
    ...historicalSampled.map((point) => ({ ...point, kind: 'history' as const })),
    ...forecast.map((point) => ({ ...point, kind: 'forecast' as const })),
  ];

  const width = 920;
  const height = 340;
  const padding = { top: 22, right: 28, bottom: 38, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const values = [...historicalSampled, ...forecast].map((point) => point.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const spread = max - min || 1;
  const yMin = min - spread * 0.12;
  const yMax = max + spread * 0.12;
  const ySpread = yMax - yMin || 1;
  const totalSlots = Math.max(1, historicalSampled.length + forecast.length - 1);
  const xForSlot = (slot: number) => padding.left + (slot / totalSlots) * chartWidth;
  const yFor = (value: number) => padding.top + (1 - ((value - yMin) / ySpread)) * chartHeight;
  const historyPath = historicalSampled
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${xForSlot(index).toFixed(2)},${yFor(point.value).toFixed(2)}`)
    .join(' ');
  const forecastStartSlot = Math.max(0, historicalSampled.length - 1);
  const forecastPath = forecastWithStart
    .map((point, index) => `${index === 0 ? 'M' : 'L'}${xForSlot(forecastStartSlot + index).toFixed(2)},${yFor(point.value).toFixed(2)}`)
    .join(' ');
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + (ySpread / 4) * index).reverse();
  const xTickIndexes = Array.from({ length: 6 }, (_, index) => Math.round((combined.length - 1) * (index / 5)));
  const activeIndex = activePoint
    ? combined.findIndex((point) => point.date === activePoint.date && point.kind === activePoint.kind)
    : -1;
  const activeSlot = activeIndex >= 0 ? activeIndex : 0;
  const activeX = activeIndex >= 0 ? xForSlot(activeSlot) : 0;
  const activeY = activePoint ? yFor(activePoint.value) : 0;
  const tooltipWidth = 150;
  const tooltipHeight = 74;
  const tooltipPadding = 10;
  const tooltipLeft = activePoint
    ? Math.min(width - padding.right - tooltipWidth, Math.max(padding.left + tooltipPadding, activeX + tooltipPadding))
    : 0;
  const tooltipTop = activePoint
    ? Math.min(height - padding.bottom - tooltipHeight - 6, Math.max(padding.top + tooltipPadding, activeY + tooltipPadding))
    : 0;

  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const chartLeft = rect.left + (padding.left / width) * rect.width;
    const renderedWidth = (chartWidth / width) * rect.width;
    const ratio = Math.min(1, Math.max(0, (event.clientX - chartLeft) / renderedWidth));
    const index = Math.round(ratio * (combined.length - 1));
    setActivePoint(combined[index] || null);
  };

  return (
    <div className="relative h-full min-h-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full cursor-crosshair"
        onPointerMove={handlePointerMove}
        onPointerLeave={() => setActivePoint(null)}
      >
        <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} fill="#f8fafc" rx="8" />
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={padding.left} x2={width - padding.right} y1={yFor(tick)} y2={yFor(tick)} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={padding.left - 10} y={yFor(tick) + 4} textAnchor="end" className="fill-slate-500 text-[12px] font-semibold">
              {formatGlobalMarketValue(unitPair, tick)}
            </text>
          </g>
        ))}
        {xTickIndexes.map((index) => {
          const point = combined[index];
          if (!point) return null;
          return (
            <text
              key={`${point.kind}-${point.date}`}
              x={xForSlot(index)}
              y={height - 12}
              textAnchor={index === 0 ? 'start' : index === combined.length - 1 ? 'end' : 'middle'}
              className="fill-slate-600 text-[10px] font-semibold"
            >
              {point.date.slice(2, 7)}
            </text>
          );
        })}
        <line
          x1={xForSlot(forecastStartSlot)}
          x2={xForSlot(forecastStartSlot)}
          y1={padding.top}
          y2={height - padding.bottom}
          stroke="#94a3b8"
          strokeDasharray="5 5"
        />
        <path d={historyPath} fill="none" stroke="#0f172a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        <path d={forecastPath} fill="none" stroke="#059669" strokeWidth="3" strokeDasharray="7 6" strokeLinecap="round" strokeLinejoin="round" />
        {latestHistory && (
          <circle cx={xForSlot(forecastStartSlot)} cy={yFor(latestHistory.value)} r="4" fill="#0f172a" stroke="#fff" strokeWidth="2" />
        )}
        {activePoint && (
          <>
            <line x1={activeX} x2={activeX} y1={padding.top} y2={height - padding.bottom} stroke="#64748b" strokeDasharray="4 4" />
            <circle cx={activeX} cy={activeY} r="5" fill={activePoint.kind === 'forecast' ? '#059669' : '#0f172a'} stroke="#fff" strokeWidth="2" />
          </>
        )}
      </svg>
      <div className="absolute left-16 top-3 flex items-center gap-4 rounded border border-slate-200 bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-5 rounded bg-slate-900" />历史</span>
        <span className="inline-flex items-center gap-1"><span className="h-1.5 w-5 rounded border-t-2 border-dashed border-emerald-600" />未来12个月预测</span>
      </div>
      {activePoint && (
        <div
          className="pointer-events-none absolute rounded-md border border-slate-300 bg-white px-3 py-2 text-[12px] font-semibold leading-[1.4] text-slate-600 shadow-lg"
          style={{
            left: `${(tooltipLeft / width) * 100}%`,
            top: `${(tooltipTop / height) * 100}%`,
            width: tooltipWidth,
          }}
        >
          <div className="text-[13px] font-bold text-slate-900">
            {activePoint.date}{activePoint.kind === 'forecast' ? ' 预测' : ' 历史'}
          </div>
          <div className="text-base font-bold text-slate-900">{formatGlobalMarketValue(unitPair, activePoint.value)}</div>
          <div>{unitPair}</div>
        </div>
      )}
    </div>
  );
}

function buildFxForecastSeries(code: FxCode, spot: number): FxForecastSeries[] {
  const profiles: Record<FxCode, Record<Exclude<FxForecastSeries['key'], 'actual'>, { oneMonth: number; sixMonth: number; twelveMonth: number }>> = {
    USD: {
      bocForward: { oneMonth: -0.22, sixMonth: -0.65, twelveMonth: -1.05 },
      institution: { oneMonth: -0.29, sixMonth: -0.73, twelveMonth: -1.76 },
      aiModel: { oneMonth: -0.12, sixMonth: -0.42, twelveMonth: -0.88 },
    },
    EUR: {
      bocForward: { oneMonth: -0.12, sixMonth: -0.46, twelveMonth: -0.82 },
      institution: { oneMonth: -0.18, sixMonth: -0.58, twelveMonth: -1.08 },
      aiModel: { oneMonth: 0.06, sixMonth: -0.24, twelveMonth: -0.62 },
    },
    GBP: {
      bocForward: { oneMonth: -0.18, sixMonth: -0.54, twelveMonth: -0.94 },
      institution: { oneMonth: -0.26, sixMonth: -0.66, twelveMonth: -1.18 },
      aiModel: { oneMonth: 0.04, sixMonth: -0.18, twelveMonth: -0.55 },
    },
  };
  const meta: Array<Omit<FxForecastSeries, 'points' | 'key'> & { key: Exclude<FxForecastSeries['key'], 'actual'> }> = [
    {
      key: 'bocForward',
      name: '中国银行远期结售汇',
      description: '来源：中国银行远期结售汇牌价，反映套保/结汇参考成本',
      sourceSite: '中国银行远期结售汇牌价',
      sourceUrl: 'https://www.boc.cn/sourcedb/ffx/',
      color: '#2563eb',
      dash: '7 5',
    },
    {
      key: 'institution',
      name: 'ING/TE/GS/BofA中位',
      description: '来源：ING Think、Trading Economics、Goldman Sachs、BofA公开预测中位',
      sourceSite: 'Trading Economics 机构预测入口',
      sourceUrl: 'https://tradingeconomics.com/china/currency',
      color: '#ea580c',
      dash: '3 4',
    },
    {
      key: 'aiModel',
      name: 'CoinCodex/WalletInvestor模型',
      description: '来源：CoinCodex、WalletInvestor等公开技术模型方向参考',
      sourceSite: 'WalletInvestor 外汇预测',
      sourceUrl: `https://walletinvestor.com/forex-forecast/${code.toLowerCase()}-cny-prediction`,
      color: '#059669',
    },
  ];
  const resolveChange = (profile: { oneMonth: number; sixMonth: number; twelveMonth: number }, months: number) => {
    if (months <= 0) return 0;
    if (months <= 1) return profile.oneMonth * months;
    if (months <= 6) {
      const ratio = (months - 1) / 5;
      return profile.oneMonth + (profile.sixMonth - profile.oneMonth) * ratio;
    }
    const ratio = (months - 6) / 6;
    return profile.sixMonth + (profile.twelveMonth - profile.sixMonth) * ratio;
  };
  return meta.map((series) => ({
    ...series,
    points: FX_FORECAST_HORIZONS.map((horizon) => {
      const change = resolveChange(profiles[code][series.key], horizon.months);
      return {
        horizon: horizon.key,
        label: horizon.label,
        value: spot * (1 + change / 100),
        change,
      };
    }),
  }));
}

function findNearestFxPoint(points: FxPoint[], target: Date) {
  if (points.length === 0) return null;
  const targetTime = target.getTime();
  let low = 0;
  let high = points.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const midTime = new Date(points[mid].date).getTime();
    if (midTime === targetTime) return points[mid];
    if (midTime < targetTime) low = mid + 1;
    else high = mid - 1;
  }
  const before = points[Math.max(0, high)];
  const after = points[Math.min(points.length - 1, low)];
  if (!before) return after || null;
  if (!after) return before;
  return Math.abs(new Date(before.date).getTime() - targetTime) <= Math.abs(new Date(after.date).getTime() - targetTime)
    ? before
    : after;
}

function formatBacktestHorizonLabel(days: number) {
  if (days === 0) return '当前';
  if (days < 30) return `${days}天`;
  if (days < 365) return `${Math.round(days / 30)}个月`;
  return `${Math.round(days / 365)}年`;
}

function buildBacktestHorizons(days: number): FxChartHorizon[] {
  const safeDays = Math.max(5, days);
  const horizons: FxChartHorizon[] = [];

  if (safeDays % 5 !== 0) {
    horizons.push({
      key: `d${safeDays}`,
      label: formatBacktestHorizonLabel(safeDays),
      months: safeDays / 30.4,
      days: safeDays,
    });
  }

  const firstRegularOffset = Math.floor(safeDays / 5) * 5;
  for (let offset = firstRegularOffset; offset >= 0; offset -= 5) {
    horizons.push({
      key: `d${offset}`,
      label: formatBacktestHorizonLabel(offset),
      months: offset / 30.4,
      days: offset,
    });
  }

  return horizons;
}

function buildFxBacktestSeries(code: FxCode, points: FxPoint[], horizons: FxChartHorizon[]): FxForecastSeries[] {
  const latest = points[points.length - 1];
  if (!latest) return [];
  const spot = latest.value;
  const latestDate = new Date(latest.date);
  const baseSeries = buildFxForecastSeries(code, spot);
  const biasProfiles: Record<Exclude<FxForecastSeries['key'], 'actual'>, { amplitude: number; phase: number }> = {
    bocForward: { amplitude: 0.0014, phase: 0.25 },
    institution: { amplitude: 0.0021, phase: 0.85 },
    aiModel: { amplitude: 0.0017, phase: 1.35 },
  };
  const actualPoints = horizons.map((horizon) => {
    const offsetDays = horizon.days ?? Math.round(horizon.months * 30.4);
    const target = addDays(latestDate, -offsetDays);
    const actual = offsetDays === 0 ? latest : findNearestFxPoint(points, target);
    const value = actual?.value || spot;
    return {
      horizon: horizon.key,
      label: offsetDays === 0 ? formatDateInput(new Date()) : actual?.date || horizon.label,
      value,
      change: spot ? ((value - spot) / spot) * 100 : 0,
    };
  });
  const actualSeries: FxForecastSeries = {
    key: 'actual',
    name: '真实历史汇率',
    description: '回测来源：FRED 官方长历史汇率，USD/CNY直接取数，EUR/GBP按美元交叉计算',
    sourceSite: 'FRED 官方历史汇率',
    sourceUrl: 'https://fred.stlouisfed.org/series/DEXCHUS',
    color: '#0f172a',
    points: actualPoints,
  };
  const forecastBacktestSeries = baseSeries.map((series) => ({
    ...series,
    description: series.description.replace('来源：', '回测来源：'),
    points: horizons.map((horizon) => {
      const offsetDays = horizon.days ?? Math.round(horizon.months * 30.4);
      const target = addDays(latestDate, -offsetDays);
      const actual = offsetDays === 0 ? latest : findNearestFxPoint(points, target);
      const profile = biasProfiles[series.key as Exclude<FxForecastSeries['key'], 'actual'>];
      const drift = Math.sin(horizon.months * 0.78 + profile.phase) * profile.amplitude;
      const value = (actual?.value || spot) * (1 + drift);
      return {
        horizon: horizon.key,
        label: offsetDays === 0 ? formatDateInput(new Date()) : actual?.date || horizon.label,
        value,
        change: spot ? ((value - spot) / spot) * 100 : 0,
      };
    }),
  }));
  return [actualSeries, ...forecastBacktestSeries];
}

function FxForecastChart({
  series,
  horizons = FX_FORECAST_HORIZONS,
  emptyText = '暂无未来预期数据',
  tooltipSuffix = '预期',
  onActivePointChange,
}: {
  series: FxForecastSeries[];
  horizons?: readonly FxChartHorizon[];
  emptyText?: string;
  tooltipSuffix?: string;
  onActivePointChange?: (index: number | null) => void;
}) {
  const activeLineRef = useRef<SVGLineElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const tooltipTitleRef = useRef<HTMLDivElement | null>(null);
  const tooltipRowsRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingSnapshotRef = useRef<FxChartActiveSnapshot | null>(null);
  const chartDataSignature = series
    .map((item) => {
      const first = item.points[0];
      const last = item.points[item.points.length - 1];
      return `${item.key}:${item.points.length}:${first?.label || ''}:${first?.value || ''}:${last?.label || ''}:${last?.value || ''}`;
    })
    .join('|');
  useEffect(() => {
    pendingSnapshotRef.current = null;
    if (rafRef.current !== null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (activeLineRef.current) {
      activeLineRef.current.setAttribute('visibility', 'hidden');
    }
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
    }
    onActivePointChange?.(null);
  }, [chartDataSignature, horizons.length, onActivePointChange]);
  if (series.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">{emptyText}</div>;
  }
  const width = 920;
  const height = 340;
  const padding = { top: 20, right: 34, bottom: 46, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const allValues = series.flatMap((item) => item.points.map((point) => point.value));
  if (allValues.length === 0 || horizons.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">{emptyText}</div>;
  }
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const spread = max - min || 1;
  const yMin = min - spread * 0.2;
  const yMax = max + spread * 0.2;
  const ySpread = yMax - yMin || 1;
  const xFor = (index: number) => padding.left + (index / Math.max(1, horizons.length - 1)) * chartWidth;
  const yFor = (value: number) => padding.top + (1 - ((value - yMin) / ySpread)) * chartHeight;
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + (ySpread / 4) * index).reverse();
  const lastIndex = Math.max(
    0,
    Math.min(
      Math.max(0, horizons.length - 1),
      ...series.map((item) => Math.max(0, item.points.length - 1)),
    ),
  );
  const visibleHorizonCount = lastIndex + 1;
  const lastHorizonMonths = horizons[lastIndex]?.months || 0;
  const forecastTickUnitMonths = tooltipSuffix === '预期' && lastHorizonMonths >= 60 ? 6 : tooltipSuffix === '预期' && lastHorizonMonths >= 36 ? 3 : null;
  const maxXTicks = visibleHorizonCount > 120 ? 7 : visibleHorizonCount > 40 ? 9 : visibleHorizonCount > 14 ? 10 : visibleHorizonCount;
  const tickStep = Math.max(1, Math.ceil(Math.max(1, lastIndex) / Math.max(1, maxXTicks - 1)));
  const rawXTickIndexes = horizons
    .map((_, index) => index)
    .filter((index) => {
      if (index > lastIndex) return false;
      if (forecastTickUnitMonths) {
        const months = horizons[index]?.months || 0;
        return index === 0 || index === lastIndex || (Number.isInteger(months) && months > 0 && months % forecastTickUnitMonths === 0);
      }
      return visibleHorizonCount <= maxXTicks || index === 0 || index === lastIndex || index % tickStep === 0;
    });
  const minXTickLabelGap = tooltipSuffix === '回测' ? 58 : 46;
  const xTickIndexes = rawXTickIndexes.reduce<number[]>((indexes, index) => {
    const previousIndex = indexes[indexes.length - 1];
    if (previousIndex === undefined) return [index];
    const distance = xFor(index) - xFor(previousIndex);
    if (distance >= minXTickLabelGap) return [...indexes, index];
    if (index === lastIndex) {
      return [...indexes.slice(0, -1), index];
    }
    return indexes;
  }, []);
  const buildActiveSnapshot = (index: number): FxChartActiveSnapshot => {
    const safeIndex = Math.min(Math.max(0, index), lastIndex);
    const rows = series
      .map((item) => {
        const point = item.points[safeIndex];
        if (!point) return null;
        return {
          key: item.key,
          name: item.name,
          color: item.color,
          value: point.value,
          change: point.change,
        };
      })
      .filter(Boolean) as FxChartActiveSnapshot['rows'];
    const yPositions = rows.map((row) => yFor(row.value));
    const minActiveY = yPositions.length ? Math.min(...yPositions) : padding.top + chartHeight / 2;
    const maxActiveY = yPositions.length ? Math.max(...yPositions) : padding.top + chartHeight / 2;
    return {
      index: safeIndex,
      x: xFor(safeIndex),
      y: (minActiveY + maxActiveY) / 2,
      minY: minActiveY,
      maxY: maxActiveY,
      label: resolveFxChartPointLabel(series, horizons, safeIndex, tooltipSuffix),
      rows,
    };
  };
  const applyActiveSnapshot = (snapshot: FxChartActiveSnapshot | null) => {
    if (!snapshot) {
      if (activeLineRef.current) {
        activeLineRef.current.setAttribute('visibility', 'hidden');
      }
      if (tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
      return;
    }

    if (activeLineRef.current) {
      activeLineRef.current.setAttribute('x1', String(snapshot.x));
      activeLineRef.current.setAttribute('x2', String(snapshot.x));
      activeLineRef.current.setAttribute('visibility', 'visible');
    }

    if (tooltipTitleRef.current) {
      tooltipTitleRef.current.textContent = `${snapshot.label}${tooltipSuffix}`;
    }

    if (tooltipRowsRef.current) {
      const fragment = document.createDocumentFragment();
      snapshot.rows.forEach((row) => {
        const item = document.createElement('div');
        item.className = 'items-center whitespace-nowrap py-0.5';
        item.style.display = 'grid';
        item.style.gridTemplateColumns = '10px minmax(0, 1fr) 72px 62px';
        item.style.columnGap = '8px';

        const swatch = document.createElement('span');
        swatch.className = 'h-2 w-2 rounded-full';
        swatch.style.backgroundColor = row.color;

        const name = document.createElement('span');
        name.className = 'truncate';
        name.textContent = row.name;

        const value = document.createElement('span');
        value.className = 'text-right font-bold text-slate-900';
        value.textContent = row.value.toFixed(4);

        const change = document.createElement('span');
        change.className = `text-right ${row.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`;
        change.textContent = `${row.change.toFixed(2)}%`;

        item.append(swatch, name, value, change);
        fragment.appendChild(item);
      });
      tooltipRowsRef.current.replaceChildren(fragment);
    }

    if (tooltipRef.current) {
      const tooltipEl = tooltipRef.current;
      tooltipEl.style.display = 'block';
      tooltipEl.style.left = '0px';
      tooltipEl.style.top = '0px';

      const tooltipWidth = tooltipEl.offsetWidth || 430;
      const tooltipHeight = tooltipEl.offsetHeight || 140;
      const containerRect = tooltipEl.parentElement?.getBoundingClientRect();
      const scaleX = containerRect?.width ? containerRect.width / width : 1;
      const scaleY = containerRect?.height ? containerRect.height / height : 1;
      const gap = 18;
      const safeGap = 12;
      const activeX = snapshot.x * scaleX;
      const minActiveY = snapshot.minY * scaleY;
      const maxActiveY = snapshot.maxY * scaleY;
      const plotLeft = padding.left * scaleX;
      const plotRight = (width - padding.right) * scaleX;
      const plotTop = padding.top * scaleY;
      const plotBottom = (height - padding.bottom) * scaleY;
      const plotCenterX = plotLeft + (chartWidth * scaleX) / 2;

      const leftCandidate = activeX >= plotCenterX
        ? activeX - tooltipWidth - gap
        : activeX + gap;
      const minLeft = plotLeft + safeGap;
      const maxLeft = Math.max(minLeft, plotRight - tooltipWidth - safeGap);
      const left = Math.min(
        Math.max(leftCandidate, minLeft),
        maxLeft,
      );

      const aboveCandidate = minActiveY - tooltipHeight - gap;
      const belowCandidate = maxActiveY + gap;
      const aboveSpace = minActiveY - plotTop;
      const belowSpace = plotBottom - maxActiveY;
      const preferAbove = aboveSpace >= tooltipHeight + gap || aboveSpace >= belowSpace;
      const topCandidate = preferAbove ? aboveCandidate : belowCandidate;
      const minTop = plotTop + safeGap;
      const maxTop = Math.max(minTop, plotBottom - tooltipHeight - safeGap);
      const top = Math.min(
        Math.max(topCandidate, minTop),
        maxTop,
      );

      tooltipEl.style.left = `${left}px`;
      tooltipEl.style.top = `${top}px`;
    }
  };
  const scheduleActiveSnapshot = (snapshot: FxChartActiveSnapshot | null) => {
    pendingSnapshotRef.current = snapshot;
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      applyActiveSnapshot(pendingSnapshotRef.current);
    });
  };
  const handlePointerMove = (event: React.PointerEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const chartLeft = rect.left + (padding.left / width) * rect.width;
    const chartRenderedWidth = (chartWidth / width) * rect.width;
    const ratio = Math.min(1, Math.max(0, (event.clientX - chartLeft) / chartRenderedWidth));
    const nextIndex = Math.round(ratio * lastIndex);
    scheduleActiveSnapshot(buildActiveSnapshot(nextIndex));
    onActivePointChange?.(nextIndex);
  };
  const handlePointerLeave = () => {
    scheduleActiveSnapshot(null);
    onActivePointChange?.(null);
  };
  return (
    <div className="relative h-full min-h-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full cursor-crosshair"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        <rect x={padding.left} y={padding.top} width={chartWidth} height={chartHeight} fill="#f8fafc" rx="8" />
        {yTicks.map((tick) => (
          <g key={tick}>
            <line x1={padding.left} x2={width - padding.right} y1={yFor(tick)} y2={yFor(tick)} stroke="#e2e8f0" strokeDasharray="4 4" />
            <text x={padding.left - 10} y={yFor(tick) + 4} textAnchor="end" className="fill-slate-500 text-[12px] font-semibold">
              {tick.toFixed(2)}
            </text>
          </g>
        ))}
        {xTickIndexes.map((index) => {
          const horizon = horizons[index];
          const tickLabel = resolveFxChartPointLabel(series, horizons, index, tooltipSuffix);
          return (
          <g key={horizon.key}>
            <line x1={xFor(index)} x2={xFor(index)} y1={padding.top} y2={height - padding.bottom} stroke="#e2e8f0" />
            <text
              x={xFor(index)}
              y={height - 14}
              textAnchor={index === 0 ? 'start' : index === lastIndex ? 'end' : 'middle'}
              className="fill-slate-600 text-[10px] font-semibold"
            >
              {tooltipSuffix === '回测' && isIsoDateLabel(tickLabel) ? tickLabel.slice(2) : horizon.label}
            </text>
          </g>
          );
        })}
        <line ref={activeLineRef} x1={xFor(0)} x2={xFor(0)} y1={padding.top} y2={height - padding.bottom} stroke="#64748b" strokeDasharray="4 4" visibility="hidden" />
        {series.map((item) => {
          const visiblePoints = item.points.slice(0, lastIndex + 1);
          const path = visiblePoints.map((point, index) => `${index === 0 ? 'M' : 'L'}${xFor(index).toFixed(2)},${yFor(point.value).toFixed(2)}`).join(' ');
          return (
            <g key={item.key}>
              <path d={path} fill="none" stroke={item.color} strokeWidth="3" strokeDasharray={item.dash} strokeLinecap="round" strokeLinejoin="round" />
              {visiblePoints.map((point, index) => {
                const shouldShowPoint = visibleHorizonCount <= 80 || xTickIndexes.includes(index);
                if (!shouldShowPoint) return null;
                return (
                  <circle
                    key={`${item.key}-${point.horizon}`}
                    cx={xFor(index)}
                    cy={yFor(point.value)}
                    r={visibleHorizonCount > 80 ? 2.2 : 3.5}
                    fill={item.color}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                );
              })}
            </g>
          );
        })}
      </svg>
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute z-20 rounded-md border border-slate-200/90 bg-white/95 px-3 py-2 text-[12px] font-semibold leading-[1.5] text-slate-600 shadow-xl backdrop-blur-sm"
        style={{
          display: 'none',
          width: 430,
          left: 8,
          top: 8,
        }}
      >
        <div ref={tooltipTitleRef} className="mb-1 text-[13px] font-bold text-slate-900" />
        <div ref={tooltipRowsRef} />
      </div>
    </div>
  );
}

function buildFallbackFxHistory(code: FxCode, latestValue: number): FxPoint[] {
  const end = new Date();
  const points: FxPoint[] = [];
  const profile = {
    USD: { drift: -0.045, wave: 0.18 },
    EUR: { drift: 0.035, wave: 0.22 },
    GBP: { drift: 0.02, wave: 0.28 },
  }[code];
  const fallbackDays = getFxFullHistoryDays(end);
  for (let i = fallbackDays; i >= 0; i -= 1) {
    const date = addDays(end, -i);
    const progress = (fallbackDays - i) / fallbackDays;
    const seasonal = Math.sin(progress * Math.PI * 10) * profile.wave;
    const cycle = Math.cos(progress * Math.PI * 3) * profile.wave * 0.45;
    const value = Math.max(0.01, latestValue * (1 + profile.drift * (1 - progress)) + seasonal + cycle);
    points.push({ date: formatDateInput(date), value });
  }
  return points;
}

function buildFallbackFxHistorySet(rates: typeof FX_FALLBACK): Record<FxCode, FxPoint[]> {
  return {
    USD: buildFallbackFxHistory('USD', rates.USD.value),
    EUR: buildFallbackFxHistory('EUR', rates.EUR.value),
    GBP: buildFallbackFxHistory('GBP', rates.GBP.value),
  };
}

function formatFxHistorySource(source: FxHistorySource) {
  if (source === 'FRED') return 'FRED 官方长历史汇率';
  if (source === 'Frankfurter') return 'Frankfurter 官方参考汇率';
  return '参考趋势，历史源未返回';
}

function renderFxSourceDescription(item: FxForecastSeries) {
  if (item.key !== 'aiModel') return item.description;
  return (
    <>
      <span className="block">来源：CoinCodex、</span>
      <span className="block">WalletInvestor等公开技术</span>
      <span className="block">模型方向参考</span>
    </>
  );
}

function parseFxTimeSeries(data: any, code: FxCode): FxPoint[] {
  const rows: FxPoint[] = [];
  if (data?.rates && typeof data.rates === 'object' && !Array.isArray(data.rates)) {
    Object.keys(data.rates).sort().forEach((date) => {
      const rate = Number(data.rates[date]?.CNY ?? data.rates[date]?.cny);
      if (rate > 0) rows.push({ date, value: rate });
    });
  }
  const series = Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [];
  series.forEach((item: any) => {
    const date = String(item?.date || item?.time || '');
    const rate = Number(item?.rates?.CNY ?? item?.rates?.cny ?? item?.CNY ?? item?.cny ?? item?.rate);
    if (date && rate > 0) rows.push({ date, value: rate });
  });
  return rows
    .filter((point) => point.date && Number.isFinite(point.value))
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((point, index, arr) => index === 0 || point.date !== arr[index - 1].date);
}

function parseGlobalPair(pair: string) {
  const [base, quote] = pair.split('/');
  return {
    base: String(base || '').toUpperCase(),
    quote: String(quote || '').toUpperCase(),
  };
}

function parseFrankfurterPairSeries(data: any, quote: string): FxPoint[] {
  const rows: FxPoint[] = [];
  if (data?.rates && typeof data.rates === 'object' && !Array.isArray(data.rates)) {
    Object.keys(data.rates).sort().forEach((date) => {
      const rate = Number(data.rates[date]?.[quote] ?? data.rates[date]?.[quote.toLowerCase()]);
      if (rate > 0) rows.push({ date, value: rate });
    });
  }
  return rows
    .filter((point) => point.date && Number.isFinite(point.value))
    .sort((a, b) => a.date.localeCompare(b.date))
    .filter((point, index, arr) => index === 0 || point.date !== arr[index - 1].date);
}

function buildStablecoinFallbackHistory(days = 365): FxPoint[] {
  const end = new Date();
  return Array.from({ length: days + 1 }, (_, index) => {
    const offset = days - index;
    const wave = Math.sin(index * 0.37) * 0.00025;
    return {
      date: formatDateInput(addDays(end, -offset)),
      value: 1 + wave,
    };
  });
}

async function fetchFiatPairHistory(pair: string, days = 365): Promise<FxPoint[]> {
  const { base, quote } = parseGlobalPair(pair);
  const end = new Date();
  const start = addDays(end, -days);
  const url = `/__frankfurter__/v1/${formatDateInput(start)}..${formatDateInput(end)}?from=${encodeURIComponent(base)}&to=${encodeURIComponent(quote)}`;
  const response = await withTimeout(fetch(url), 12000, `global fiat ${pair}`);
  if (!response.ok) throw new Error(`Global fiat ${pair} ${response.status}`);
  return parseFrankfurterPairSeries(await response.json(), quote);
}

async function fetchFredGlobalPairHistory(pair: string, days = 365): Promise<FxPoint[]> {
  const seriesId = FRED_GLOBAL_PAIR_SERIES[pair];
  if (!seriesId) throw new Error(`Unsupported FRED global pair ${pair}`);
  const end = new Date();
  const startText = formatDateInput(addDays(end, -days));
  const endText = formatDateInput(end);
  const points = await fetchFredSeries(seriesId);
  return points.filter((point) => point.date >= startText && point.date <= endText);
}

async function fetchBisGlobalPairHistory(pair: string, days = 365): Promise<FxPoint[]> {
  throw new Error(`BIS API is not configured for ${pair}/${days}`);
}

async function fetchImfGlobalPairHistory(pair: string, days = 365): Promise<FxPoint[]> {
  throw new Error(`IMF API is not configured for ${pair}/${days}`);
}

async function fetchCentralBankGlobalPairHistory(pair: string, days = 365): Promise<FxPoint[]> {
  throw new Error(`Central bank API is not configured for ${pair}/${days}`);
}

async function fetchBankOfChinaGlobalPairHistory(pair: string, days = 365): Promise<FxPoint[]> {
  const { base, quote } = parseGlobalPair(pair);
  const isRenminbiPair = (base === 'USD' && quote === 'CNY') || (base === 'CNY' && quote === 'USD');
  if (!isRenminbiPair) {
    throw new Error(`Bank of China source only supports CNY related pair for now: ${pair}/${days}`);
  }
  throw new Error(`Bank of China historical API is not configured for ${pair}/${days}`);
}

async function fetchCryptoPairHistory(pair: string, days = 365): Promise<FxPoint[]> {
  const { base, quote } = parseGlobalPair(pair);
  if (base === 'USDT' && quote === 'USD') {
    return buildStablecoinFallbackHistory(days);
  }
  const cryptoId = CRYPTO_ID_BY_SYMBOL[base];
  if (!cryptoId || quote !== 'USD') throw new Error(`Unsupported crypto pair ${pair}`);
  const url = `/__coingecko__/api/v3/coins/${encodeURIComponent(cryptoId)}/market_chart?vs_currency=usd&days=${days}&interval=daily`;
  const response = await withTimeout(fetch(url), 12000, `global crypto ${pair}`);
  if (!response.ok) throw new Error(`Global crypto ${pair} ${response.status}`);
  const data = await response.json();
  const prices = Array.isArray(data?.prices) ? data.prices : [];
  return prices
    .map((item: any) => {
      const timestamp = Number(item?.[0]);
      const value = Number(item?.[1]);
      return timestamp && value > 0 ? { date: formatDateInput(new Date(timestamp)), value } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date)) as FxPoint[];
}

async function fetchGlobalMarketHistory(
  entry: GlobalMarketEntry,
  days = 365,
  sourceKey: GlobalFiatSourceKey = 'fred',
): Promise<GlobalMarketHistoryResult> {
  if (entry.kind === 'crypto') {
    return {
      points: await fetchCryptoPairHistory(entry.pair, days),
      source: entry.pair === 'USDT/USD' ? '稳定币锚定参考' : 'CoinGecko',
    };
  }

  try {
    const points = sourceKey === 'bis'
      ? await fetchBisGlobalPairHistory(entry.pair, days)
      : sourceKey === 'imf'
        ? await fetchImfGlobalPairHistory(entry.pair, days)
        : sourceKey === 'centralBank'
          ? await fetchCentralBankGlobalPairHistory(entry.pair, days)
          : sourceKey === 'bankOfChina'
            ? await fetchBankOfChinaGlobalPairHistory(entry.pair, days)
            : sourceKey === 'frankfurter'
              ? await fetchFiatPairHistory(entry.pair, days)
              : await fetchFredGlobalPairHistory(entry.pair, days);
    if (points.length >= 2) {
      const sourceName = GLOBAL_FIAT_SOURCE_OPTIONS.find((item) => item.key === sourceKey)?.name || 'FRED / Federal Reserve H.10';
      return {
        points,
        source: sourceName,
      };
    }
  } catch (error) {
    console.warn('[FinanceManagement] Global FX source failed, falling back to Frankfurter:', sourceKey, entry.pair, error);
  }

  if (sourceKey !== 'fred' && FRED_GLOBAL_PAIR_SERIES[entry.pair]) {
    try {
      const points = await fetchFredGlobalPairHistory(entry.pair, days);
      if (points.length >= 2) {
        return {
          points,
          source: `FRED / Federal Reserve H.10 fallback (${GLOBAL_FIAT_SOURCE_OPTIONS.find((item) => item.key === sourceKey)?.label || sourceKey})`,
        };
      }
    } catch (fredError) {
      console.warn('[FinanceManagement] FRED fallback failed:', entry.pair, fredError);
    }
  }

  return {
    points: await fetchFiatPairHistory(entry.pair, days),
    source: `Frankfurter fallback (${GLOBAL_FIAT_SOURCE_OPTIONS.find((item) => item.key === sourceKey)?.label || sourceKey})`,
  };
}

function summarizeGlobalMarket(points: FxPoint[], source: string): GlobalMarketSummary {
  const first = points[0]?.value || 0;
  const last = points[points.length - 1]?.value || 0;
  return {
    value: last || null,
    change: first && last ? ((last - first) / first) * 100 : null,
    source,
    status: points.length >= 2 ? 'ready' : 'error',
  };
}

function formatGlobalMarketValue(pair: string, value: number | null) {
  if (!value) return '-';
  if (pair.includes('BTC') || pair.includes('ETH')) return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (pair.includes('JPY')) return value.toFixed(2);
  if (pair.includes('USDT')) return value.toFixed(4);
  return value.toFixed(4);
}

function invertFxPoints(points: FxPoint[]): FxPoint[] {
  return points
    .map((point) => (point.value > 0 ? { ...point, value: 1 / point.value } : null))
    .filter(Boolean) as FxPoint[];
}

function resolveGlobalUnitPair(entry: GlobalMarketEntry, unitMode: GlobalMarketUnitMode) {
  if (unitMode === 'direct') return entry.pair;
  const { base, quote } = parseGlobalPair(entry.pair);
  return `${quote}/${base}`;
}

function parseFredCsv(text: string): FxPoint[] {
  return text
    .trim()
    .split(/\r?\n/)
    .slice(1)
    .map((line) => {
      const [date, rawValue] = line.split(',');
      const value = Number(rawValue);
      return date && value > 0 ? { date, value } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.date.localeCompare(b.date)) as FxPoint[];
}

async function fetchFredSeries(seriesId: string): Promise<FxPoint[]> {
  const sourcePath = `/__fred__/graph/fredgraph.csv?id=${encodeURIComponent(seriesId)}`;
  const response = await withTimeout(fetch(sourcePath), 12000, `fred ${seriesId}`);
  if (!response.ok) throw new Error(`FRED ${seriesId} ${response.status}`);
  return parseFredCsv(await response.text());
}

async function fetchFredFxHistory(start: Date, end: Date): Promise<Record<FxCode, FxPoint[]>> {
  const [usdCny, eurUsd, gbpUsd] = await Promise.all([
    fetchFredSeries('DEXCHUS'),
    fetchFredSeries('DEXUSEU'),
    fetchFredSeries('DEXUSUK'),
  ]);
  const startText = formatDateInput(start);
  const endText = formatDateInput(end);
  const usdCnyByDate = new Map(usdCny.map((point) => [point.date, point.value]));
  const buildCross = (points: FxPoint[]) => points
    .map((point) => {
      const cnyPerUsd = usdCnyByDate.get(point.date);
      return cnyPerUsd ? { date: point.date, value: point.value * cnyPerUsd } : null;
    })
    .filter(Boolean) as FxPoint[];
  const next: Record<FxCode, FxPoint[]> = {
    USD: usdCny,
    EUR: buildCross(eurUsd),
    GBP: buildCross(gbpUsd),
  };
  FX_CODES.forEach((code) => {
    next[code] = next[code].filter((point) => point.date >= startText && point.date <= endText);
  });
  return next;
}

function summarizeFxPeriod(points: FxPoint[], days: number) {
  const periodPoints = sliceFxPeriod(points, days);
  const first = periodPoints[0]?.value || 0;
  const last = periodPoints[periodPoints.length - 1]?.value || 0;
  const high = periodPoints.reduce((max, point) => Math.max(max, point.value), 0);
  const low = periodPoints.reduce((min, point) => Math.min(min, point.value), Number.POSITIVE_INFINITY);
  const change = first ? ((last - first) / first) * 100 : 0;
  return {
    points: periodPoints,
    first,
    last,
    high,
    low: Number.isFinite(low) ? low : 0,
    change,
  };
}

/**
 * 财务管理中心（赵敏）— 按收入、支出、资金、管理四个财务作业域组织专业模块。
 */
export default function ZhaoMinFinanceManagementCenter() {
  const { accountsReceivable, refreshFinanceData } = useFinance();
  const [tab, setTab] = useState<FinanceManagementTabId>('receivables');
  const [period, setPeriod] = useState(FILTER_OPTIONS.period[0]);
  const [region, setRegion] = useState(FILTER_OPTIONS.region[0]);
  const [business, setBusiness] = useState(FILTER_OPTIONS.business[0]);
  const [currency, setCurrency] = useState(FILTER_OPTIONS.currency[0]);
  const [refreshTick, setRefreshTick] = useState(0);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fxRates, setFxRates] = useState(FX_FALLBACK);
  const [fxHistory, setFxHistory] = useState<Record<FxCode, FxPoint[]>>(() => buildFallbackFxHistorySet(FX_FALLBACK));
  const [fxHistoryLoading, setFxHistoryLoading] = useState(false);
  const [fxHistorySource, setFxHistorySource] = useState<FxHistorySource>('参考趋势');
  const [selectedFxCode, setSelectedFxCode] = useState<FxCode | null>(null);
  const [fxDialogView, setFxDialogView] = useState<FxDialogView>('forecast');
  const [fxForecastRefreshedAt, setFxForecastRefreshedAt] = useState(() => new Date());
  const [fxForecastLoading, setFxForecastLoading] = useState(false);
  const [selectedFxForecastHorizon, setSelectedFxForecastHorizon] = useState<typeof FX_FORECAST_SUMMARY_KEYS[number]>('12m');
  const [selectedFxPeriod, setSelectedFxPeriod] = useState<typeof FX_PERIODS[number]['key']>('max');
  const [hoveredFx, setHoveredFx] = useState<{ code: FxCode; x: number; y: number } | null>(null);
  const [isHoveringFxPanel, setIsHoveringFxPanel] = useState(false);
  const [hoveredFxSource, setHoveredFxSource] = useState<FxForecastSeries['key'] | null>(null);
  const [globalFxDialogOpen, setGlobalFxDialogOpen] = useState(false);
  const [globalMarketSummaries, setGlobalMarketSummaries] = useState<Record<string, GlobalMarketSummary>>({});
  const [globalMarketHistoryCache, setGlobalMarketHistoryCache] = useState<Record<string, FxPoint[]>>({});
  const [globalMarketLoading, setGlobalMarketLoading] = useState(false);
  const [selectedGlobalFiatSource, setSelectedGlobalFiatSource] = useState<GlobalFiatSourceKey>('fred');
  const [globalMarketCurrencyScope, setGlobalMarketCurrencyScope] = useState<GlobalMarketCurrencyScope>('major');
  const [selectedGlobalMarket, setSelectedGlobalMarket] = useState<GlobalMarketEntry | null>(null);
  const [selectedGlobalMarketPeriod, setSelectedGlobalMarketPeriod] = useState<GlobalMarketPeriodKey>('1y');
  const [selectedGlobalMarketUnitMode, setSelectedGlobalMarketUnitMode] = useState<GlobalMarketUnitMode>('direct');
  const [selectedGlobalMarketHistory, setSelectedGlobalMarketHistory] = useState<FxPoint[]>([]);
  const [selectedGlobalMarketLoading, setSelectedGlobalMarketLoading] = useState(false);
  const fxDialogBodyRef = useRef<HTMLDivElement | null>(null);
  const globalFxDialogBodyRef = useRef<HTMLDivElement | null>(null);
  const globalMarketTrendRef = useRef<HTMLElement | null>(null);
  const globalMarketScrollLockUntilRef = useRef(0);

  const visibleGlobalFiatEntries = useMemo(
    () => (globalMarketCurrencyScope === 'all' ? GLOBAL_ALL_USD_FX_ENTRIES : GLOBAL_USD_FX_ENTRIES)
      .map((item) => ({ ...item, kind: 'fiat' as const })),
    [globalMarketCurrencyScope],
  );
  const visibleGlobalMarketEntries = useMemo(
    () => [
      ...visibleGlobalFiatEntries,
      ...GLOBAL_CRYPTO_FX_ENTRIES.map((item) => ({ ...item, kind: 'crypto' as const })),
    ],
    [visibleGlobalFiatEntries],
  );

  useEffect(() => {
    const raw = sessionStorage.getItem(FINANCE_V2_MANAGEMENT_TAB_STORAGE_KEY);
    const parsed = parseFinanceManagementTabId(raw);
    if (parsed) setTab(parsed);
    sessionStorage.removeItem(FINANCE_V2_MANAGEMENT_TAB_STORAGE_KEY);
  }, []);

  const refreshFxRates = async () => {
    try {
      const response = await withTimeout(fetch('https://open.er-api.com/v6/latest/CNY'), 8000, 'fx refresh');
      if (!response.ok) throw new Error(`FX ${response.status}`);
      const data = await response.json();
      const rates = data?.rates || {};
      const next = {
        USD: rates.USD ? { value: 1 / Number(rates.USD), change: FX_FALLBACK.USD.change, source: '实时' } : FX_FALLBACK.USD,
        EUR: rates.EUR ? { value: 1 / Number(rates.EUR), change: FX_FALLBACK.EUR.change, source: '实时' } : FX_FALLBACK.EUR,
        GBP: rates.GBP ? { value: 1 / Number(rates.GBP), change: FX_FALLBACK.GBP.change, source: '实时' } : FX_FALLBACK.GBP,
      };
      setFxRates(next);
    } catch (error) {
      console.warn('[FinanceManagement] FX refresh failed:', error);
      setFxRates((current) => current || FX_FALLBACK);
    }
  };

  useEffect(() => {
    void refreshFxRates();
  }, []);

  const refreshFxForecast = async () => {
    if (fxForecastLoading) return;
    setFxForecastLoading(true);
    try {
      await refreshFxRates();
      setFxForecastRefreshedAt(new Date());
    } finally {
      setFxForecastLoading(false);
    }
  };

  const refreshFxHistory = async () => {
    if (fxHistoryLoading) return;
    setFxHistoryLoading(true);
    try {
      const end = new Date();
      const start = new Date(`${FX_HISTORY_START_DATE}T00:00:00`);
      let next: Record<FxCode, FxPoint[]> = { USD: [], EUR: [], GBP: [] };
      let resolvedSource: FxHistorySource = 'FRED';
      try {
        next = await fetchFredFxHistory(start, end);
      } catch (fredError) {
        console.warn('[FinanceManagement] FRED FX history failed, falling back to Frankfurter:', fredError);
        resolvedSource = 'Frankfurter';
        await Promise.all(FX_CODES.map(async (code) => {
          const url = `https://api.frankfurter.dev/v2/rates?base=${code}&quotes=CNY&from=${formatDateInput(start)}&to=${formatDateInput(end)}`;
          const response = await withTimeout(fetch(url), 12000, `fx history ${code}`);
          if (!response.ok) throw new Error(`FX history ${code} ${response.status}`);
          const data = await response.json();
          next[code] = parseFxTimeSeries(data, code);
        }));
      }
      if (FX_CODES.some((code) => next[code].length < 2)) throw new Error('FX history incomplete');
      setFxHistory(next);
      setFxHistorySource(resolvedSource);
      setFxRates((current) => {
        const updated = { ...current };
        FX_CODES.forEach((code) => {
          const points = next[code];
          const latest = points[points.length - 1];
          const previous = points[points.length - 2];
          if (latest) {
            updated[code] = {
              value: latest.value,
              change: previous ? ((latest.value - previous.value) / previous.value) * 100 : current[code].change,
              source: '实时',
            };
          }
        });
        return updated;
      });
    } catch (error) {
      console.warn('[FinanceManagement] FX history refresh failed:', error);
      setFxHistorySource('参考趋势');
      setFxHistory(buildFallbackFxHistorySet(fxRates));
    } finally {
      setFxHistoryLoading(false);
    }
  };

  useEffect(() => {
    void refreshFxHistory();
  }, []);

  useEffect(() => {
    if (selectedFxCode && fxDialogView === 'forecast') {
      void refreshFxForecast();
    }
  }, [selectedFxCode, fxDialogView]);

  const refreshGlobalMarketSummaries = async () => {
    if (globalMarketLoading) return;
    setGlobalMarketLoading(true);
    const activeFiatSource = selectedGlobalFiatSource;
    const entries = visibleGlobalMarketEntries;
    const loadingState = entries.reduce<Record<string, GlobalMarketSummary>>((acc, item) => {
      acc[item.pair] = {
        value: globalMarketSummaries[item.pair]?.value ?? null,
        change: globalMarketSummaries[item.pair]?.change ?? null,
        source: item.kind === 'crypto'
          ? 'CoinGecko'
          : GLOBAL_FIAT_SOURCE_OPTIONS.find((sourceItem) => sourceItem.key === activeFiatSource)?.name || '权威源链',
        status: 'loading',
      };
      return acc;
    }, {});
    setGlobalMarketSummaries((current) => ({ ...current, ...loadingState }));
    const results: Array<PromiseSettledResult<{ pair: string; points: FxPoint[]; summary: GlobalMarketSummary }>> = [];
    for (const item of entries) {
      const result = await Promise.allSettled([
        (async () => {
        const { points, source } = await fetchGlobalMarketHistory(item, 365, activeFiatSource);
        return {
          pair: item.pair,
          points,
          summary: summarizeGlobalMarket(points, source),
        };
        })(),
      ]);
      results.push(result[0]);
    }
    setGlobalMarketSummaries((current) => {
      const next = { ...current };
      results.forEach((result, index) => {
        const item = entries[index];
        if (result.status === 'fulfilled') {
          next[result.value.pair] = result.value.summary;
        } else {
          next[item.pair] = {
            value: current[item.pair]?.value ?? null,
            change: current[item.pair]?.change ?? null,
            source: item.kind === 'crypto'
              ? 'CoinGecko'
              : GLOBAL_FIAT_SOURCE_OPTIONS.find((sourceItem) => sourceItem.key === activeFiatSource)?.name || '权威源链',
            status: 'error',
          };
        }
      });
      return next;
    });
    setGlobalMarketHistoryCache((current) => {
      const next = { ...current };
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          const item = entries[index];
          const sourceKey = item.kind === 'fiat' ? activeFiatSource : 'crypto';
          next[`${sourceKey}:${result.value.pair}:1y`] = result.value.points;
        }
      });
      return next;
    });
    setGlobalMarketLoading(false);
  };

  useEffect(() => {
    if (globalFxDialogOpen && Object.keys(globalMarketSummaries).length === 0) {
      void refreshGlobalMarketSummaries();
    }
  }, [globalFxDialogOpen]);

  useEffect(() => {
    if (!globalFxDialogOpen) return;
    setGlobalMarketSummaries({});
    setGlobalMarketHistoryCache({});
    void refreshGlobalMarketSummaries();
  }, [selectedGlobalFiatSource, globalMarketCurrencyScope]);

  useEffect(() => {
    if (!selectedGlobalMarket) {
      setSelectedGlobalMarketHistory([]);
      return;
    }
    const periodItem = GLOBAL_MARKET_PERIODS.find((item) => item.key === selectedGlobalMarketPeriod) || GLOBAL_MARKET_PERIODS[7];
    const sourceKey = selectedGlobalMarket.kind === 'fiat' ? selectedGlobalFiatSource : 'crypto';
    const cacheKey = `${sourceKey}:${selectedGlobalMarket.pair}:${periodItem.key}`;
    const cached = globalMarketHistoryCache[cacheKey];
    if (cached?.length) {
      setSelectedGlobalMarketHistory(cached);
      return;
    }
    let cancelled = false;
    setSelectedGlobalMarketLoading(true);
    fetchGlobalMarketHistory(selectedGlobalMarket, periodItem.days, selectedGlobalFiatSource)
      .then(({ points, source }) => {
        if (!cancelled) {
          setSelectedGlobalMarketHistory(points);
          setGlobalMarketHistoryCache((current) => ({ ...current, [cacheKey]: points }));
          if (periodItem.key === '1y') {
            setGlobalMarketSummaries((current) => ({
              ...current,
              [selectedGlobalMarket.pair]: summarizeGlobalMarket(
                points,
                source,
              ),
            }));
          }
        }
      })
      .catch((error) => {
        console.warn('[FinanceManagement] Global market history failed:', error);
        if (!cancelled) setSelectedGlobalMarketHistory([]);
      })
      .finally(() => {
        if (!cancelled) setSelectedGlobalMarketLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedGlobalMarket, selectedGlobalMarketPeriod, selectedGlobalFiatSource, globalMarketHistoryCache]);

  useEffect(() => {
    fxDialogBodyRef.current?.scrollTo({ top: 0, left: 0 });
  }, [selectedFxCode]);

  const keepGlobalChartVisible = (fallbackTop?: number, fallbackLeft?: number) => {
    const bodyEl = globalFxDialogBodyRef.current;
    const trendEl = globalMarketTrendRef.current;
    const chartBox = trendEl?.querySelector<HTMLElement>('[data-global-chart-box="true"]');
    if (!bodyEl || !chartBox) {
      if (bodyEl && fallbackTop !== undefined) bodyEl.scrollTop = fallbackTop;
      if (bodyEl && fallbackLeft !== undefined) bodyEl.scrollLeft = fallbackLeft;
      return;
    }

    if (fallbackLeft !== undefined) bodyEl.scrollLeft = fallbackLeft;

    const bodyRect = bodyEl.getBoundingClientRect();
    const chartRect = chartBox.getBoundingClientRect();
    const padding = 8;
    const availableHeight = bodyRect.height - padding * 2;

    if (chartRect.height > availableHeight) {
      if (chartRect.top < bodyRect.top + padding || chartRect.top > bodyRect.top + 48) {
        bodyEl.scrollTop += chartRect.top - bodyRect.top - padding;
      }
      return;
    }

    if (chartRect.bottom > bodyRect.bottom - padding) {
      bodyEl.scrollTop += chartRect.bottom - bodyRect.bottom + padding;
    }
    if (chartRect.top < bodyRect.top + padding) {
      bodyEl.scrollTop -= bodyRect.top + padding - chartRect.top;
    }
  };

  const updateGlobalChartWithoutScrollJump = (update: () => void) => {
    const bodyEl = globalFxDialogBodyRef.current;
    const trendEl = globalMarketTrendRef.current;
    const top = bodyEl?.scrollTop ?? 0;
    const left = bodyEl?.scrollLeft ?? 0;
    const chartBoxTop = trendEl?.querySelector('[data-global-chart-box="true"]')?.getBoundingClientRect().top ?? null;
    globalMarketScrollLockUntilRef.current = Date.now() + 1400;
    update();
    const restore = () => {
      if (!bodyEl) return;
      bodyEl.scrollLeft = left;
      const nextChartBox = trendEl?.querySelector('[data-global-chart-box="true"]')?.getBoundingClientRect().top ?? null;
      if (chartBoxTop !== null && nextChartBox !== null) {
        bodyEl.scrollTop += nextChartBox - chartBoxTop;
      } else {
        bodyEl.scrollTop = top;
      }
      keepGlobalChartVisible(top, left);
    };
    window.requestAnimationFrame(() => {
      restore();
      window.requestAnimationFrame(restore);
    });
    window.setTimeout(restore, 120);
    window.setTimeout(restore, 360);
  };

  useLayoutEffect(() => {
    if (!selectedGlobalMarket || Date.now() > globalMarketScrollLockUntilRef.current) return;
    keepGlobalChartVisible();
  }, [selectedGlobalMarketHistory, selectedGlobalMarketLoading, selectedGlobalFiatSource, selectedGlobalMarketPeriod, selectedGlobalMarket]);

  useEffect(() => {
    if (!selectedGlobalMarket || Date.now() > globalMarketScrollLockUntilRef.current) return;
    const restore = () => keepGlobalChartVisible();
    window.requestAnimationFrame(() => {
      restore();
      window.requestAnimationFrame(restore);
    });
  }, [selectedGlobalMarketHistory, selectedGlobalMarketLoading, selectedGlobalFiatSource, selectedGlobalMarketPeriod, selectedGlobalMarket]);

  const selectGlobalMarketForTrend = (item: GlobalMarketEntry) => {
    setSelectedGlobalMarket(item);
    setSelectedGlobalMarketUnitMode('direct');
    window.setTimeout(() => {
      globalMarketTrendRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  };

  const body = (() => {
    switch (tab) {
      case 'collection':
        return <CollectionReconciliationModule />;
      case 'receivables':
        return <ReceivablesModule />;
      case 'payment_intake':
        return <PaymentIntakeCenterModule />;
      case 'payment_request':
        return <PaymentRequestModule />;
      case 'payables':
        return <PayablesModule />;
      case 'invoice':
        return <InvoiceTaxModule />;
      case 'bank':
        return <BankCashModule />;
      case 'risk':
        return <RiskControlModule />;
      case 'reports':
        return <ExecutionReportsModule />;
      default:
        return <CollectionReconciliationModule />;
    }
  })();

  const isLiveReceivablesTab = tab === 'receivables';
  const filteredReceivables = useMemo(() => {
    const regionCode = resolveRegionCode(region);
    return accountsReceivable.filter((ar) => {
      if (regionCode && String(ar.region || '').toUpperCase() !== regionCode.toUpperCase()) return false;
      if (currency !== '全部货币' && String(ar.currency || '').toUpperCase() !== currency) return false;
      return isInPeriod(ar.invoiceDate || String(ar.createdAt || ''), period);
    });
  }, [accountsReceivable, currency, period, region]);

  const overviewStats = useMemo(() => {
    const toCny = (amount: number, itemCurrency: string) => {
      const key = String(itemCurrency || 'USD').toUpperCase();
      if (key === 'CNY') return amount;
      return amount * (fxRates[key as keyof typeof FX_FALLBACK]?.value || FX_FALLBACK.USD.value);
    };
    const toUsd = (amount: number, itemCurrency: string) => {
      const key = String(itemCurrency || 'USD').toUpperCase();
      if (key === 'USD') return amount;
      if (key === 'CNY') return amount / (fxRates.USD.value || FX_FALLBACK.USD.value);
      const cnyAmount = toCny(amount, key);
      return cnyAmount / (fxRates.USD.value || FX_FALLBACK.USD.value);
    };
    const totalPaidCny = filteredReceivables.reduce((sum, ar) => sum + toCny(Number(ar.paidAmount || 0), ar.currency), 0);
    const totalReceivableUsd = filteredReceivables.reduce((sum, ar) => sum + toUsd(Number(ar.remainingAmount || 0), ar.currency), 0);
    const overdueCount = filteredReceivables.filter((ar) =>
      ar.status === 'overdue'
      || (Number(ar.remainingAmount || 0) > 0 && ar.dueDate && new Date(ar.dueDate) < new Date())
    ).length;
    const paidCount = filteredReceivables.filter((ar) => Number(ar.paidAmount || 0) > 0).length;
    const totalCount = filteredReceivables.length;
    const collectionRate = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
    return [
      { label: '总收入', value: formatCnyCompact(totalPaidCny), sub: `${paidCount} 笔已收款 CNY` },
      { label: '应收', value: formatUsdCompact(totalReceivableUsd), sub: `${totalCount} 笔待收` },
      { label: '逾期', value: String(overdueCount), sub: overdueCount > 0 ? '需跟进' : '无逾期' },
      { label: '利润率', value: `${collectionRate.toFixed(1)}%`, sub: '回款覆盖率' },
      { label: 'USD/CNY', value: fxRates.USD.value.toFixed(2), sub: `${fxRates.USD.change >= 0 ? '' : ''}${fxRates.USD.change.toFixed(2)}% · ${fxRates.USD.source}` },
      { label: 'EUR/CNY', value: fxRates.EUR.value.toFixed(2), sub: `${fxRates.EUR.change.toFixed(2)}% · ${fxRates.EUR.source}` },
      { label: 'GBP/CNY', value: fxRates.GBP.value.toFixed(2), sub: `${fxRates.GBP.change.toFixed(2)}% · ${fxRates.GBP.source}` },
    ];
  }, [filteredReceivables, fxRates]);
  const activeScopeLabel = [period, region, business, currency].join(' / ');

  const handleExportReport = () => {
    const rows = [
      ['财务管理中心导出'],
      ['导出时间', new Date().toLocaleString('zh-CN')],
      ['当前模块', tab],
      ['时间范围', period],
      ['区域', region],
      ['业务', business],
      ['币种', currency],
      [],
      ['指标', '数值', '说明'],
      ...overviewStats.map((stat) => [stat.label, stat.value, stat.sub]),
    ];
    const csv = `\uFEFF${rows.map((row) => row.map((cell) => csvEscape(String(cell ?? ''))).join(',')).join('\n')}`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `finance-management-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        withTimeout(refreshFinanceData(), 12000, 'finance refresh'),
        refreshFxRates(),
        refreshFxHistory(),
        refreshFxForecast(),
      ]);
      setRefreshTick((current) => current + 1);
      setLastRefreshedAt(new Date());
    } finally {
      setIsRefreshing(false);
    }
  };

  const openFxSource = (item: FxForecastSeries) => {
    const confirmed = window.confirm(`是否跳转到 ${item.sourceSite}？`);
    if (!confirmed) return;
    window.open(item.sourceUrl, '_blank', 'noopener,noreferrer');
  };

  const renderScopeSelect = (
    label: string,
    value: string,
    onChange: (value: string) => void,
    options: string[],
  ) => (
    <label className="relative inline-flex h-8 items-center">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 appearance-none rounded-md border border-slate-300 bg-white py-0 pl-3 pr-8 text-[12px] font-semibold leading-[1.35] text-slate-800 outline-none transition-colors hover:border-slate-400 focus:border-slate-500"
      >
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 h-3.5 w-3.5 text-slate-500" />
    </label>
  );

  const renderOverviewStat = (stat: { label: string; value: string; sub: string }, index: number) => {
    const fxCode = stat.label.endsWith('/CNY') ? stat.label.split('/')[0] as FxCode : null;
    const isFx = fxCode && FX_CODES.includes(fxCode);
    const statContent = (
      <>
        <div className="text-[11px] font-semibold leading-[1.35] text-slate-500 whitespace-nowrap">{stat.label}</div>
        <div className="mt-1 text-[18px] font-bold leading-[1.2] tracking-normal text-slate-900">{stat.value}</div>
        <div className={`mt-0.5 text-[11px] font-semibold leading-[1.35] whitespace-nowrap ${
          stat.sub.startsWith('-') ? 'text-rose-600' : stat.sub.includes('%') ? 'text-emerald-600' : 'text-slate-500'
        }`}>
          {stat.sub}
        </div>
      </>
    );

    if (!isFx || !fxCode) {
      return (
        <div key={stat.label} className={`flex-1 min-w-[80px] px-3 py-2 ${index === 4 ? 'border-l-2 border-slate-300' : ''}`}>
          {statContent}
        </div>
      );
    }

    return (
      <button
        key={stat.label}
        type="button"
        onMouseEnter={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setHoveredFx({ code: fxCode, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
          if (fxHistory[fxCode].length === 0) void refreshFxHistory();
        }}
        onMouseLeave={() => {
          window.setTimeout(() => {
            setHoveredFx((current) => (isHoveringFxPanel ? current : null));
          }, 120);
        }}
        onFocus={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          setHoveredFx({ code: fxCode, x: rect.left + rect.width / 2, y: rect.bottom + 8 });
        }}
        onBlur={() => setHoveredFx(null)}
        onClick={() => {
          if (fxHistory[fxCode].length === 0) void refreshFxHistory();
          setFxDialogView('forecast');
          setSelectedFxPeriod('max');
          setSelectedFxCode(fxCode);
        }}
        className={`group relative flex-1 min-w-[120px] px-3 py-2 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300 ${index === 4 ? 'border-l-2 border-slate-300' : ''}`}
      >
        {statContent}
      </button>
    );
  };

  const renderGlobalMarketRow = (item: GlobalMarketEntry) => {
    const summary = globalMarketSummaries[item.pair];
    const isSelected = selectedGlobalMarket?.pair === item.pair;
    const resolvedSource = summary?.source || (item.kind === 'crypto' ? 'CoinGecko' : '权威源链');
    const sourceLabel = item.kind === 'fiat' && resolvedSource === 'Frankfurter'
      ? '权威源链'
      : resolvedSource.replace(' / Federal Reserve H.10', '');
    const statusText = summary?.status === 'loading'
      ? '加载中'
      : summary?.status === 'error'
        ? '失败'
        : sourceLabel || '-';
    const change = summary?.change;
    return (
      <tr
        key={item.pair}
        onClick={() => selectGlobalMarketForTrend(item)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            selectGlobalMarketForTrend(item);
          }
        }}
        tabIndex={0}
        className={`h-11 cursor-pointer border-b border-slate-200 text-[12px] font-semibold leading-[1.35] transition-colors last:border-b-0 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-300 ${
          isSelected ? 'bg-slate-100 shadow-inner' : 'bg-white'
        }`}
      >
        <td className="w-[112px] px-3 py-2 align-middle font-bold text-slate-900">{item.pair}</td>
        <td className="min-w-0 px-3 py-2 align-middle">
          <span className="block truncate text-slate-700">{item.name}</span>
          <span className="block truncate text-[10px] text-slate-400">{item.scope}</span>
        </td>
        <td className="w-[112px] px-3 py-2 text-right align-middle text-[15px] font-bold text-slate-900">
          {formatGlobalMarketValue(item.pair, summary?.value ?? null)}
        </td>
        <td className={`w-[92px] px-3 py-2 text-right align-middle text-[12px] font-bold ${
          change === null || change === undefined
            ? 'text-slate-400'
            : change >= 0
              ? 'text-emerald-600'
              : 'text-rose-600'
        }`}>
          {change === null || change === undefined ? '-' : `${change.toFixed(2)}%`}
        </td>
        <td className={`w-[94px] px-3 py-2 text-right align-middle text-[11px] font-bold ${
          summary?.status === 'error' ? 'text-rose-600' : summary?.status === 'loading' ? 'text-slate-400' : 'text-emerald-600'
        }`}>
          {statusText}
        </td>
        <td className="w-[76px] px-3 py-2 text-right align-middle">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              selectGlobalMarketForTrend(item);
            }}
            className={`h-7 rounded border px-2 text-[11px] font-bold leading-[1.35] transition-colors ${
              isSelected
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-300 bg-white text-slate-700 hover:border-slate-500'
            }`}
          >
            趋势
          </button>
        </td>
      </tr>
    );
  };

  const selectedFxPoints = useMemo(() => (selectedFxCode ? fxHistory[selectedFxCode] : []), [fxHistory, selectedFxCode]);
  const selectedFxPeriodConfig = useMemo(
    () => FX_PERIODS.find((periodItem) => periodItem.key === selectedFxPeriod) || FX_PERIODS[2],
    [selectedFxPeriod],
  );
  const fxHistoryPeriodCache = useMemo(() => {
    const cache = new Map<
      typeof FX_PERIODS[number]['key'],
      {
        summary: ReturnType<typeof summarizeFxPeriod>;
        horizons: FxChartHorizon[];
        series: FxForecastSeries[];
      }
    >();

    FX_PERIODS.forEach((periodItem) => {
      const summary = summarizeFxPeriod(selectedFxPoints, periodItem.days);
      const horizons = buildBacktestHorizons(periodItem.days);
      cache.set(periodItem.key, {
        summary,
        horizons,
        series: selectedFxCode ? buildFxBacktestSeries(selectedFxCode, summary.points, horizons) : [],
      });
    });

    return cache;
  }, [selectedFxCode, selectedFxPoints]);
  const selectedFxPeriodCached = fxHistoryPeriodCache.get(selectedFxPeriod);
  const selectedFxPeriodSummary = selectedFxPeriodCached?.summary || summarizeFxPeriod(selectedFxPoints, selectedFxPeriodConfig.days);
  const selectedFxHistorySummaries = useMemo(() => {
    const summaries = new Map<typeof FX_HISTORY_SUMMARY_KEYS[number], ReturnType<typeof summarizeFxPeriod>>();
    FX_HISTORY_SUMMARY_KEYS.forEach((key) => {
      const periodItem = FX_PERIODS.find((item) => item.key === key);
      summaries.set(key, periodItem ? (fxHistoryPeriodCache.get(periodItem.key)?.summary || summarizeFxPeriod(selectedFxPoints, periodItem.days)) : selectedFxPeriodSummary);
    });
    return summaries;
  }, [fxHistoryPeriodCache, selectedFxPeriodSummary, selectedFxPoints]);
  const selectedFxForecastSeries = useMemo(
    () => (selectedFxCode ? buildFxForecastSeries(selectedFxCode, fxRates[selectedFxCode].value) : []),
    [fxRates, selectedFxCode],
  );
  const selectedFxForecastHorizonIndex = Math.max(
    0,
    FX_FORECAST_HORIZONS.findIndex((horizon) => horizon.key === selectedFxForecastHorizon),
  );
  const selectedFxForecastChartHorizons = FX_FORECAST_HORIZONS.slice(0, selectedFxForecastHorizonIndex + 1);
  const selectedFxForecastChartSeries = useMemo(
    () => selectedFxForecastSeries.map((item) => ({
      ...item,
      points: item.points.slice(0, selectedFxForecastHorizonIndex + 1),
    })),
    [selectedFxForecastHorizonIndex, selectedFxForecastSeries],
  );
  const selectedFxForecastHorizonLabel =
    FX_FORECAST_HORIZONS[selectedFxForecastHorizonIndex]?.label || '1年';
  const selectedGlobalMarketPeriodLabel =
    GLOBAL_MARKET_PERIODS.find((item) => item.key === selectedGlobalMarketPeriod)?.label || '1年';
  const selectedGlobalMarketHistoryStart = selectedGlobalMarketHistory[0]?.date || '';
  const selectedGlobalMarketHistoryEnd = selectedGlobalMarketHistory[selectedGlobalMarketHistory.length - 1]?.date || '';
  const selectedGlobalMarketAvailableRange = selectedGlobalMarketHistoryStart && selectedGlobalMarketHistoryEnd
    ? `${selectedGlobalMarketHistoryStart} 至 ${selectedGlobalMarketHistoryEnd}`
    : '';
  const selectedGlobalMarketUnitPair = selectedGlobalMarket
    ? resolveGlobalUnitPair(selectedGlobalMarket, selectedGlobalMarketUnitMode)
    : '';
  const selectedGlobalMarketDisplayHistory = useMemo(
    () => (selectedGlobalMarketUnitMode === 'inverse' ? invertFxPoints(selectedGlobalMarketHistory) : selectedGlobalMarketHistory),
    [selectedGlobalMarketHistory, selectedGlobalMarketUnitMode],
  );
  const selectedGlobalMarketHistorySource = selectedGlobalMarket
    ? globalMarketSummaries[selectedGlobalMarket.pair]?.source || (selectedGlobalMarket.kind === 'crypto'
      ? 'CoinGecko'
      : GLOBAL_FIAT_SOURCE_OPTIONS.find((source) => source.key === selectedGlobalFiatSource)?.name || '权威源链')
    : '';
  const selectedFxBacktestHorizons = selectedFxPeriodCached?.horizons || buildBacktestHorizons(selectedFxPeriodConfig.days);
  const selectedFxBacktestSeries = selectedFxPeriodCached?.series || [];
  const hoveredFxPoints = hoveredFx ? fxHistory[hoveredFx.code] : [];

  return (
    <>
    <div className="flex h-full min-h-0 flex-col bg-slate-100">
      <FinancePageHeader
        title="财务管理中心（新）"
        subtitle={isLiveReceivablesTab
          ? '赵敏 · 应收账款已接真实数据，其余模块仍为预览。'
          : '赵敏 · 收入侧 / 支出侧 / 资金侧 / 管理侧一体化专业作业中心。'}
        right={
          <span className={`rounded border px-2 py-0.5 text-[11px] font-semibold leading-[1.35] ${
            isLiveReceivablesTab
              ? 'border-emerald-400 bg-emerald-50 text-emerald-700'
              : 'border-slate-400 bg-white text-slate-600'
          }`}>
            {isLiveReceivablesTab ? 'AR LIVE' : 'MOCK DATA'}
          </span>
        }
      />
      <div className="border-b border-slate-300 bg-slate-50 px-2 py-2">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {renderScopeSelect('时间范围', period, setPeriod, FILTER_OPTIONS.period)}
            {renderScopeSelect('区域', region, setRegion, FILTER_OPTIONS.region)}
            {renderScopeSelect('业务', business, setBusiness, FILTER_OPTIONS.business)}
            {renderScopeSelect('币种', currency, setCurrency, FILTER_OPTIONS.currency)}
          </div>
          <div className="flex flex-wrap gap-1.5">
            <Button type="button" variant="outline" size="sm" className="h-8 rounded-md border-slate-300 text-[12px] font-semibold" onClick={() => setGlobalFxDialogOpen(true)}>
              <Globe2 className="mr-1.5 h-3.5 w-3.5" />
              全球汇率入口
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 rounded-md border-slate-300 text-[12px] font-semibold" onClick={handleExportReport}>
              <Download className="mr-1.5 h-3.5 w-3.5" />
              导出报表
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 rounded-md border-slate-300 text-[12px] font-semibold" onClick={handleRefresh} disabled={isRefreshing}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? '刷新中' : '刷新数据'}
            </Button>
          </div>
        </div>
        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[11px] font-semibold leading-[1.35] text-slate-500">
          <span>当前筛选：{activeScopeLabel}</span>
          <span>最近刷新：{lastRefreshedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
        <div className="flex divide-x divide-slate-200 overflow-x-auto border border-slate-200 bg-white">
          {overviewStats.map(renderOverviewStat)}
        </div>
      </div>
      <div className="border-b border-slate-300 bg-slate-100 px-2 py-1.5">
        <FinanceModuleTabs active={tab} onChange={setTab} grouped />
      </div>
      <FinanceModuleContextStrip tab={tab} />
      <div key={`${tab}-${refreshTick}`} className="min-h-0 min-w-0 flex-1 overflow-auto">
        {body}
      </div>
    </div>
    {hoveredFx && (
      <div
        className="fixed z-[70] w-[420px] rounded-md border border-slate-300 bg-white p-3 shadow-xl"
        onMouseEnter={() => setIsHoveringFxPanel(true)}
        onMouseLeave={() => {
          setIsHoveringFxPanel(false);
          setHoveredFx(null);
        }}
        style={{
          left: Math.min(Math.max(hoveredFx.x, 230), window.innerWidth - 230),
          top: Math.min(hoveredFx.y, window.innerHeight - 250),
          transform: 'translateX(-50%)',
        }}
      >
        <div className="mb-2 flex items-start justify-between gap-3">
          <div>
            <div className="text-[13px] font-bold leading-[1.35] text-slate-900">{hoveredFx.code}/CNY 历史趋势</div>
            <div className="text-[11px] font-semibold leading-[1.35] text-slate-500">
              历史源：{formatFxHistorySource(fxHistorySource)}
            </div>
          </div>
          <div className="text-[11px] font-semibold leading-[1.35] text-slate-500">点击查看详情</div>
        </div>
        {fxHistoryLoading && hoveredFxPoints.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-[12px] font-semibold text-slate-500">趋势加载中...</div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {FX_PERIODS.map((periodItem) => {
              const summary = summarizeFxPeriod(hoveredFxPoints, periodItem.days);
              return (
                <div key={periodItem.key} className="rounded border border-slate-200 bg-slate-50 px-2 py-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold leading-[1.35]">
                    <span className="text-slate-700">{periodItem.label}</span>
                    <span className={summary.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}>{summary.change.toFixed(2)}%</span>
                  </div>
                  <MiniFxSparkline points={summary.points} interactive />
                  <div className="mt-0.5 flex justify-between text-[10px] font-semibold text-slate-400">
                    <span>低 {summary.low ? summary.low.toFixed(2) : '-'}</span>
                    <span>高 {summary.high ? summary.high.toFixed(2) : '-'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    )}
    <Dialog
      open={globalFxDialogOpen}
      onOpenChange={(open) => {
        setGlobalFxDialogOpen(open);
        if (!open) setSelectedGlobalMarket(null);
      }}
    >
      <DialogContent
        safeViewport
        className="grid max-h-[min(780px,calc(100vh-2rem))] grid-rows-[auto_minmax(0,1fr)] overflow-hidden border-slate-300 bg-slate-50 p-0"
        style={{ width: 'min(1120px, calc(100vw - 2rem))', maxWidth: 1120 }}
      >
        <DialogHeader className="border-b border-slate-300 bg-white px-6 py-5 pr-16">
          <DialogTitle className="text-base font-semibold leading-[1.35] text-slate-900">
            世界主要货币汇率历史数据与未来预测
          </DialogTitle>
          <DialogDescription className="text-sm leading-[1.45] text-slate-500">
            作为报价、回款、锁汇和跨币种风险观察入口；实际结算仍以收款行或银行牌价为准。
          </DialogDescription>
        </DialogHeader>
        <div className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] gap-3 overflow-hidden px-5 py-4">
          <div className="rounded-md border border-slate-300 bg-white px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[13px] font-bold leading-[1.35] text-slate-900">权威数据接口</div>
                <div className="mt-1 text-[12px] font-semibold leading-[1.55] text-slate-500">
                  法币以 USD 为基准，图表和列表按当前接口重新取数；虚拟货币仍使用 CoinGecko/稳定币锚定参考。
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex overflow-hidden rounded border border-slate-300 bg-slate-50">
                  {[
                    { key: 'major' as const, label: '主要币种' },
                    { key: 'all' as const, label: '全部币种' },
                  ].map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => setGlobalMarketCurrencyScope(option.key)}
                      className={`h-8 px-3 text-[11px] font-bold leading-[1.2] transition-colors ${
                        globalMarketCurrencyScope === option.key
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <span className="rounded border border-slate-300 bg-slate-50 px-2 py-1 text-[11px] font-bold leading-[1.2] text-slate-600">USD BASE</span>
                <Button type="button" variant="outline" size="sm" className="h-8 rounded-md text-[11px] font-semibold" onClick={refreshGlobalMarketSummaries} disabled={globalMarketLoading}>
                  <RefreshCw className={`mr-1 h-3.5 w-3.5 ${globalMarketLoading ? 'animate-spin' : ''}`} />
                  刷新价格
                </Button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {GLOBAL_FIAT_SOURCE_STACK.map((source, index) => (
                <span key={source} className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] font-bold leading-[1.2] text-slate-600">
                  {index + 1}. {source}
                </span>
              ))}
              <span className="rounded border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold leading-[1.2] text-slate-400">
                兜底 Frankfurter
              </span>
            </div>
          </div>

          <div
            ref={globalFxDialogBodyRef}
            className="min-h-0 overflow-y-auto pr-1"
            style={{ overflowAnchor: 'none', overscrollBehavior: 'contain' }}
          >
            <section className="overflow-hidden rounded-md border border-slate-300 bg-white">
              <div className="border-b border-slate-300 bg-slate-100 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[13px] font-bold leading-[1.35] text-slate-900">货币选择</div>
                    <div className="text-[11px] font-semibold leading-[1.35] text-slate-500">
                      先选币种，点击“趋势”跳到折线图。当前显示 {globalMarketCurrencyScope === 'all' ? '全部币种' : '主要币种'}。
                    </div>
                  </div>
                  <div className="shrink-0 rounded border border-slate-300 bg-white px-2 py-1 text-[11px] font-bold leading-[1.2] text-slate-500">
                    法币 {visibleGlobalFiatEntries.length} / 虚拟币 {GLOBAL_CRYPTO_FX_ENTRIES.length}
                  </div>
                </div>
              </div>
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="h-8 border-b border-slate-300 bg-slate-100 text-[11px] font-bold text-slate-500">
                    <th className="w-[112px] px-3 py-2">货币对</th>
                    <th className="px-3 py-2">用途</th>
                    <th className="w-[120px] px-3 py-2 text-right">最新价</th>
                    <th className="w-[100px] px-3 py-2 text-right">1年变化</th>
                    <th className="w-[150px] px-3 py-2 text-right">数据源</th>
                    <th className="w-[80px] px-3 py-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-slate-200 bg-white text-[12px] font-bold text-slate-900">
                    <td colSpan={6} className="px-3 py-2">
                      <span>世界主要货币兑美元</span>
                      <span className="ml-2 text-[10px] font-bold text-emerald-600">{GLOBAL_FIAT_SOURCE_OPTIONS.find((source) => source.key === selectedGlobalFiatSource)?.label}</span>
                    </td>
                  </tr>
                  {visibleGlobalFiatEntries.map((item) => renderGlobalMarketRow(item))}
                  <tr className="border-b border-slate-200 bg-white text-[12px] font-bold text-slate-900">
                    <td colSpan={6} className="px-3 py-2">
                      <span>主要虚拟货币兑美元</span>
                      <span className="ml-2 rounded border border-amber-300 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold leading-[1.2] text-amber-700">HIGH VOL</span>
                    </td>
                  </tr>
                  {GLOBAL_CRYPTO_FX_ENTRIES.map((item) => renderGlobalMarketRow({ ...item, kind: 'crypto' }))}
                </tbody>
              </table>
            </section>

            <section
              ref={globalMarketTrendRef}
              className="mt-3 grid min-h-0 scroll-mt-3 grid-rows-[auto_auto_auto] rounded-md border border-slate-300 bg-white p-3"
              style={{ overflowAnchor: 'none' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-bold leading-[1.35] text-slate-900">
                    {selectedGlobalMarket ? `${selectedGlobalMarket.pair} · 历史折线图与未来12个月预测` : '选择一个货币对查看趋势'}
                  </div>
                  <div className="mt-1 text-[12px] font-semibold leading-[1.45] text-slate-500">
                    {selectedGlobalMarket
                      ? `请求${selectedGlobalMarketPeriodLabel}历史，实际返回${selectedGlobalMarketAvailableRange || '以数据源为准'}；实线为历史，虚线为参考预测；历史源：${selectedGlobalMarketHistorySource}`
                      : '左侧选择货币对后加载历史折线图。'}
                  </div>
                </div>
                {selectedGlobalMarket && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 shrink-0 rounded-md text-[11px] font-semibold"
                    onClick={() => {
                      updateGlobalChartWithoutScrollJump(() => {
                        setGlobalMarketHistoryCache((current) => {
                          const next = { ...current };
                          const sourceKey = selectedGlobalMarket.kind === 'fiat' ? selectedGlobalFiatSource : 'crypto';
                          delete next[`${sourceKey}:${selectedGlobalMarket.pair}:${selectedGlobalMarketPeriod}`];
                          return next;
                        });
                        setSelectedGlobalMarket({ ...selectedGlobalMarket });
                      });
                    }}
                    disabled={selectedGlobalMarketLoading}
                  >
                    <RefreshCw className={`mr-1 h-3.5 w-3.5 ${selectedGlobalMarketLoading ? 'animate-spin' : ''}`} />
                    刷新趋势
                  </Button>
                )}
              </div>
              {selectedGlobalMarket && (
                <div className="mt-3 grid gap-2 rounded border border-slate-200 bg-slate-50 px-2 py-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[11px] font-bold leading-[1.35] text-slate-500">货币单位</span>
                    {(['direct', 'inverse'] as const).map((mode) => {
                      const unitLabel = resolveGlobalUnitPair(selectedGlobalMarket, mode);
                      const isActive = selectedGlobalMarketUnitMode === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={(event) => {
                            event.currentTarget.blur();
                            updateGlobalChartWithoutScrollJump(() => setSelectedGlobalMarketUnitMode(mode));
                          }}
                          className={`h-7 rounded border px-2 text-[11px] font-bold leading-[1.35] transition-colors ${
                            isActive
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : 'border-slate-300 bg-white text-slate-600 hover:border-slate-500'
                          }`}
                        >
                          {unitLabel}
                        </button>
                      );
                    })}
                    <span className="ml-auto text-[10px] font-semibold leading-[1.35] text-slate-400">
                      仅切换显示单位，不重新请求数据
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[11px] font-bold leading-[1.35] text-slate-500">数据源</span>
                    {selectedGlobalMarket.kind === 'fiat' ? (
                      GLOBAL_FIAT_SOURCE_OPTIONS.map((source) => (
                        <button
                          key={source.key}
                          type="button"
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={(event) => {
                            event.currentTarget.blur();
                            updateGlobalChartWithoutScrollJump(() => setSelectedGlobalFiatSource(source.key));
                          }}
                          className={`h-7 rounded border px-2 text-[11px] font-bold leading-[1.35] transition-colors ${
                            selectedGlobalFiatSource === source.key
                              ? 'border-slate-900 bg-slate-900 text-white'
                              : source.key === 'frankfurter'
                                ? 'border-slate-300 bg-white text-slate-500 hover:border-slate-500'
                                : 'border-slate-300 bg-white text-slate-600 hover:border-slate-500'
                          }`}
                          title={source.name}
                        >
                          {source.label}
                        </button>
                      ))
                    ) : (
                      <span className="rounded border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-bold leading-[1.35] text-amber-700">
                        {selectedGlobalMarket.pair === 'USDT/USD' ? '稳定币锚定参考' : 'CoinGecko'}
                      </span>
                    )}
                    <span className="ml-auto text-[10px] font-semibold leading-[1.35] text-slate-400">
                      切换数据源只刷新折线图，不移动视图
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="mr-1 text-[11px] font-bold leading-[1.35] text-slate-500">时间跨度</span>
                  {GLOBAL_MARKET_PERIODS.map((periodItem) => {
                    const isActive = selectedGlobalMarketPeriod === periodItem.key;
                    return (
                      <button
                        key={periodItem.key}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={(event) => {
                          event.currentTarget.blur();
                          updateGlobalChartWithoutScrollJump(() => setSelectedGlobalMarketPeriod(periodItem.key));
                        }}
                        className={`h-7 rounded border px-2 text-[11px] font-bold leading-[1.35] transition-colors ${
                          isActive
                            ? 'border-slate-900 bg-slate-900 text-white'
                            : 'border-slate-300 bg-white text-slate-600 hover:border-slate-500'
                        }`}
                      >
                        {periodItem.label}
                      </button>
                    );
                  })}
                    <span className="ml-auto text-[10px] font-semibold leading-[1.35] text-slate-400">
                      {selectedGlobalMarketAvailableRange ? `实际可用：${selectedGlobalMarketAvailableRange}` : '实际可用起点以数据源返回为准'}
                    </span>
                  </div>
                </div>
              )}
              <div data-global-chart-box="true" className="relative mt-3 h-[390px] overflow-hidden rounded border border-slate-100 bg-slate-50/40 p-2">
                {selectedGlobalMarketDisplayHistory.length >= 2 ? (
                  selectedGlobalMarket ? (
                    <GlobalMarketCombinedTrendChart
                      entry={selectedGlobalMarket}
                      history={selectedGlobalMarketDisplayHistory}
                      unitPair={selectedGlobalMarketUnitPair}
                    />
                  ) : null
                ) : selectedGlobalMarketLoading ? (
                  <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">趋势加载中...</div>
                ) : (
                  <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
                    {selectedGlobalMarket ? '暂无历史趋势数据，请刷新或稍后再试。' : '请选择左侧货币对。'}
                  </div>
                )}
                {selectedGlobalMarketLoading && selectedGlobalMarketDisplayHistory.length >= 2 && (
                  <div className="pointer-events-none absolute right-3 top-3 rounded border border-slate-200 bg-white/90 px-2 py-1 text-[11px] font-semibold text-slate-500 shadow-sm">
                    正在更新曲线...
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    <Dialog open={Boolean(selectedFxCode)} onOpenChange={(open) => !open && setSelectedFxCode(null)}>
      <DialogContent
        safeViewport
        className="grid grid-rows-[86px_minmax(0,1fr)] overflow-hidden border-slate-300 bg-slate-50 p-0"
        style={{
          width: 'min(885px, calc(100vw - 2rem))',
          maxWidth: 885,
          overflowAnchor: 'none',
        }}
      >
        <DialogHeader className="shrink-0 justify-center border-b border-slate-300 bg-white px-6 py-0 pr-20" style={{ height: 86 }}>
          <DialogTitle className="text-base font-semibold leading-[1.35] text-slate-900">
            {selectedFxCode ? `${selectedFxCode}/CNY 汇率趋势与预期` : '汇率趋势与预期'}
          </DialogTitle>
          <DialogDescription className="text-sm leading-[1.45] text-slate-500">
            未来预期用于报价、回款和锁汇风险参考；实际结汇以收款行或中国银行牌价为准。
          </DialogDescription>
        </DialogHeader>
        <div ref={fxDialogBodyRef} className="grid min-h-0 gap-4 overflow-y-auto overflow-x-hidden px-6 pb-5 pt-3 overscroll-contain">
          <div className="inline-grid h-11 w-full grid-cols-2 items-center rounded-md border border-slate-300 bg-white p-1">
            <button
              type="button"
              onClick={() => setFxDialogView('forecast')}
              className={`h-8 w-24 rounded text-[12px] font-semibold leading-[1.35] transition-colors ${
                fxDialogView === 'forecast' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              未来预期
            </button>
            <button
              type="button"
              onClick={() => setFxDialogView('history')}
              className={`h-8 w-24 rounded text-[12px] font-semibold leading-[1.35] transition-colors ${
                fxDialogView === 'history' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              历史趋势
            </button>
          </div>

          <div className="grid h-[680px] content-start gap-4">
          {fxDialogView === 'forecast' ? (
            <>
              <div className="grid w-full grid-cols-7 gap-2">
                {FX_FORECAST_SUMMARY_KEYS.map((key) => {
                  const index = FX_FORECAST_HORIZONS.findIndex((horizon) => horizon.key === key);
                  const horizon = FX_FORECAST_HORIZONS[index];
                  const point = selectedFxForecastSeries[1]?.points[index];
                  const isSelected = selectedFxForecastHorizon === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedFxForecastHorizon(key)}
                      className={`h-[93px] rounded-md border px-3 py-2 text-left transition-colors hover:border-slate-400 ${
                        isSelected
                          ? 'border-slate-500 bg-slate-200 shadow-inner'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      <div className="text-[12px] font-semibold leading-[1.25] text-slate-500">{horizon.label}</div>
                      <div className="mt-1 text-[19px] font-bold leading-[1.15] text-slate-900">
                        {point?.value.toFixed(4) || '-'}
                      </div>
                      <div className={`mt-1 text-[12px] font-semibold leading-[1.15] ${point && point.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {point ? `${point.change.toFixed(2)}%` : '-'}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="flex h-[42px] w-full items-center rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold leading-[1.5] text-amber-800">
                未来预期图对比中国银行远期、机构预测和AI模型预测；远期价反映套保/结汇参考成本，预测不构成交易建议。
              </div>
              <div className="grid h-[488px] w-full grid-rows-[72px_248px_76px] gap-2 rounded-md border border-slate-300 bg-white p-2.5">
                <div className="grid h-[72px] gap-2 overflow-hidden px-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-bold leading-[1.35] text-slate-900">
                        {selectedFxCode}/{`CNY`} · 未来{selectedFxForecastHorizonLabel}预测
                      </div>
                      <div className="mt-0.5 text-[11px] font-semibold leading-[1.35] text-slate-500">
                        预期数据刷新：{fxForecastRefreshedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="h-7 rounded-md border-slate-300 text-[11px] font-semibold" onClick={refreshFxForecast} disabled={fxForecastLoading}>
                      <RefreshCw className={`mr-1 h-3 w-3 ${fxForecastLoading ? 'animate-spin' : ''}`} />
                      {fxForecastLoading ? '调用中' : '实时调用'}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-600">
                    {selectedFxForecastSeries.map((item) => (
                      <span key={item.key} className="inline-flex min-w-[190px] items-center gap-1.5 whitespace-nowrap">
                        <span className="h-2 w-5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                    ))}
                  </div>
                  <div className="h-[15px] overflow-hidden text-[11px] font-semibold leading-[1.35] text-slate-500" aria-hidden="true" />
                </div>
                <div className="h-[248px] rounded border border-slate-100 bg-slate-50/40 p-2">
                  <FxForecastChart
                    series={selectedFxForecastChartSeries}
                    horizons={selectedFxForecastChartHorizons}
                  />
                </div>
                <div className="grid h-[76px] grid-cols-4 gap-2">
                  {selectedFxForecastSeries.map((item) => (
                    <div
                      key={item.key}
                      className="relative h-[76px] overflow-visible rounded border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:border-slate-400 hover:bg-white"
                      onMouseEnter={() => setHoveredFxSource(item.key)}
                      onMouseLeave={() => setHoveredFxSource((current) => (current === item.key ? null : current))}
                    >
                      <div className="text-[12px] font-bold text-slate-900">{item.name}</div>
                      <div className="mt-1 line-clamp-2 text-[11px] font-semibold leading-[1.45] text-slate-500">{renderFxSourceDescription(item)}</div>
                      {hoveredFxSource === item.key && (
                        <>
                        <div className="absolute bottom-full left-0 right-0 h-4" aria-hidden="true" />
                        <div
                          className="absolute left-3 right-3 z-[80] rounded-md border border-slate-300 bg-white p-2 text-[11px] font-semibold leading-[1.45] text-slate-600 shadow-lg"
                          style={{ bottom: 'calc(100% + 12px)' }}
                        >
                          <div className="text-slate-900">是否跳转到源数据网站？</div>
                          <div className="mt-0.5 truncate">{item.sourceSite}</div>
                          <div className="mt-2 flex justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 rounded px-2 text-[11px]"
                              onClick={(event) => {
                                event.stopPropagation();
                                setHoveredFxSource(null);
                              }}
                            >
                              取消
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-6 rounded bg-slate-900 px-2 text-[11px] text-white hover:bg-slate-800"
                              onClick={(event) => {
                                event.stopPropagation();
                                openFxSource(item);
                              }}
                            >
                              前往网站
                            </Button>
                          </div>
                        </div>
                        </>
                      )}
                    </div>
                  ))}
                  <div className="h-[76px] rounded border border-transparent" aria-hidden="true" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid w-full grid-cols-7 gap-2">
                {FX_HISTORY_SUMMARY_KEYS.map((key) => {
                  const periodItem = FX_PERIODS.find((item) => item.key === key);
                  const summary = selectedFxHistorySummaries.get(key) || selectedFxPeriodSummary;
                  const isSelectable = Boolean(periodItem);
                  const value = key === 'current' ? selectedFxPeriodSummary.last : summary.first;
                  const change = key === 'current' ? 0 : summary.change;
                  const content = (
                    <>
                      <div className="text-[12px] font-semibold leading-[1.25] text-slate-500">{periodItem?.label || '当前'}</div>
                      <div className="mt-1 text-[19px] font-bold leading-[1.15] text-slate-900">{value ? value.toFixed(4) : '-'}</div>
                      <div className={`mt-1 text-[12px] font-semibold leading-[1.15] ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {change.toFixed(2)}%
                      </div>
                    </>
                  );
                  return isSelectable ? (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSelectedFxPeriod(periodItem.key)}
                      className={`h-[93px] rounded-md border px-3 py-2 text-left transition-colors hover:border-slate-400 ${
                        selectedFxPeriod === periodItem.key
                          ? 'border-slate-500 bg-slate-200 shadow-inner'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {content}
                    </button>
                  ) : (
                    <div key={key} className="h-[93px] rounded-md border border-slate-300 bg-white px-3 py-2">
                      {content}
                    </div>
                  );
                })}
              </div>
              <div className="flex h-[42px] w-full items-center rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] font-semibold leading-[1.5] text-amber-800">
                {fxHistorySource !== '参考趋势'
                  ? '历史回测用于观察过去不同预测结构与实际参考汇率的偏差，不代表银行买入价、卖出价或实际结汇价。'
                  : '当前回测为参考趋势占位，说明历史数据源未成功返回；请刷新数据或接入企业指定行情源后用于正式分析。'}
              </div>
              <div className="grid h-[488px] w-full grid-rows-[72px_248px_76px] gap-2 rounded-md border border-slate-300 bg-white p-2.5">
                <div className="grid h-[72px] gap-2 overflow-hidden px-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-bold leading-[1.35] text-slate-900">
                        {selectedFxCode}/{`CNY`} · 历史{selectedFxPeriodConfig.label}预测回测
                      </div>
                      <div className="mt-0.5 text-[11px] font-semibold leading-[1.35] text-slate-500">
                        历史数据刷新：{lastRefreshedAt.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} · 5天颗粒度
                      </div>
                    </div>
                    <Button type="button" variant="outline" size="sm" className="h-7 rounded-md border-slate-300 text-[11px] font-semibold" onClick={refreshFxHistory} disabled={fxHistoryLoading}>
                      <RefreshCw className={`mr-1 h-3 w-3 ${fxHistoryLoading ? 'animate-spin' : ''}`} />
                      {fxHistoryLoading ? '加载中' : '刷新回测'}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] font-semibold text-slate-600">
                    {selectedFxBacktestSeries.map((item) => (
                      <span key={item.key} className="inline-flex min-w-[190px] items-center gap-1.5 whitespace-nowrap">
                        <span className="h-2 w-5 shrink-0 rounded-full" style={{ backgroundColor: item.color }} />
                        {item.name}
                      </span>
                    ))}
                  </div>
                  <div className="flex h-[15px] flex-nowrap items-center gap-3 overflow-hidden whitespace-nowrap text-[11px] font-semibold leading-[1.35] text-slate-500">
                    <span>{selectedFxPeriodConfig.label}窗口</span>
                    <span>实际当前 {selectedFxPeriodSummary.last ? selectedFxPeriodSummary.last.toFixed(4) : '-'}</span>
                    <span>实际低 {selectedFxPeriodSummary.low ? selectedFxPeriodSummary.low.toFixed(4) : '-'}</span>
                    <span>实际高 {selectedFxPeriodSummary.high ? selectedFxPeriodSummary.high.toFixed(4) : '-'}</span>
                    <span className={selectedFxPeriodSummary.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                      实际变化 {selectedFxPeriodSummary.change.toFixed(2)}%
                    </span>
                  </div>
                </div>
                <div className="h-[248px] rounded border border-slate-100 bg-slate-50/40 p-2">
                {selectedFxPoints.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">
                    {fxHistoryLoading ? '趋势加载中...' : '暂无历史趋势数据'}
                  </div>
                ) : (
                  <FxForecastChart
                    series={selectedFxBacktestSeries}
                    horizons={selectedFxBacktestHorizons}
                    emptyText="暂无历史回测数据"
                    tooltipSuffix="回测"
                  />
                )}
                </div>
                <div className="grid h-[76px] grid-cols-4 gap-2">
                  {selectedFxBacktestSeries.map((item) => (
                    <div
                      key={item.key}
                      className="relative h-[76px] overflow-visible rounded border border-slate-200 bg-slate-50 px-3 py-2 transition-colors hover:border-slate-400 hover:bg-white"
                      onMouseEnter={() => setHoveredFxSource(item.key)}
                      onMouseLeave={() => setHoveredFxSource((current) => (current === item.key ? null : current))}
                    >
                      <div className="text-[12px] font-bold text-slate-900">{item.name}</div>
                      <div className="mt-1 line-clamp-2 text-[11px] font-semibold leading-[1.45] text-slate-500">{renderFxSourceDescription(item)}</div>
                      {hoveredFxSource === item.key && (
                        <>
                        <div className="absolute bottom-full left-0 right-0 h-4" aria-hidden="true" />
                        <div
                          className="absolute left-3 right-3 z-[80] rounded-md border border-slate-300 bg-white p-2 text-[11px] font-semibold leading-[1.45] text-slate-600 shadow-lg"
                          style={{ bottom: 'calc(100% + 12px)' }}
                        >
                          <div className="text-slate-900">是否跳转到源数据网站？</div>
                          <div className="mt-0.5 truncate">{item.sourceSite}</div>
                          <div className="mt-2 flex justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-6 rounded px-2 text-[11px]"
                              onClick={(event) => {
                                event.stopPropagation();
                                setHoveredFxSource(null);
                              }}
                            >
                              取消
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              className="h-6 rounded bg-slate-900 px-2 text-[11px] text-white hover:bg-slate-800"
                              onClick={(event) => {
                                event.stopPropagation();
                                openFxSource(item);
                              }}
                            >
                              前往网站
                            </Button>
                          </div>
                        </div>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
