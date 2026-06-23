import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Save, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../../ui/button';
import { Input } from '../../../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../ui/select';
import { Switch } from '../../../../ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../../ui/table';

import { PageHeading, Toolbar } from '../../shared/Toolbar';
import { FieldRow, SectionShell } from '../../shared/SectionShell';
import { useProductCenter } from '../../context/ProductCenterContext';
import type { AttributeDataType, ProductAttribute, ProductCategory } from '../../context/types';

export function CategoriesPage() {
  const ctx = useProductCenter();
  const { categories, attributes, upsertCategory, saveCategory, removeCategory } = ctx;

  const visibleCategories = useMemo(() => getDisplayCategories(categories), [categories]);
  const tree = useMemo(() => buildTree(visibleCategories), [visibleCategories]);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(visibleCategories.filter((c) => c.level === 1).map((c) => c.id)),
  );
  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const [activeId, setActiveId] = useState<string | null>(visibleCategories[0]?.id ?? null);
  const [savingCategory, setSavingCategory] = useState(false);
  const active = useMemo(
    () =>
      visibleCategories.find((category) => category.id === activeId) ??
      visibleCategories[0] ??
      null,
    [activeId, visibleCategories],
  );
  const activeNameSuggestionContext = useMemo(
    () => buildCategoryNameSuggestionContext(active, visibleCategories),
    [active, visibleCategories],
  );
  const autoNameEnByCategoryId = useRef<Record<string, string>>({});

  useEffect(() => {
    if (activeId && visibleCategories.some((category) => category.id === activeId)) return;
    setActiveId(visibleCategories[0]?.id ?? null);
  }, [activeId, visibleCategories]);

  useEffect(() => {
    setExpanded((prev) => {
      const next = new Set(prev);
      visibleCategories
        .filter((category) => category.level === 1)
        .forEach((category) => next.add(category.id));
      return next;
    });
  }, [visibleCategories]);

  useEffect(() => {
    if (!active) return;
    autoNameEnByCategoryId.current[active.id] ??= suggestEnglishCategoryName(
      active.name,
      activeNameSuggestionContext,
    );
  }, [active?.id, activeNameSuggestionContext]);

  const patchActive = (patch: Partial<ProductCategory>) => {
    if (!active) return;
    upsertCategory({ ...active, ...patch });
  };

  const handleChineseNameChange = (nextName: string) => {
    if (!active) return;
    const nextSuggestedNameEn = suggestEnglishCategoryName(nextName, activeNameSuggestionContext);
    const previousSuggestedNameEn =
      autoNameEnByCategoryId.current[active.id] ??
      suggestEnglishCategoryName(active.name, activeNameSuggestionContext);
    const currentNameEn = (active.nameEn ?? '').trim();
    const shouldRefreshEnglishName = !currentNameEn || currentNameEn === previousSuggestedNameEn;

    autoNameEnByCategoryId.current[active.id] = nextSuggestedNameEn;
    patchActive({
      name: nextName,
      ...(shouldRefreshEnglishName ? { nameEn: nextSuggestedNameEn } : {}),
    });
  };

  const handleEnglishNameChange = (nextNameEn: string) => {
    patchActive({ nameEn: nextNameEn });
  };

  const handleSaveCategory = async () => {
    if (!active || savingCategory) return;
    setSavingCategory(true);
    try {
      const saved = await saveCategory(active);
      setActiveId(saved.id);
    } catch (err) {
      console.error('[product-center] save category failed', err);
      const rawMessage = err instanceof Error ? err.message : '未知错误';
      const message = rawMessage.includes('pc_product_categories_tenant_id_code_key')
        ? '分类编码已存在，请修改「编码」后再保存'
        : rawMessage;
      toast.error(`保存分类失败：${message}`);
    } finally {
      setSavingCategory(false);
    }
  };

  const onCreate = (parentId: string | null) => {
    const parent = parentId ? categories.find((c) => c.id === parentId) : null;
    const level = parent ? parent.level + 1 : 1;
    const codeSuffix = `new-${Date.now().toString(36)}`;
    const newCat: ProductCategory = {
      id: createCategoryId(),
      tenantId: 'tenant_default',
      parentId,
      level,
      code: parent ? `${parent.code}.${codeSuffix}` : `storefront:${codeSuffix}`,
      name: `新分类 L${level}`,
      nameEn: `New L${level} Category`,
      sortOrder: 99,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    upsertCategory(newCat);
    setActiveId(newCat.id);
    if (parentId) setExpanded((prev) => new Set(prev).add(parentId));
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeading
        title="分类 & 属性 / Category & Attributes"
        subtitle="官网分类树（支持 N 级）+ 末级类目属性模板 + 前台筛选器"
        actions={
          <Button size="sm" className="h-8" onClick={() => onCreate(null)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> 新建一级分类
          </Button>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Tree */}
        <aside className="w-72 shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
          <div className="sticky top-0 border-b border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
            分类树
          </div>
          <ul className="py-1">
            {tree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                expanded={expanded}
                onToggle={toggleExpand}
                onSelect={(category) => setActiveId(category.id)}
                onAddChild={(id) => onCreate(id)}
                activeId={active?.id ?? null}
              />
            ))}
          </ul>
        </aside>

        {/* Editor */}
        <main className="min-w-0 flex-1 overflow-y-auto bg-slate-50">
          {active ? (
            <div className="space-y-3 p-3">
              <SectionShell
                title={`编辑分类 · L${active.level} ${active.name}`}
                actions={
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      className="h-7 text-[12px]"
                      onClick={handleSaveCategory}
                      disabled={savingCategory}
                    >
                      <Save className="mr-1 h-3.5 w-3.5" />
                      {savingCategory ? '保存中' : '保存分类'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-[12px] text-rose-600 hover:bg-rose-50"
                      onClick={() => {
                        removeCategory(active.id);
                        setActiveId(null);
                        toast.success('已删除');
                      }}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" /> 删除
                    </Button>
                  </div>
                }
              >
                <FieldRow label="名称 (中文)" required>
                  <Input
                    value={active.name}
                    onChange={(e) => handleChineseNameChange(e.target.value)}
                    className="h-8"
                  />
                </FieldRow>
                <FieldRow label="名称 (英文)">
                  <Input
                    value={active.nameEn ?? ''}
                    onChange={(e) => handleEnglishNameChange(e.target.value)}
                    className="h-8"
                  />
                </FieldRow>
                <FieldRow label="编码">
                  <Input
                    value={active.code}
                    onChange={(e) => patchActive({ code: e.target.value })}
                    className="h-8 font-mono"
                  />
                </FieldRow>
                <FieldRow label="排序权重">
                  <Input
                    type="number"
                    value={active.sortOrder}
                    onChange={(e) =>
                      patchActive({ sortOrder: Number(e.target.value) || 0 })
                    }
                    className="h-8 w-32 font-mono"
                  />
                </FieldRow>
                <FieldRow label="启用状态">
                  <Switch
                    checked={active.isActive}
                    onCheckedChange={(checked) => patchActive({ isActive: checked })}
                  />
                </FieldRow>
                <FieldRow label="SEO Title">
                  <Input
                    value={active.seoTitle ?? ''}
                    onChange={(e) => patchActive({ seoTitle: e.target.value })}
                    className="h-8"
                  />
                </FieldRow>
                <FieldRow label="SEO Description">
                  <Input
                    value={active.seoDescription ?? ''}
                    onChange={(e) => patchActive({ seoDescription: e.target.value })}
                    className="h-8"
                  />
                </FieldRow>
              </SectionShell>

              <CategoryAttributeTemplate active={active} />
              <SectionShell title="全局属性字典" phase="参考">
                <Table className="text-[12px]">
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead>属性</TableHead>
                      <TableHead>类型</TableHead>
                      <TableHead>单位</TableHead>
                      <TableHead>选项</TableHead>
                      <TableHead>前台筛选器</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attributes.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{a.label}</TableCell>
                        <TableCell className="font-mono text-[11px]">{a.dataType}</TableCell>
                        <TableCell>{a.unit ?? '—'}</TableCell>
                        <TableCell className="text-slate-600">
                          {a.options?.join(' · ') ?? '—'}
                        </TableCell>
                        <TableCell>
                          {a.isFilterable ? (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-700">是</span>
                          ) : (
                            <span className="text-slate-400">否</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </SectionShell>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-[12px] text-slate-500">
              请在左侧选择或新建分类
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

interface TreeItem extends ProductCategory {
  children: TreeItem[];
}

function buildTree(categories: ProductCategory[]): TreeItem[] {
  const byParent = new Map<string | null, ProductCategory[]>();
  categories.forEach((c) => {
    const arr = byParent.get(c.parentId) ?? [];
    arr.push(c);
    byParent.set(c.parentId, arr);
  });
  const visit = (parentId: string | null): TreeItem[] =>
    (byParent.get(parentId) ?? [])
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((c) => ({ ...c, children: visit(c.id) }));
  return visit(null);
}

const isStorefrontCategory = (category: ProductCategory) => category.code.startsWith('storefront:');

const createCategoryId = () => crypto.randomUUID();

function getDisplayCategories(categories: ProductCategory[]) {
  const storefrontCategories = categories.filter(isStorefrontCategory);
  return storefrontCategories.length > 0 ? storefrontCategories : categories;
}

interface CategoryNameSuggestionContext {
  current?: ProductCategory;
  parent?: ProductCategory;
  ancestors: ProductCategory[];
  siblings: ProductCategory[];
}

function buildCategoryNameSuggestionContext(
  category: ProductCategory | null,
  categories: ProductCategory[],
): CategoryNameSuggestionContext {
  if (!category) return { ancestors: [], siblings: [] };

  const byId = new Map(categories.map((item) => [item.id, item]));
  const ancestors: ProductCategory[] = [];
  let parent = category.parentId ? byId.get(category.parentId) : undefined;

  while (parent) {
    ancestors.unshift(parent);
    parent = parent.parentId ? byId.get(parent.parentId) : undefined;
  }

  return {
    current: category,
    parent: ancestors.at(-1),
    ancestors,
    siblings: categories.filter(
      (item) => item.parentId === category.parentId && item.id !== category.id,
    ),
  };
}

function TreeNode({
  node,
  expanded,
  onToggle,
  onSelect,
  onAddChild,
  activeId,
}: {
  node: TreeItem;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onSelect: (n: ProductCategory) => void;
  onAddChild: (id: string) => void;
  activeId: string | null;
}) {
  const isOpen = expanded.has(node.id);
  const active = activeId === node.id;
  const displayNameEn = (node.nameEn ?? '').trim();
  const shouldShowNameEn = displayNameEn && displayNameEn !== node.name.trim();
  return (
    <li>
      <div
        className={`group flex items-center gap-1 px-2 py-1 text-[12px] hover:bg-slate-50 ${
          active ? 'bg-slate-100' : ''
        }`}
        style={{ paddingLeft: 8 + (node.level - 1) * 14 }}
      >
        {node.children.length > 0 ? (
          <button
            type="button"
            onClick={() => onToggle(node.id)}
            className="rounded p-0.5 text-slate-500 hover:bg-slate-200"
          >
            {isOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <span className="inline-block w-4" />
        )}
        <button
          type="button"
          onClick={() => onSelect(node)}
          title={`${node.name}${displayNameEn ? ` ${displayNameEn}` : ''}`}
          className="min-w-0 flex-1 overflow-hidden text-left"
        >
          <span className="block min-w-0 truncate">
            <span className="font-medium text-slate-800">{node.name}</span>
            {shouldShowNameEn && (
              <span className="ml-1 text-[11px] text-slate-500">{displayNameEn}</span>
            )}
          </span>
        </button>
        <span className="w-[34px] shrink-0 rounded bg-slate-100 px-1 text-center text-[10px] text-slate-500">
          L{node.level}
        </span>
        <button
          type="button"
          title="添加子级"
          onClick={() => onAddChild(node.id)}
          className="invisible w-[18px] shrink-0 rounded p-0.5 text-slate-500 hover:bg-slate-200 group-hover:visible"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>
      {isOpen && node.children.length > 0 && (
        <ul>
          {node.children.map((c) => (
            <TreeNode
              key={c.id}
              node={c}
              expanded={expanded}
              onToggle={onToggle}
              onSelect={onSelect}
              onAddChild={onAddChild}
              activeId={activeId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

const categoryNameTranslations: Record<string, string> = {
  家电: 'Appliances',
  家电配件: 'Appliance Parts & Accessories',
  冰箱配件: 'Refrigerator Parts',
  洗衣机配件: 'Washer Parts',
  烘干机配件: 'Dryer Parts',
  洗碗机配件: 'Dishwasher Parts',
  炉灶配件: 'Range Parts',
  微波炉配件: 'Microwave Parts',
  净水滤芯: 'Water Filter',
  厨房套装: 'Kitchen Packages',
  洗衣套装: 'Laundry Pairs',
  套装优惠: 'Suite Deals',
  清仓商品: 'Clearance Items',
  返利优惠: 'Rebates & Offers',
  卫浴: 'Bath',
  卫浴洁具: 'Bath',
  浴室: 'Bathroom',
  马桶座便器: 'Toilets & Toilet Seats',
  马桶: 'Toilets',
  座便器: 'Toilets',
  坐便器: 'Toilets',
  马桶座圈: 'Toilet Seats',
  智能坐便器: 'Smart Toilets',
  智能马桶: 'Smart Toilets',
  小便器: 'Urinals',
  浴缸: 'Bathtubs',
  嵌入式浴缸: 'Alcove Bathtubs',
  独立式浴缸: 'Freestanding Bathtubs',
  按摩浴缸: 'Whirlpool Tubs',
  搪瓷浴缸: 'Porcelain-Enameled Steel Bathtubs',
  亚克力浴缸: 'Acrylic Bathtubs',
  铸铁浴缸: 'Cast Iron Bathtubs',
  钢制浴缸: 'Steel Bathtubs',
  浴缸配件: 'Bathtub Accessories',
  浴室柜: 'Vanities',
  浴室梳妆台: 'Bathroom Vanities',
  台面: 'Vanity Tops',
  药柜: 'Medicine Cabinets',
  镜子: 'Bathroom Mirrors',
  浴室镜: 'Bathroom Mirrors',
  洗手盆: 'Sinks',
  水槽洗手盆: 'Sinks',
  浴室洗手盆: 'Bathroom Sinks',
  厨房: 'Kitchen',
  建筑材料: 'Building Materials',
  装饰家具: 'Decor & Furniture',
  门窗: 'Doors & Windows',
  门: 'Doors',
  窗: 'Windows',
  围栏: 'Fencing',
  栅栏: 'Fencing',
  护栏: 'Railings',
  栏杆: 'Railings',
  围栏板: 'Fence Panels',
  栅栏板: 'Fence Panels',
  PVC围栏: 'PVC Fencing',
  PVC栅栏: 'PVC Fencing',
  PVC护栏: 'PVC Railings',
  外门: 'Exterior Doors',
  内门: 'Interior Doors',
  前门: 'Front Doors',
  后门: 'Back Doors',
  庭院门: 'Patio Doors',
  法式门: 'French Doors',
  法式对开门: 'French Doors',
  推拉门: 'Sliding Doors',
  折叠门: 'Folding Doors',
  车库门: 'Garage Doors',
  防火门: 'Fire-Rated Doors',
  电气: 'Electrical',
  地板: 'Flooring',
  五金: 'Hardware',
  暖通空调: 'Heating & Cooling',
  草坪花园: 'Lawn & Garden',
  灯具风扇: 'Lighting & Fans',
  户外生活: 'Outdoor Living',
  管道: 'Plumbing',
  收纳整理: 'Storage & Organization',
  工具: 'Tools',
  机器人无人机: 'Robot & Drone',
  无人机: 'Drone',
  机器人: 'Robots',
  软管: 'Hose',
  编织软管: 'Braided Hose',
  编织管: 'Braided Hose',
  不锈钢编织软管: 'Stainless Steel Braided Hose',
  龙头软管: 'Faucet Hose',
  进水软管: 'Inlet Hose',
  排水软管: 'Drain Hose',
  淋浴软管: 'Shower Hose',
  水管: 'Water Pipe',
  管件: 'Pipe Fittings',
  接头: 'Fittings',
  阀门: 'Valves',
  龙头: 'Faucets',
  水龙头: 'Faucets',
  浴室龙头: 'Bathroom Faucets',
  厨房龙头: 'Kitchen Faucets',
  浴缸淋浴龙头: 'Tub & Shower Faucets',
  工用龙头: 'Utility Faucets',
  龙头配件: 'Faucet Parts & Repair',
  花洒: 'Shower Head',
  淋浴: 'Shower',
  淋浴花洒: 'Showers',
  淋浴花洒头: 'Shower Heads',
  淋浴系统: 'Shower Systems',
  淋浴门: 'Shower Doors',
  淋浴隔板: 'Shower Panels',
  淋浴底盆: 'Shower Bases',
  淋浴房: 'Shower Enclosures',
  卫浴配件: 'Bath Accessories',
  卫浴五金: 'Bathroom Hardware',
  纸巾架: 'Toilet Paper Holders',
  毛巾杆: 'Towel Bars',
  挂钩: 'Robe Hooks',
  搪瓷: 'Porcelain-Enameled Steel',
  珐琅: 'Porcelain-Enameled',
  陶瓷: 'Ceramic',
  亚克力: 'Acrylic',
  铸铁: 'Cast Iron',
  钢制: 'Steel',
  不锈钢: 'Stainless Steel',
  嵌入式: 'Alcove',
  独立式: 'Freestanding',
  落地式: 'Freestanding',
  按摩: 'Whirlpool',
  置物架: 'Shelving',
  储物架: 'Storage Rack',
  连接件: 'Connectors',
  配件: 'Accessories',
  替换件: 'Replacement Parts',
  商用系列: 'Commercial Series',
  家用系列: 'Residential Series',
  高级系列: 'Premium Series',
  经典系列: 'Classic Series',
};

const hasChinese = (value: string) => /[\u3400-\u9fff]/.test(value);

const toTitleCase = (value: string) =>
  value
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b[a-z]/g, (char) => char.toUpperCase());

const isUsefulCategoryCodeSegment = (segment: string) =>
  /^[a-z][a-z0-9-]*$/.test(segment) &&
  !/^new(-|\b)/.test(segment) &&
  !/^cat(-|\b)/.test(segment) &&
  !/^\d+$/.test(segment);

const categoryCodeSegmentOverrides: Record<string, string> = {
  b2b: 'B2B',
  diy: 'DIY',
  led: 'LED',
  hvac: 'HVAC',
  pim: 'PIM',
  sku: 'SKU',
};

const categoryCodeSegmentToTitle = (segment: string) =>
  segment
    .split('-')
    .filter(Boolean)
    .map((part) => categoryCodeSegmentOverrides[part] ?? toTitleCase(part))
    .join(' ');

const translateMixedCategoryName = (source: string) => {
  let translated = source;
  Object.entries(categoryNameTranslations)
    .sort(([a], [b]) => b.length - a.length)
    .forEach(([zh, en]) => {
      translated = translated.replaceAll(zh, ` ${en} `);
    });

  return translated
    .replace(/([A-Za-z0-9])([\u3400-\u9fff])/g, '$1 $2')
    .replace(/([\u3400-\u9fff])([A-Za-z0-9])/g, '$1 $2')
    .replace(/[\u3400-\u9fff]/g, ' ')
    .replace(/[^\w&./ -]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const getCurrentCodeLeafName = (context?: CategoryNameSuggestionContext) => {
  const code = context?.current?.code?.trim().toLowerCase();
  if (!code) return '';

  const leaf = code.split('.').filter(Boolean).at(-1) ?? '';
  if (!isUsefulCategoryCodeSegment(leaf)) return '';
  return categoryCodeSegmentToTitle(leaf);
};

const getCurrentCategoryText = (context?: CategoryNameSuggestionContext) =>
  [
    context?.current?.code,
    context?.current?.name,
    context?.current?.nameEn,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const getCategoryPathText = (context?: CategoryNameSuggestionContext) =>
  [
    context?.current?.code,
    context?.current?.name,
    context?.current?.nameEn,
    ...(context?.ancestors ?? []).flatMap((category) => [
      category.name,
      category.nameEn,
      category.code,
    ]),
    ...(context?.siblings ?? []).flatMap((category) => [
      category.name,
      category.nameEn,
      category.code,
    ]),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const currentIncludes = (context: CategoryNameSuggestionContext | undefined, terms: string[]) => {
  const text = getCurrentCategoryText(context);
  return terms.some((term) => text.includes(term.toLowerCase()));
};

const pathIncludes = (context: CategoryNameSuggestionContext | undefined, terms: string[]) => {
  const text = getCategoryPathText(context);
  return terms.some((term) => text.includes(term.toLowerCase()));
};

const applyContextualCategoryNaming = (
  source: string,
  context?: CategoryNameSuggestionContext,
) => {
  if (!context) return '';

  const currentCodeLeafName = getCurrentCodeLeafName(context);
  const parentName = context.parent?.nameEn || context.parent?.name || '';
  const parentBase = parentName
    .replace(/\b(Parts|Accessories|Products|Supplies|Series|Category|Categories)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (/(门|窗)/.test(source)) {
    if (currentCodeLeafName) return currentCodeLeafName;
    if (/庭院门/.test(source) || currentIncludes(context, ['patio-door', 'patio doors'])) {
      return 'Patio Doors';
    }
    if (/前门/.test(source) || currentIncludes(context, ['front-door', 'front doors'])) {
      return 'Front Doors';
    }
    if (/后门/.test(source) || currentIncludes(context, ['back-door', 'back doors'])) {
      return 'Back Doors';
    }
    if (/外门/.test(source) || currentIncludes(context, ['exterior-door', 'exterior doors'])) {
      return 'Exterior Doors';
    }
    if (/内门/.test(source) || currentIncludes(context, ['interior-door', 'interior doors'])) {
      return 'Interior Doors';
    }
    if (/推拉门/.test(source) || currentIncludes(context, ['sliding-door', 'sliding doors'])) {
      return 'Sliding Doors';
    }
    if (/折叠门/.test(source) || currentIncludes(context, ['folding-door', 'folding doors'])) {
      return 'Folding Doors';
    }
    if (/车库门/.test(source) || currentIncludes(context, ['garage-door', 'garage doors'])) {
      return 'Garage Doors';
    }
    if (/防火门/.test(source) || currentIncludes(context, ['fire-door', 'fire rated doors'])) {
      return 'Fire-Rated Doors';
    }
    if (/窗/.test(source)) return 'Windows';
    if (/门/.test(source)) return 'Doors';
  }

  if (/(围栏|栅栏|护栏|栏杆)/.test(source)) {
    const mixed = translateMixedCategoryName(source);
    if (mixed) return toTitleCase(mixed);
    if (pathIncludes(context, ['deck', 'stairs', 'stair', 'baluster', 'railing'])) return 'Railings';
    return 'Fencing';
  }

  if (/(浴缸|浴室柜|马桶|座便器|坐便器|小便器|洗手盆|淋浴|花洒|龙头|卫浴)/.test(source)) {
    const mixed = translateMixedCategoryName(source);
    const pathHas = (terms: string[]) => pathIncludes(context, terms);

    if (/(搪瓷|珐琅|亚克力|铸铁|钢制|陶瓷|不锈钢)/.test(source) && /浴缸/.test(source)) {
      const material = /(搪瓷)/.test(source)
        ? 'Porcelain-Enameled Steel'
        : /(珐琅)/.test(source)
          ? 'Porcelain-Enameled'
        : /亚克力/.test(source)
          ? 'Acrylic'
          : /铸铁/.test(source)
            ? 'Cast Iron'
            : /钢制/.test(source)
              ? 'Steel'
              : /陶瓷/.test(source)
                ? 'Ceramic'
                : /不锈钢/.test(source)
                  ? 'Stainless Steel'
                  : '';
      const tubType = /嵌入式/.test(source) || pathHas(['alcove bathtub', 'alcove tubs', '嵌入式浴缸'])
        ? 'Alcove Bathtubs'
        : /独立式|落地式/.test(source) || pathHas(['freestanding bathtub', 'freestanding tubs', '独立式浴缸'])
          ? 'Freestanding Bathtubs'
          : /按摩/.test(source) || pathHas(['whirlpool tub', '按摩浴缸'])
            ? 'Whirlpool Tubs'
            : 'Bathtubs';
      if (material) return `${material} ${tubType}`;
    }

    if (/浴缸/.test(source)) {
      if (/嵌入式/.test(source) || currentIncludes(context, ['alcove bathtub', 'alcove tubs'])) return 'Alcove Bathtubs';
      if (/独立式|落地式/.test(source) || currentIncludes(context, ['freestanding bathtub', 'freestanding tubs'])) return 'Freestanding Bathtubs';
      if (/按摩/.test(source) || currentIncludes(context, ['whirlpool tub'])) return 'Whirlpool Tubs';
      return mixed ? toTitleCase(mixed) : 'Bathtubs';
    }

    if (mixed) return toTitleCase(mixed);
  }

  if (/(编织软管|编织管|软管)/.test(source)) {
    if (pathIncludes(context, ['faucet', '龙头', 'plumbing', '管道'])) {
      return 'Braided Faucet Supply Hoses';
    }
    if (pathIncludes(context, ['shower', 'bath', 'bathroom', '花洒', '淋浴', '卫浴'])) {
      return 'Braided Shower Hoses';
    }
    if (pathIncludes(context, ['appliance', 'washer', 'dishwasher', '家电', '洗衣机', '洗碗机'])) {
      return 'Braided Appliance Hoses';
    }
    return 'Braided Flexible Hoses';
  }

  if (/(配件|零件|部件)/.test(source)) {
    if (parentBase && !hasChinese(parentBase)) return `${toTitleCase(parentBase)} Parts & Accessories`;
    if (pathIncludes(context, ['appliance', '家电'])) return 'Appliance Parts & Accessories';
    if (pathIncludes(context, ['bath', '卫浴', 'bathroom'])) return 'Bath Accessories';
    if (pathIncludes(context, ['plumbing', '管道'])) return 'Plumbing Parts & Accessories';
  }

  if (/(套装|组合)/.test(source)) {
    if (pathIncludes(context, ['kitchen', '厨房'])) return 'Kitchen Packages';
    if (pathIncludes(context, ['laundry', '洗衣'])) return 'Laundry Packages';
    return 'Product Packages';
  }

  if (/(优惠|促销|折扣|特价)/.test(source)) {
    if (parentBase && !hasChinese(parentBase)) return `${toTitleCase(parentBase)} Promotions`;
    return 'Promotions';
  }

  return '';
};

const suggestEnglishCategoryName = (
  value: string,
  context?: CategoryNameSuggestionContext,
) => {
  const source = value.trim();
  if (!source) return '';
  if (!hasChinese(source)) return toTitleCase(source);

  const contextual = applyContextualCategoryNaming(source, context);
  if (contextual) return contextual;

  const exact = categoryNameTranslations[source];
  if (exact) return exact;

  const currentCodeLeafName = getCurrentCodeLeafName(context);
  if (currentCodeLeafName) return currentCodeLeafName;

  const englishOnly = translateMixedCategoryName(source);

  return englishOnly ? toTitleCase(englishOnly) : 'Custom Category';
};

function CategoryAttributeTemplate({ active }: { active: ProductCategory }) {
  const ctx = useProductCenter();
  const boundAttrs = ctx.attributes
    .filter((a) => a.appliesToCategoryIds?.includes(active.id))
    .sort((a, b) => a.sortOrder - b.sortOrder);

  const addAttribute = () => {
    const stamp = Date.now().toString(36);
    const attr: ProductAttribute = {
      id: `attr_${active.id}_${stamp}`,
      tenantId: 'tenant_default',
      code: `new_attr_${stamp}`,
      label: '新属性',
      dataType: 'text',
      isFilterable: false,
      isRequired: false,
      includeInImport: true,
      appliesToCategoryIds: [active.id],
      sortOrder: boundAttrs.length + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    ctx.upsertAttribute(attr);
    toast.success('已添加属性');
  };

  const patchAttr = (attr: ProductAttribute, patch: Partial<ProductAttribute>) => {
    ctx.upsertAttribute({ ...attr, ...patch });
  };

  return (
    <SectionShell
      title={`末级/当前类目属性模板 · ${active.name}`}
      subtitle="新建产品选择该类目后，只显示这里绑定的属性字段"
      actions={
        <Button size="sm" className="h-7 text-[12px]" onClick={addAttribute}>
          <Plus className="mr-1 h-3.5 w-3.5" /> 添加属性
        </Button>
      }
    >
      <Table className="text-[12px]">
        <TableHeader>
          <TableRow className="bg-slate-50">
            <TableHead>属性名称</TableHead>
            <TableHead>编码</TableHead>
            <TableHead>类型</TableHead>
            <TableHead>单位</TableHead>
            <TableHead>选项</TableHead>
            <TableHead>必填</TableHead>
            <TableHead>前台筛选</TableHead>
            <TableHead>导入模板</TableHead>
            <TableHead className="text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {boundAttrs.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="py-6 text-center text-slate-400">
                该类目尚未绑定属性。点击「添加属性」创建末级类目专属字段。
              </TableCell>
            </TableRow>
          )}
          {boundAttrs.map((attr) => (
            <TableRow key={attr.id}>
              <TableCell>
                <Input
                  value={attr.label}
                  onChange={(e) => patchAttr(attr, { label: e.target.value })}
                  className="h-7 text-[12px]"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={attr.code}
                  onChange={(e) => patchAttr(attr, { code: e.target.value })}
                  className="h-7 font-mono text-[12px]"
                />
              </TableCell>
              <TableCell>
                <Select
                  value={attr.dataType}
                  onValueChange={(v) => patchAttr(attr, { dataType: v as AttributeDataType })}
                >
                  <SelectTrigger className="h-7 w-28 text-[12px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">text</SelectItem>
                    <SelectItem value="number">number</SelectItem>
                    <SelectItem value="enum">enum</SelectItem>
                    <SelectItem value="multi_enum">multi_enum</SelectItem>
                    <SelectItem value="boolean">boolean</SelectItem>
                  </SelectContent>
                </Select>
              </TableCell>
              <TableCell>
                <Input
                  value={attr.unit ?? ''}
                  onChange={(e) => patchAttr(attr, { unit: e.target.value || undefined })}
                  className="h-7 w-20 text-[12px]"
                />
              </TableCell>
              <TableCell>
                <Input
                  value={attr.options?.join(', ') ?? ''}
                  onChange={(e) =>
                    patchAttr(attr, {
                      options: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  placeholder="逗号分隔"
                  className="h-7 min-w-40 text-[12px]"
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={!!attr.isRequired}
                  onCheckedChange={(v) => patchAttr(attr, { isRequired: v })}
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={attr.isFilterable}
                  onCheckedChange={(v) => patchAttr(attr, { isFilterable: v })}
                />
              </TableCell>
              <TableCell>
                <Switch
                  checked={attr.includeInImport ?? true}
                  onCheckedChange={(v) => patchAttr(attr, { includeInImport: v })}
                />
              </TableCell>
              <TableCell className="text-right">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-[12px] text-rose-600 hover:bg-rose-50"
                  onClick={() => {
                    ctx.removeAttribute(attr.id);
                    toast.success('已删除属性');
                  }}
                >
                  删除
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionShell>
  );
}
