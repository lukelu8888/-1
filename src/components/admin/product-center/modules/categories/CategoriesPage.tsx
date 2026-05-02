import { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Edit, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '../../../../ui/button';
import { Input } from '../../../../ui/input';
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
import type { ProductCategory } from '../../context/types';

export function CategoriesPage() {
  const ctx = useProductCenter();
  const { categories, attributes, upsertCategory, removeCategory } = ctx;

  const tree = useMemo(() => buildTree(categories), [categories]);
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(categories.filter((c) => c.level === 1).map((c) => c.id)),
  );
  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const [active, setActive] = useState<ProductCategory | null>(categories[0] ?? null);

  const onCreate = (parentId: string | null) => {
    const parent = parentId ? categories.find((c) => c.id === parentId) : null;
    const level = (parent ? parent.level + 1 : 1) as 1 | 2 | 3;
    if (level > 3) {
      toast.warning('最多支持 3 级分类');
      return;
    }
    const newCat: ProductCategory = {
      id: `cat_new_${Date.now().toString(36)}`,
      tenantId: 'tenant_default',
      parentId,
      level,
      code: `new.${level}`,
      name: `新分类 L${level}`,
      nameEn: `New L${level} Category`,
      sortOrder: 99,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    upsertCategory(newCat);
    setActive(newCat);
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeading
        title="分类 & 属性 / Category & Attributes"
        subtitle="官网分类树（最多 3 级）+ 属性模板 + 前台筛选器"
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
                onSelect={setActive}
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
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-[12px] text-rose-600 hover:bg-rose-50"
                    onClick={() => {
                      removeCategory(active.id);
                      setActive(null);
                      toast.success('已删除');
                    }}
                  >
                    <Trash2 className="mr-1 h-3.5 w-3.5" /> 删除
                  </Button>
                }
              >
                <FieldRow label="名称 (中文)" required>
                  <Input
                    value={active.name}
                    onChange={(e) => upsertCategory({ ...active, name: e.target.value })}
                    className="h-8"
                  />
                </FieldRow>
                <FieldRow label="名称 (英文)">
                  <Input
                    value={active.nameEn ?? ''}
                    onChange={(e) => upsertCategory({ ...active, nameEn: e.target.value })}
                    className="h-8"
                  />
                </FieldRow>
                <FieldRow label="编码">
                  <Input
                    value={active.code}
                    onChange={(e) => upsertCategory({ ...active, code: e.target.value })}
                    className="h-8 font-mono"
                  />
                </FieldRow>
                <FieldRow label="排序权重">
                  <Input
                    type="number"
                    value={active.sortOrder}
                    onChange={(e) =>
                      upsertCategory({ ...active, sortOrder: Number(e.target.value) || 0 })
                    }
                    className="h-8 w-32 font-mono"
                  />
                </FieldRow>
                <FieldRow label="SEO Title">
                  <Input
                    value={active.seoTitle ?? ''}
                    onChange={(e) => upsertCategory({ ...active, seoTitle: e.target.value })}
                    className="h-8"
                  />
                </FieldRow>
                <FieldRow label="SEO Description">
                  <Input
                    value={active.seoDescription ?? ''}
                    onChange={(e) => upsertCategory({ ...active, seoDescription: e.target.value })}
                    className="h-8"
                  />
                </FieldRow>
              </SectionShell>

              <SectionShell title="属性模板（可前台筛选）" phase="P1">
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
          className="flex flex-1 items-center justify-between"
        >
          <span className="truncate">
            <span className="font-medium text-slate-800">{node.name}</span>
            <span className="ml-1 text-[11px] text-slate-500">{node.nameEn}</span>
          </span>
          <span className="rounded bg-slate-100 px-1 text-[10px] text-slate-500">L{node.level}</span>
        </button>
        {node.level < 3 && (
          <button
            type="button"
            title="添加子级"
            onClick={() => onAddChild(node.id)}
            className="invisible rounded p-0.5 text-slate-500 hover:bg-slate-200 group-hover:visible"
          >
            <Plus className="h-3 w-3" />
          </button>
        )}
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
