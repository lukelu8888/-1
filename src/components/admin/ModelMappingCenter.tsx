import { useEffect, useMemo, useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { productMappingEventService, productMasterService, productModelMappingService, nextInternalModelNo } from '../../lib/supabaseService';
import { toast } from 'sonner';
import { ArrowRightLeft, Check, Link2, Package, Search, ShieldAlert, Sparkles, X } from 'lucide-react';

type MappingRecord = any;
type ProductRecord = any;

const mappingStatusTone: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  suggested: 'bg-blue-50 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  rejected: 'bg-slate-100 text-slate-600 border-slate-200',
};

export default function ModelMappingCenter() {
  const [activeFilter, setActiveFilter] = useState<'all' | 'customer' | 'supplier'>('all');
  const [pendingMappings, setPendingMappings] = useState<MappingRecord[]>([]);
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMappingId, setSelectedMappingId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [events, setEvents] = useState<any[]>([]);

  const selectedMapping = useMemo(
    () => pendingMappings.find((item) => item.id === selectedMappingId) || null,
    [pendingMappings, selectedMappingId],
  );

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return products;
    return products.filter((item) =>
      [item.internalModelNo, item.productName, item.description]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword)),
    );
  }, [products, search]);

  const selectedProduct = useMemo(
    () => filteredProducts.find((item) => item.id === selectedProductId) || products.find((item) => item.id === selectedProductId) || null,
    [filteredProducts, products, selectedProductId],
  );

  const bestSuggestedProduct = useMemo(() => {
    if (!selectedMapping) return null;
    const name = String(selectedMapping.externalProductName || '').trim().toLowerCase();
    const model = String(selectedMapping.externalModelNo || '').trim().toLowerCase();
    if (!name && !model) return null;

    let best: ProductRecord | null = null;
    let bestScore = 0;
    for (const product of products) {
      const internal = String(product.internalModelNo || '').toLowerCase();
      const productName = String(product.productName || '').toLowerCase();
      const description = String(product.description || '').toLowerCase();
      let score = 0;
      if (model && internal.includes(model)) score += 0.95;
      if (name && productName === name) score += 0.92;
      if (name && productName.includes(name)) score += 0.82;
      if (name && description.includes(name)) score += 0.68;
      if (score > bestScore) {
        bestScore = score;
        best = product;
      }
    }
    return bestScore >= 0.68 ? { ...best, _score: bestScore } : null;
  }, [products, selectedMapping]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [mappingRows, productRows] = await Promise.all([
        activeFilter === 'all'
          ? productModelMappingService.getPending()
          : productModelMappingService.getPending(activeFilter),
        productMasterService.getAll(),
      ]);
      setPendingMappings(mappingRows);
      setProducts(productRows);
      if (!selectedMappingId && mappingRows[0]) {
        setSelectedMappingId(mappingRows[0].id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to load mapping center: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeFilter]);

  useEffect(() => {
    if (!selectedMappingId && pendingMappings[0]) {
      setSelectedMappingId(pendingMappings[0].id);
    }
  }, [pendingMappings, selectedMappingId]);

  useEffect(() => {
    if (!selectedMappingId) {
      setEvents([]);
      return;
    }
    productMappingEventService.getByExternalModelId(selectedMappingId)
      .then(setEvents)
      .catch(() => setEvents([]));
  }, [selectedMappingId]);

  const handleConfirmExisting = async () => {
    if (!selectedMapping || !selectedProductId) {
      toast.error('Please choose a pending mapping and an internal product.');
      return;
    }
    setIsSubmitting(true);
    try {
      await productModelMappingService.confirmMapping(selectedMapping.id, selectedProductId, 'admin');
      toast.success('Mapping confirmed to existing internal product.');
      setSelectedProductId(null);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to confirm mapping: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateInternal = async () => {
    if (!selectedMapping) {
      toast.error('Please choose a pending mapping first.');
      return;
    }
    setIsSubmitting(true);
    try {
      const regionCode = selectedMapping.product?.regionCode || 'NA';
      const internalModelNo = await nextInternalModelNo(regionCode);
      const product = await productMasterService.create({
        internalModelNo,
        regionCode,
        productName: selectedMapping.externalProductName || selectedMapping.externalModelNo || 'New mapped product',
        description: selectedMapping.externalSpecification || '',
        imageUrl: selectedMapping.externalImageUrl || '',
        status: 'active',
      });
      await productModelMappingService.confirmMapping(selectedMapping.id, product.id, 'admin');
      toast.success(`Created ${internalModelNo} and linked the external model.`);
      setSelectedProductId(product.id);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to create internal product: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedMapping) {
      toast.error('Please choose a pending mapping first.');
      return;
    }
    setIsSubmitting(true);
    try {
      await productModelMappingService.rejectMapping(selectedMapping.id, 'admin', 'Rejected from mapping center');
      toast.success('Mapping rejected.');
      setSelectedProductId(null);
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to reject mapping: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuggest = async () => {
    if (!selectedMapping || !bestSuggestedProduct?.id || isSubmitting) {
      toast.error('No suggested internal product available for this mapping.');
      return;
    }
    setIsSubmitting(true);
    try {
      await productModelMappingService.suggestMatch(
        selectedMapping.id,
        bestSuggestedProduct.id,
        bestSuggestedProduct._score || 0.8,
      );
      setSelectedProductId(bestSuggestedProduct.id);
      toast.success('Suggested internal product generated. Please confirm manually.');
      await loadData();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to suggest mapping: ${message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-gray-900 mb-1" style={{ fontSize: '18px', fontWeight: 700 }}>型号映射中心</h2>
          <p className="text-gray-500" style={{ fontSize: '12px' }}>
            用我方型号作为主识别码，处理客户型号和供应商型号的映射确认。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(['all', 'customer', 'supplier'] as const).map((key) => (
            <Button
              key={key}
              variant={activeFilter === key ? 'default' : 'outline'}
              className="h-8 px-3"
              style={{ fontSize: '12px' }}
              onClick={() => setActiveFilter(key)}
            >
              {key === 'all' ? '全部待处理' : key === 'customer' ? '客户型号' : '供应商型号'}
            </Button>
          ))}
        </div>
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: '320px minmax(0, 1fr) 320px' }}
      >
        <div className="bg-white border border-gray-200 rounded shadow-sm min-h-[640px] flex flex-col">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="text-gray-900" style={{ fontSize: '13px', fontWeight: 700 }}>待确认外部型号</div>
            <div className="text-gray-500 mt-1" style={{ fontSize: '11px' }}>客户侧和供应商侧提交的外部型号都先进入这里。</div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-gray-500" style={{ fontSize: '12px' }}>加载中...</div>
            ) : pendingMappings.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div>
                  <ArrowRightLeft className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-[13px] font-semibold text-slate-700">暂无待处理映射</p>
                  <p className="mt-1 text-[12px] text-slate-500">客户型号和供应商型号进入系统后，会在这里等待确认。</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {pendingMappings.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedMappingId(item.id)}
                    className={`w-full px-4 py-3 text-left transition-colors ${selectedMappingId === item.id ? 'bg-orange-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-gray-900" style={{ fontSize: '13px', fontWeight: 700 }}>
                          {item.externalModelNo || 'No external model'}
                        </div>
                        <div className="mt-1 text-gray-500" style={{ fontSize: '11px' }}>
                          {item.partyType === 'customer' ? '客户型号' : '供应商型号'}
                        </div>
                        <div className="mt-2 truncate text-gray-700" style={{ fontSize: '12px' }}>
                          {item.externalProductName || 'No product name'}
                        </div>
                      </div>
                      <Badge className={`border ${mappingStatusTone[item.mappingStatus] || mappingStatusTone.pending}`} style={{ fontSize: '10px' }}>
                        {item.mappingStatus}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded shadow-sm min-h-[640px] flex flex-col">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-gray-900" style={{ fontSize: '13px', fontWeight: 700 }}>内部产品主档</div>
                <div className="text-gray-500 mt-1" style={{ fontSize: '11px' }}>我方型号永远是主型号，外部型号只能映射到这里。</div>
              </div>
              <div className="relative w-[240px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="搜索我方型号或产品名"
                  className="h-9 pl-9"
                  style={{ fontSize: '12px' }}
                />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="flex h-full items-center justify-center p-6 text-center">
                <div>
                  <Package className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                  <p className="text-[13px] font-semibold text-slate-700">暂无内部产品</p>
                  <p className="mt-1 text-[12px] text-slate-500">创建我方型号后，这里会成为统一的主产品识别库。</p>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredProducts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedProductId(item.id)}
                    className={`w-full px-4 py-3 text-left transition-colors ${selectedProductId === item.id ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-gray-900" style={{ fontSize: '13px', fontWeight: 700 }}>
                          {item.internalModelNo}
                        </div>
                        <div className="mt-1 truncate text-gray-700" style={{ fontSize: '12px' }}>
                          {item.productName || 'Unnamed product'}
                        </div>
                        <div className="mt-1 truncate text-gray-500" style={{ fontSize: '11px' }}>
                          {item.description || 'No description'}
                        </div>
                      </div>
                      <Badge variant="outline" style={{ fontSize: '10px' }}>
                        {item.regionCode || 'NA'}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded shadow-sm min-h-[640px] flex flex-col">
          <div className="border-b border-gray-200 px-4 py-3">
            <div className="text-gray-900" style={{ fontSize: '13px', fontWeight: 700 }}>映射动作</div>
            <div className="text-gray-500 mt-1" style={{ fontSize: '11px' }}>先看外部型号，再决定链接现有内部产品，或者新建我方型号。</div>
          </div>
          <div className="flex-1 space-y-4 p-4">
            {!selectedMapping ? (
              <div className="rounded border border-dashed border-slate-200 bg-slate-50 p-4 text-[12px] text-slate-500">
                先从左侧选择一条待处理映射。
              </div>
            ) : (
              <>
                <div className="rounded border border-slate-200 bg-slate-50 p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">External Source</div>
                  <div className="mt-2 text-[14px] font-semibold text-slate-900">{selectedMapping.externalModelNo || '-'}</div>
                  <div className="mt-1 text-[12px] text-slate-600">{selectedMapping.externalProductName || 'No product name'}</div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="outline" style={{ fontSize: '10px' }}>
                      {selectedMapping.partyType === 'customer' ? '客户型号' : '供应商型号'}
                    </Badge>
                    {selectedMapping.matchConfidence != null && (
                      <Badge variant="outline" style={{ fontSize: '10px' }}>
                        Confidence {Math.round(selectedMapping.matchConfidence * 100)}%
                      </Badge>
                    )}
                  </div>
                  {selectedMapping.externalSpecification && (
                    <div className="mt-3 text-[12px] text-slate-600">{selectedMapping.externalSpecification}</div>
                  )}
                </div>

                <div className="rounded border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Selected Internal Product</div>
                  {selectedProduct ? (
                    <div className="mt-2">
                      <div className="text-[14px] font-semibold text-slate-900">{selectedProduct.internalModelNo}</div>
                      <div className="mt-1 text-[12px] text-slate-700">{selectedProduct.productName}</div>
                      <div className="mt-1 text-[12px] text-slate-500">{selectedProduct.description || 'No description'}</div>
                    </div>
                  ) : (
                    <div className="mt-2 text-[12px] text-slate-500">未选择内部产品。你可以链接现有产品，或直接新建我方型号。</div>
                  )}
                </div>

                {bestSuggestedProduct && (
                  <div className="rounded border border-blue-200 bg-blue-50 p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-blue-700">Auto Suggestion</div>
                    <div className="mt-2 text-[13px] font-semibold text-slate-900">{bestSuggestedProduct.internalModelNo}</div>
                    <div className="mt-1 text-[12px] text-slate-700">{bestSuggestedProduct.productName}</div>
                    <div className="mt-1 text-[11px] text-blue-700">
                      Confidence {Math.round((bestSuggestedProduct._score || 0) * 100)}%
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Button
                    disabled={!bestSuggestedProduct?.id || isSubmitting}
                    onClick={handleSuggest}
                    variant="outline"
                    className="h-10 w-full justify-center border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    Suggest Best Internal Match
                  </Button>
                  <Button
                    disabled={!selectedProductId || isSubmitting}
                    onClick={handleConfirmExisting}
                    className="h-10 w-full justify-center bg-[#F96302] text-white hover:bg-[#E05502]"
                  >
                    <Link2 className="mr-2 h-4 w-4" />
                    Link To Existing Internal Model
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    onClick={handleCreateInternal}
                    variant="outline"
                    className="h-10 w-full justify-center border-slate-300"
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Create Internal Model And Link
                  </Button>
                  <Button
                    disabled={isSubmitting}
                    onClick={handleReject}
                    variant="ghost"
                    className="h-10 w-full justify-center text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject Mapping
                  </Button>
                </div>

                <div className="rounded border border-amber-200 bg-amber-50 p-4">
                  <div className="flex items-start gap-2">
                    <ShieldAlert className="mt-0.5 h-4 w-4 text-amber-600" />
                    <div className="text-[12px] text-amber-800">
                      客户型号和供应商型号只能映射到我方型号，不能互相直接映射。这是 ERP 主型号中心制。
                    </div>
                  </div>
                </div>

                <div className="rounded border border-slate-200 bg-white p-4">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">Mapping History</div>
                  {events.length === 0 ? (
                    <div className="mt-2 text-[12px] text-slate-500">还没有映射历史事件。</div>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {events.map((event) => (
                        <div key={event.id} className="rounded border border-slate-100 bg-slate-50 px-3 py-2">
                          <div className="flex items-center justify-between gap-3">
                            <div className="text-[12px] font-semibold text-slate-800">{event.eventType}</div>
                            <div className="text-[11px] text-slate-500">
                              {event.createdAt ? new Date(event.createdAt).toLocaleString() : '-'}
                            </div>
                          </div>
                          {event.notes && (
                            <div className="mt-1 text-[11px] text-slate-600">{event.notes}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
