/**
 * Phase 5d — useQuotationPriceFill
 *
 * 纯数据 hook。给定一组「待报价行」，异步调用产品中心三层选价
 * (specific > tier+discount > base+discount)，返回填充结果供 UI 展示。
 *
 * 不依赖 QuotationManagement 的 context；任何有 `sku + qty` 的报价行
 * 都可以接入 — admin QuotationManagement、salesperson SalesQuotation
 * 都可以直接用同一个 hook，只传适配后的 QuotationLineInput[]。
 *
 * 使用流程：
 *   1. 外部传入 lines（报价行）+ region + customerId（可选）
 *   2. 调用 fill()
 *   3. results 包含每行的价格建议（resolved=true）或失败原因
 *   4. 外部决定哪些行 "accept"，并把 unitPrice 写回自己的 state
 */

import { useCallback, useRef, useState } from 'react';
import { useProductCenter } from '../context/ProductCenterContext';
import type { QuotationLineInput, QuotationLineResolved } from '../services/productCenterService';
import type { RegionCode } from '../context/types';

export interface QuotationFillLine {
  /** Echoed back in the result to match input ↔ output. */
  lineRef: string | number;
  sku: string;
  qty: number;
}

export type FillStatus = 'idle' | 'loading' | 'done' | 'error';

export interface UseQuotationPriceFillReturn {
  status: FillStatus;
  results: QuotationLineResolved[];
  /** Call this to start the batch lookup. */
  fill: (lines: QuotationFillLine[], region: RegionCode, customerId: string | null) => void;
  reset: () => void;
  /** Summary counts for UI badges. */
  resolvedCount: number;
  failedCount: number;
}

export function useQuotationPriceFill(): UseQuotationPriceFillReturn {
  const ctx = useProductCenter();
  const [status, setStatus] = useState<FillStatus>('idle');
  const [results, setResults] = useState<QuotationLineResolved[]>([]);
  const abortRef = useRef<boolean>(false);

  const fill = useCallback(
    (rawLines: QuotationFillLine[], region: RegionCode, customerId: string | null) => {
      if (!rawLines.length) return;
      abortRef.current = false;
      setStatus('loading');
      setResults([]);

      const inputs: QuotationLineInput[] = rawLines.map((l) => ({
        lineRef: l.lineRef,
        sku: l.sku,
        qty: l.qty,
        region,
        customerId,
      }));

      ctx
        .resolveQuotationLinePrices(inputs)
        .then((resolved) => {
          if (abortRef.current) return;
          setResults(resolved);
          setStatus('done');
        })
        .catch(() => {
          if (abortRef.current) return;
          setStatus('error');
        });
    },
    [ctx],
  );

  const reset = useCallback(() => {
    abortRef.current = true;
    setStatus('idle');
    setResults([]);
  }, []);

  const resolvedCount = results.filter((r) => r.resolved).length;
  const failedCount = results.filter((r) => !r.resolved).length;

  return { status, results, fill, reset, resolvedCount, failedCount };
}
