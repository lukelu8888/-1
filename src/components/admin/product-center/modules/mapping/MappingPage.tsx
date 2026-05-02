import { useMemo, useState } from 'react';
import { Plus, Search, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../../ui/button';
import { Input } from '../../../../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../../ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../ui/table';

import { PageHeading, Toolbar } from '../../shared/Toolbar';
import { useProductCenter } from '../../context/ProductCenterContext';
import type { ModelMapping } from '../../context/types';

export function MappingPage() {
  const ctx = useProductCenter();
  const [keyword, setKeyword] = useState('');
  const [productFilter, setProductFilter] = useState<string>('ALL');

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return ctx.modelMappings.filter((m) => {
      if (productFilter !== 'ALL' && m.productId !== productFilter) return false;
      if (!kw) return true;
      return [
        m.internalSku,
        m.supplierSku,
        m.customerModelNo,
        m.factoryModelNo,
        m.alternateModelNo,
        m.legacyModelNo,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(kw));
    });
  }, [ctx.modelMappings, keyword, productFilter]);

  const onAdd = () => {
    const newMap: ModelMapping = {
      id: `mm_${Date.now().toString(36)}`,
      tenantId: 'tenant_default',
      productId: ctx.products[0]?.id ?? '',
      internalSku: ctx.products[0]?.sku ?? '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    ctx.upsertMapping(newMap);
    toast.success('已新增空白映射，请编辑');
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeading
        title="型号映射 / Model Mapping"
        subtitle="客户型号 ↔ 我方 SKU ↔ 供应商型号 ↔ 工厂型号 ↔ 替代型号"
        actions={
          <Button size="sm" className="h-8" onClick={onAdd}>
            <Plus className="mr-1 h-3.5 w-3.5" /> 新建映射
          </Button>
        }
      />

      <Toolbar
        bordered
        left={
          <>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="搜索任意型号"
                className="h-8 w-64 pl-7 text-[12px]"
              />
            </div>
            <Select value={productFilter} onValueChange={setProductFilter}>
              <SelectTrigger className="h-8 w-56 text-[12px]">
                <SelectValue placeholder="按产品过滤" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">全部产品</SelectItem>
                {ctx.products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.sku} — {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <div className="flex-1 overflow-auto">
        <Table className="text-[12px]">
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead className="w-44">主产品</TableHead>
              <TableHead>我方 SKU</TableHead>
              <TableHead>供应商 SKU</TableHead>
              <TableHead>客户型号</TableHead>
              <TableHead>工厂型号</TableHead>
              <TableHead>替代型号</TableHead>
              <TableHead>包装变体</TableHead>
              <TableHead>历史型号</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="py-12 text-center text-slate-400">
                  未找到映射记录
                </TableCell>
              </TableRow>
            )}
            {filtered.map((m) => {
              const p = ctx.products.find((x) => x.id === m.productId);
              return (
                <TableRow key={m.id}>
                  <TableCell>
                    <div className="font-medium text-slate-800">{p?.name ?? '—'}</div>
                    <div className="font-mono text-[11px] text-slate-500">{p?.sku}</div>
                  </TableCell>
                  <Cell value={m.internalSku} onChange={(v) => ctx.upsertMapping({ ...m, internalSku: v })} />
                  <Cell value={m.supplierSku ?? ''} onChange={(v) => ctx.upsertMapping({ ...m, supplierSku: v })} />
                  <Cell value={m.customerModelNo ?? ''} onChange={(v) => ctx.upsertMapping({ ...m, customerModelNo: v })} />
                  <Cell value={m.factoryModelNo ?? ''} onChange={(v) => ctx.upsertMapping({ ...m, factoryModelNo: v })} />
                  <Cell value={m.alternateModelNo ?? ''} onChange={(v) => ctx.upsertMapping({ ...m, alternateModelNo: v })} />
                  <Cell value={m.packagingVariant ?? ''} onChange={(v) => ctx.upsertMapping({ ...m, packagingVariant: v })} />
                  <Cell value={m.legacyModelNo ?? ''} onChange={(v) => ctx.upsertMapping({ ...m, legacyModelNo: v })} />
                  <TableCell>
                    <div className="flex justify-end">
                      <button
                        onClick={() => {
                          ctx.removeMapping(m.id);
                          toast.success('已删除');
                        }}
                        className="rounded p-1 text-rose-600 hover:bg-rose-50"
                        title="删除"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function Cell({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <TableCell className="font-mono">
      <Input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onChange(draft);
        }}
        className="h-7 text-[12px] font-mono"
      />
    </TableCell>
  );
}
