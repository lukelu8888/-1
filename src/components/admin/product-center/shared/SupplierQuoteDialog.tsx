import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../ui/dialog';
import { Button } from '../../../ui/button';
import { Input } from '../../../ui/input';
import { Textarea } from '../../../ui/textarea';

import { useProductCenter } from '../context/ProductCenterContext';
import type { SupplierQuote } from '../context/types';

interface Props {
  productId: string | null;
  onClose: () => void;
}

const INCOTERMS: SupplierQuote['incoterm'][] = ['EXW', 'FOB', 'CIF', 'DDP'];

/**
 * Phase 3 — record a new supplier quote against the product. Lists existing
 * quote history (current + superseded) at the bottom.
 */
export function SupplierQuoteDialog({ productId, onClose }: Props) {
  const ctx = useProductCenter();
  const product = productId ? ctx.getProductById(productId) : null;

  const supplierLinks = productId ? ctx.getSupplierLinksForProduct(productId) : [];
  const quotes = useMemo(
    () =>
      productId
        ? [...ctx.getSupplierQuotesForProduct(productId)].sort((a, b) =>
            b.createdAt.localeCompare(a.createdAt),
          )
        : [],
    [ctx, productId],
  );

  // Form state
  const [supplierId, setSupplierId] = useState<string>(supplierLinks[0]?.supplierId ?? '');
  const [supplierName, setSupplierName] = useState<string>(supplierLinks[0]?.supplierName ?? '');
  const [supplierModelNo, setSupplierModelNo] = useState<string>(supplierLinks[0]?.supplierModelNo ?? '');
  const [quotedPrice, setQuotedPrice] = useState<string>('');
  const [currency, setCurrency] = useState<string>('USD');
  const [moq, setMoq] = useState<string>('100');
  const [incoterm, setIncoterm] = useState<SupplierQuote['incoterm']>('FOB');
  const [port, setPort] = useState<string>('Ningbo');
  const [validUntil, setValidUntil] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  function pickSupplier(id: string) {
    setSupplierId(id);
    const sl = supplierLinks.find((s) => s.supplierId === id);
    if (sl) {
      setSupplierName(sl.supplierName);
      setSupplierModelNo(sl.supplierModelNo ?? '');
    }
  }

  function submit() {
    if (!productId) return;
    const price = Number(quotedPrice);
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('请输入有效的报价金额');
      return;
    }
    if (!supplierName.trim()) {
      toast.error('请填写供应商名称');
      return;
    }
    ctx.addSupplierQuote({
      productId,
      supplierId: supplierId || `sup_${Date.now().toString(36)}`,
      supplierName: supplierName.trim(),
      supplierModelNo: supplierModelNo.trim() || undefined,
      quotedPrice: price,
      currency: currency.trim().toUpperCase() || 'USD',
      moq: Math.max(1, Math.round(Number(moq) || 1)),
      incoterm,
      port: port.trim() || undefined,
      validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
      notes: notes.trim() || undefined,
    });
    toast.success(`已记录新报价 · ${supplierName} ${currency} ${price.toFixed(2)}`);
    setQuotedPrice('');
    setNotes('');
  }

  return (
    <Dialog open={Boolean(productId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-base">
            供应商报价 · {product?.sku ?? ''} {product?.name ?? ''}
          </DialogTitle>
          <DialogDescription className="text-xs">
            记录每一次工厂报价，自动生成历史时间线；最新一条会被标记为当前报价。
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3 border-y border-slate-200 py-4 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">供应商</label>
            {supplierLinks.length > 0 ? (
              <select
                className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
                value={supplierId}
                onChange={(e) => pickSupplier(e.target.value)}
              >
                <option value="">— 自定义 —</option>
                {supplierLinks.map((sl) => (
                  <option key={sl.supplierId} value={sl.supplierId}>
                    {sl.supplierName}
                  </option>
                ))}
              </select>
            ) : null}
            <Input
              className="h-8 text-xs"
              placeholder="供应商名称"
              value={supplierName}
              onChange={(e) => setSupplierName(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">工厂型号</label>
            <Input
              className="h-8 text-xs"
              placeholder="HD-XXX-001"
              value={supplierModelNo}
              onChange={(e) => setSupplierModelNo(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">币种</label>
            <select
              className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              <option value="USD">USD</option>
              <option value="CNY">CNY</option>
              <option value="EUR">EUR</option>
              <option value="HKD">HKD</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">报价金额</label>
            <Input
              className="h-8 text-xs font-mono"
              placeholder="0.00"
              inputMode="decimal"
              value={quotedPrice}
              onChange={(e) => setQuotedPrice(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">MOQ</label>
            <Input
              className="h-8 text-xs font-mono"
              placeholder="100"
              inputMode="numeric"
              value={moq}
              onChange={(e) => setMoq(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">贸易条款</label>
            <select
              className="h-8 w-full rounded border border-slate-300 bg-white px-2 text-xs"
              value={incoterm}
              onChange={(e) => setIncoterm(e.target.value as SupplierQuote['incoterm'])}
            >
              {INCOTERMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">港口</label>
            <Input
              className="h-8 text-xs"
              placeholder="Ningbo"
              value={port}
              onChange={(e) => setPort(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">有效期至</label>
            <Input
              className="h-8 text-xs"
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
          <div className="col-span-3 space-y-1">
            <label className="text-[11px] font-medium text-slate-600">备注</label>
            <Textarea
              className="min-h-[56px] text-xs"
              placeholder="变化原因、原材料波动、议价记录…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-700">报价历史 · {quotes.length} 条</h4>
          </div>
          <div className="max-h-[260px] overflow-auto rounded border border-slate-200">
            <table className="w-full text-xs">
              <thead className="bg-slate-50 text-slate-600">
                <tr>
                  <th className="px-2 py-2 text-left font-medium">日期</th>
                  <th className="px-2 py-2 text-left font-medium">供应商</th>
                  <th className="px-2 py-2 text-left font-medium">型号</th>
                  <th className="px-2 py-2 text-right font-medium">报价</th>
                  <th className="px-2 py-2 text-right font-medium">MOQ</th>
                  <th className="px-2 py-2 text-left font-medium">条款</th>
                  <th className="px-2 py-2 text-left font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {quotes.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-6 text-center text-slate-500">
                      暂无报价历史
                    </td>
                  </tr>
                ) : (
                  quotes.map((q) => (
                    <tr key={q.id} className="border-t border-slate-100">
                      <td className="px-2 py-1.5 text-slate-700">
                        {new Date(q.createdAt).toLocaleDateString('zh-CN')}
                      </td>
                      <td className="px-2 py-1.5">{q.supplierName}</td>
                      <td className="px-2 py-1.5 font-mono text-[11px]">{q.supplierModelNo ?? '—'}</td>
                      <td className="px-2 py-1.5 text-right font-mono">
                        {q.currency} {q.quotedPrice.toFixed(2)}
                      </td>
                      <td className="px-2 py-1.5 text-right font-mono">{q.moq}</td>
                      <td className="px-2 py-1.5">{q.incoterm ?? '—'}</td>
                      <td className="px-2 py-1.5">
                        {q.isCurrent ? (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                            当前
                          </span>
                        ) : (
                          <button
                            type="button"
                            className="rounded border border-slate-300 px-1.5 py-0.5 text-[10px] text-slate-600 hover:border-blue-400 hover:text-blue-600"
                            onClick={() => ctx.setCurrentSupplierQuote(q.id)}
                          >
                            设为当前
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={onClose}>
            关闭
          </Button>
          <Button size="sm" onClick={submit}>
            <Plus className="mr-1 h-3.5 w-3.5" /> 记录新报价
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
