import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../ui/button';
import { Checkbox } from '../../../ui/checkbox';
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

import { useProductCenter } from '../context/ProductCenterContext';
import { formatRegionMoney } from '../context/regionConfig';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  /** Pre-selected products that are already in the campaign */
  excludeIds: string[];
  defaultDiscount?: number;
}

/**
 * Reuses the PIM data store to pick products into a campaign in bulk.
 * Mirrors the PIM list mental model (search, filter by category, multi-select)
 * but in a contained dialog so we don't lose context.
 */
export function CampaignProductPickerDialog({
  open,
  onOpenChange,
  campaignId,
  excludeIds,
  defaultDiscount = 10,
}: Props) {
  const ctx = useProductCenter();
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState<string>('ALL');
  const [discount, setDiscount] = useState(defaultDiscount);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const candidates = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const exclude = new Set(excludeIds);
    return ctx.products.filter((p) => {
      if (exclude.has(p.id)) return false;
      if (p.status === 'archived') return false;
      if (categoryId !== 'ALL' && p.primaryCategoryId !== categoryId) return false;
      if (!kw) return true;
      return [p.sku, p.name, p.nameEn, p.brand]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw));
    });
  }, [ctx.products, excludeIds, keyword, categoryId]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const onConfirm = () => {
    if (selected.size === 0) {
      toast.warning('请至少选择一个产品');
      return;
    }
    ctx.addProductsToCampaign(campaignId, Array.from(selected), {
      discountPercent: discount,
    });
    toast.success(`已加入 ${selected.size} 个产品 · 默认折扣 ${discount}%`);
    setSelected(new Set());
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-[14px]">添加产品到活动</DialogTitle>
          <DialogDescription className="text-[12px]">
            从产品库挑选产品。活动价默认 = 北美售价 × (1 − 折扣%)，可在添加后逐个微调。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="SKU / 名称 / 品牌"
                className="h-8 w-56 pl-7 text-[12px]"
              />
            </div>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="h-8 w-44 text-[12px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部分类</SelectItem>
                {ctx.categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {'— '.repeat(c.level - 1)}
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-1.5 text-[12px]">
              <span className="text-slate-600">默认折扣</span>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value) || 0)}
                className="h-8 w-16 text-right font-mono"
              />
              <span className="text-slate-600">%</span>
            </div>
          </div>

          <div className="max-h-[60vh] overflow-auto rounded border border-slate-200">
            <Table className="text-[12px]">
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="w-9">
                    <Checkbox
                      checked={
                        candidates.length > 0 &&
                        candidates.every((p) => selected.has(p.id))
                      }
                      onCheckedChange={(v) => {
                        if (v) setSelected(new Set(candidates.map((p) => p.id)));
                        else setSelected(new Set());
                      }}
                    />
                  </TableHead>
                  <TableHead className="w-12">图</TableHead>
                  <TableHead>SKU / 名称</TableHead>
                  <TableHead>分类</TableHead>
                  <TableHead className="text-right">NA售价</TableHead>
                  <TableHead className="text-right">活动价 (折后)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-8 text-center text-slate-400">
                      没有匹配的产品
                    </TableCell>
                  </TableRow>
                )}
                {candidates.map((p) => {
                  const ref = ctx.regionPrices.find(
                    (rp) => rp.productId === p.id && rp.regionCode === 'NA',
                  );
                  const baseline = ref?.salePrice ?? ref?.basePrice ?? 0;
                  const after = Math.max(
                    0,
                    Math.round(baseline * (1 - discount / 100) * 100) / 100,
                  );
                  const cat = ctx.categories.find((c) => c.id === p.primaryCategoryId);
                  return (
                    <TableRow key={p.id} className={selected.has(p.id) ? 'bg-amber-50/40' : ''}>
                      <TableCell>
                        <Checkbox
                          checked={selected.has(p.id)}
                          onCheckedChange={() => toggle(p.id)}
                        />
                      </TableCell>
                      <TableCell>
                        {p.thumbnailUrl ? (
                          <img
                            src={p.thumbnailUrl}
                            alt={p.sku}
                            className="h-8 w-8 rounded border object-cover"
                          />
                        ) : (
                          <div className="h-8 w-8 rounded border border-dashed bg-slate-50" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-800">{p.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">{p.sku}</div>
                      </TableCell>
                      <TableCell className="text-slate-600">{cat?.name ?? '—'}</TableCell>
                      <TableCell className="text-right font-mono">
                        {baseline > 0 ? formatRegionMoney('NA', baseline) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-orange-700">
                        {after > 0 ? formatRegionMoney('NA', after) : '—'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <div className="mr-auto text-[12px] text-slate-600">已选 {selected.size} / 候选 {candidates.length}</div>
          <Button variant="outline" size="sm" className="h-8" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button size="sm" className="h-8" onClick={onConfirm}>
            加入活动
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
