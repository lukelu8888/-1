import { useMemo, useState } from 'react';
import { Calculator } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../ui/table';

import { RegionPill } from './RegionPill';
import { useProductCenter } from '../context/ProductCenterContext';
import { REGIONS, formatRegionMoney } from '../context/regionConfig';
import type { RegionCode } from '../context/types';

type Field = 'basePrice' | 'salePrice' | 'campaignPrice';
type Mode = 'absolute' | 'percent';

const FIELD_LABEL: Record<Field, string> = {
  basePrice: '建议价 Base',
  salePrice: '售价 Sale',
  campaignPrice: '活动价 Campaign',
};

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productIds: string[];
}

export function BulkPriceEditorDialog({ open, onOpenChange, productIds }: Props) {
  const ctx = useProductCenter();
  const [region, setRegion] = useState<RegionCode>('NA');
  const [field, setField] = useState<Field>('salePrice');
  const [mode, setMode] = useState<Mode>('percent');
  const [value, setValue] = useState<number>(-10);
  const [reason, setReason] = useState('');

  const preview = useMemo(() => {
    return productIds.map((id) => {
      const p = ctx.products.find((x) => x.id === id);
      const rp = ctx.regionPrices.find(
        (r) => r.productId === id && r.regionCode === region,
      );
      const before = rp ? (rp[field] ?? rp.basePrice) : null;
      const after =
        mode === 'absolute'
          ? value
          : before == null
            ? null
            : Math.max(0, Math.round(before * (1 + value / 100) * 100) / 100);
      return { id, sku: p?.sku ?? id, name: p?.name ?? '—', before, after };
    });
  }, [productIds, ctx.products, ctx.regionPrices, region, field, mode, value]);

  const totalEffective = preview.filter(
    (r) => r.after != null && r.after !== r.before,
  ).length;

  const onApply = () => {
    if (productIds.length === 0) {
      toast.warning('未选择产品');
      return;
    }
    if (mode === 'percent' && value === 0) {
      toast.warning('百分比为 0 — 没有变化');
      return;
    }
    const touched = ctx.bulkUpdatePrices({
      productIds,
      region,
      field,
      mode,
      value,
      reason: reason || undefined,
    });
    toast.success(`已对 ${touched} 条价格记录应用变更`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-[14px]">批量改价</DialogTitle>
          <DialogDescription className="text-[12px]">
            对 {productIds.length} 个所选产品的 {region} 区域价格做统一调整。 操作会写入审计日志，可在产品详情「12. 操作日志」追溯。
          </DialogDescription>
        </DialogHeader>

        {/* Form */}
        <div className="grid grid-cols-4 gap-3 border-b border-slate-200 pb-3">
          <Field label="区域">
            <Select value={region} onValueChange={(v) => setRegion(v as RegionCode)}>
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r.code} value={r.code}>
                    {r.flag} {r.code} {r.name} ({r.currency})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="价格字段">
            <Select value={field} onValueChange={(v) => setField(v as Field)}>
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(FIELD_LABEL) as Field[]).map((f) => (
                  <SelectItem key={f} value={f}>
                    {FIELD_LABEL[f]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="模式">
            <Select value={mode} onValueChange={(v) => setMode(v as Mode)}>
              <SelectTrigger className="h-8 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="percent">百分比 (+/-)</SelectItem>
                <SelectItem value="absolute">绝对值</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label={mode === 'percent' ? '幅度 %' : '新价格'}>
            <Input
              type="number"
              value={value}
              onChange={(e) => setValue(Number(e.target.value) || 0)}
              className="h-8 text-right font-mono text-[12px]"
            />
          </Field>

          <Field label="备注（写入审计）" className="col-span-4">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. NA 夏季促销 -10%"
              className="h-8 text-[12px]"
            />
          </Field>
        </div>

        {/* Preview */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[12px] text-slate-600">
            <Calculator className="h-3.5 w-3.5 text-slate-500" />
            预览：将影响 <strong className="text-slate-800">{totalEffective}</strong> 条记录 ·
            <RegionPill region={region} className="ml-1" />
          </div>

          <div className="max-h-[40vh] overflow-auto rounded border border-slate-200">
            <Table className="text-[12px]">
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-44">SKU / 名称</TableHead>
                  <TableHead className="text-right">变更前 ({FIELD_LABEL[field]})</TableHead>
                  <TableHead className="text-right">变更后</TableHead>
                  <TableHead className="text-right">差异</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((r) => {
                  const delta =
                    r.before != null && r.after != null ? r.after - r.before : null;
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <div className="font-medium">{r.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{r.sku}</div>
                      </TableCell>
                      <TableCell className="text-right font-mono text-slate-500">
                        {r.before == null ? '—' : formatRegionMoney(region, r.before)}
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {r.after == null ? '— (不存在区域价时无法按%调整)' : formatRegionMoney(region, r.after)}
                      </TableCell>
                      <TableCell
                        className={`text-right font-mono ${
                          delta == null
                            ? 'text-slate-400'
                            : delta > 0
                              ? 'text-emerald-700'
                              : delta < 0
                                ? 'text-rose-600'
                                : 'text-slate-400'
                        }`}
                      >
                        {delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta.toFixed(2)}`}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" className="h-8" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button size="sm" className="h-8" onClick={onApply}>
            应用
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="mb-1 text-[11px] font-medium text-slate-600">{label}</div>
      {children}
    </div>
  );
}
