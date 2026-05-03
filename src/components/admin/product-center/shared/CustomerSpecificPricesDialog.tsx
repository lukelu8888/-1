/**
 * Phase 5c — 客户专属价管理对话框
 *
 * 在 PIM 详情「区域价格」区，"管理专属价"按钮打开此 dialog。
 * 列出当前产品所有的客户专属价（按客户分组），inline 增删改。
 *
 * 设计取舍：
 *   • 客户专属价是「最高优先级 / 最不规则」的一层 — 数量少（每个产品
 *     通常只对几个 anchor customer 有特价）但规则杂（每条都可能有不同
 *     的时间窗、Incoterm、Currency）。所以用 dialog + 表格而不是嵌入
 *     主页面 — 视觉噪声低，集中处理。
 *   • 删除走 confirm()：专属价丢失会直接影响合同价，谨慎一点。
 *   • 不在这里改"客户等级折扣"或"客户主数据"——那是另一个模块的责任，
 *     我们只在这里管价格。
 */

import { useMemo, useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { Input } from '../../../ui/input';
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
import { Switch } from '../../../ui/switch';
import { Badge } from '../../../ui/badge';
import { cn } from '../../../ui/utils';

import { useProductCenter } from '../context/ProductCenterContext';
import { REGIONS, getRegion } from '../context/regionConfig';
import type {
  CustomerSpecificPrice,
  RegionCode,
  TierIncoterm,
} from '../context/types';

const INCOTERM_OPTIONS: TierIncoterm[] = ['EXW', 'FOB', 'CIF', 'DAP', 'DDP'];

interface Props {
  productId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CustomerSpecificPricesDialog({ productId, open, onOpenChange }: Props) {
  const ctx = useProductCenter();
  const product = ctx.getProductById(productId);
  const customers = ctx.listCustomers();
  const allRows = ctx.getCustomerSpecificPricesForProduct(productId);

  const customerLabel = (id: string) => {
    const c = ctx.getCustomerById(id);
    if (!c) return id;
    const t = ctx.getCustomerTierById(c.tierId);
    return `${c.shortName ?? c.name}${t ? ` · ${t.name}` : ''}`;
  };

  const handleAdd = () => {
    if (customers.length === 0) {
      toast.error('请先在「客户主数据」模块创建客户');
      return;
    }
    const c = customers[0];
    const region: RegionCode = (c.regionCode ?? 'NA') as RegionCode;
    const draft: CustomerSpecificPrice = {
      id: `csp_${productId}_${c.id}_${Date.now()}`,
      customerId: c.id,
      productId,
      regionCode: region,
      minQty: product?.moq ?? 1,
      maxQty: null,
      unitPrice: 0,
      currency: getRegion(region).currency,
      incoterm: c.defaultIncoterm,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    ctx.upsertCustomerSpecificPrice(draft);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[14px]">
            客户专属价 · {product?.sku} {product?.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 text-[12px]">
          <div className="rounded border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
            客户专属价 = <strong>最高优先级</strong>。命中后完全跳过公共阶梯与客户等级折扣，
            一般用于年度框架协议、anchor customer 锁价、长期合同。每条记录的
            <strong> 起订量 / 上限 / 时间窗 / Incoterm / 币种</strong> 各自独立。
          </div>

          <Table className="text-[12px]">
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="w-[180px]">客户</TableHead>
                <TableHead className="w-[80px]">区域</TableHead>
                <TableHead className="w-[100px]">起订量</TableHead>
                <TableHead className="w-[100px]">上限</TableHead>
                <TableHead className="w-[120px] text-right">单价</TableHead>
                <TableHead className="w-[80px]">币种</TableHead>
                <TableHead className="w-[100px]">Incoterm</TableHead>
                <TableHead className="w-[110px]">生效</TableHead>
                <TableHead className="w-[110px]">失效</TableHead>
                <TableHead className="w-[70px]">启用</TableHead>
                <TableHead className="w-[60px]">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allRows.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={11}
                    className="py-6 text-center italic text-slate-400"
                  >
                    暂无客户专属价 — 公共阶梯/客户等级折扣自动生效
                  </TableCell>
                </TableRow>
              )}
              {allRows.map((row) => (
                <SpecificPriceRow
                  key={row.id}
                  row={row}
                  customerLabel={customerLabel(row.customerId)}
                  customers={customers.map((c) => ({
                    id: c.id,
                    label: `${c.shortName ?? c.name} (${c.code})`,
                  }))}
                  onChange={(patch) =>
                    ctx.upsertCustomerSpecificPrice({ ...row, ...patch })
                  }
                  onRemove={() => {
                    if (window.confirm(`删除 ${customerLabel(row.customerId)} 的这条专属价？`)) {
                      ctx.removeCustomerSpecificPrice(row.id);
                      toast.success('客户专属价已删除');
                    }
                  }}
                />
              ))}
            </TableBody>
          </Table>

          <div className="flex items-center justify-between">
            <div className="text-[11px] text-slate-500">
              共 <span className="font-mono text-slate-700">{allRows.length}</span> 条
              · 跨 <span className="font-mono text-slate-700">{new Set(allRows.map((r) => r.customerId)).size}</span> 个客户
            </div>
            <Button size="sm" variant="outline" className="h-7 text-[12px]" onClick={handleAdd}>
              <Plus className="mr-1 h-3 w-3" /> 新增客户专属价
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SpecificPriceRow({
  row,
  customerLabel,
  customers,
  onChange,
  onRemove,
}: {
  row: CustomerSpecificPrice;
  customerLabel: string;
  customers: { id: string; label: string }[];
  onChange: (patch: Partial<CustomerSpecificPrice>) => void;
  onRemove: () => void;
}) {
  return (
    <TableRow>
      <TableCell>
        <Select value={row.customerId} onValueChange={(v) => onChange({ customerId: v })}>
          <SelectTrigger className="h-7 text-[12px]">
            <SelectValue placeholder={customerLabel} />
          </SelectTrigger>
          <SelectContent>
            {customers.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={row.regionCode}
          onValueChange={(v) => onChange({ regionCode: v as RegionCode })}
        >
          <SelectTrigger className="h-7 text-[12px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => (
              <SelectItem key={r.code} value={r.code}>
                {r.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={1}
          value={row.minQty}
          onChange={(e) => onChange({ minQty: Number(e.target.value) || 1 })}
          className="h-7 w-20 text-[12px] font-mono"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          min={row.minQty + 1}
          value={row.maxQty ?? ''}
          placeholder="不限"
          onChange={(e) => {
            const v = e.target.value.trim();
            onChange({ maxQty: v === '' ? null : Number(v) });
          }}
          className="h-7 w-20 text-[12px] font-mono"
        />
      </TableCell>
      <TableCell className="text-right">
        <Input
          type="number"
          min={0}
          step="0.01"
          value={row.unitPrice}
          onChange={(e) => onChange({ unitPrice: Number(e.target.value) || 0 })}
          className="h-7 w-24 text-right text-[12px] font-mono"
        />
      </TableCell>
      <TableCell>
        <Input
          value={row.currency}
          onChange={(e) => onChange({ currency: e.target.value.toUpperCase() })}
          className="h-7 w-16 text-[12px] font-mono"
          maxLength={3}
        />
      </TableCell>
      <TableCell>
        <Select
          value={row.incoterm ?? 'NONE'}
          onValueChange={(v) =>
            onChange({ incoterm: v === 'NONE' ? undefined : (v as TierIncoterm) })
          }
        >
          <SelectTrigger className="h-7 text-[12px]">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NONE">—</SelectItem>
            {INCOTERM_OPTIONS.map((i) => (
              <SelectItem key={i} value={i}>
                {i}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          type="date"
          value={row.effectiveFrom?.slice(0, 10) ?? ''}
          onChange={(e) =>
            onChange({ effectiveFrom: e.target.value === '' ? null : e.target.value })
          }
          className="h-7 w-[100px] text-[11px] font-mono"
        />
      </TableCell>
      <TableCell>
        <Input
          type="date"
          value={row.effectiveTo?.slice(0, 10) ?? ''}
          onChange={(e) =>
            onChange({ effectiveTo: e.target.value === '' ? null : e.target.value })
          }
          className="h-7 w-[100px] text-[11px] font-mono"
        />
      </TableCell>
      <TableCell>
        <Switch
          checked={row.isActive}
          onCheckedChange={(v) => onChange({ isActive: v })}
        />
      </TableCell>
      <TableCell>
        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-slate-500 hover:text-rose-600"
          onClick={onRemove}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
