import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  FolderOpen,
  GripVertical,
  Layers,
  Package,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Tag,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import {
  createCategoryNode,
  deleteCategoryNodeBranch,
  fetchCategoryTree,
  flattenCategoryTree,
  saveCategoryTreeDraft,
  saveCategoryTree,
  updateCategoryNode,
  type CategoryNode,
} from '../../lib/services/categoryTreeService';
import {
  upsertPimTemplate,
  upsertPimAttribute,
  deletePimAttribute,
  type PimTemplate,
  type PimAttribute,
  type PimAttributeDataType,
} from '../../lib/services/homeDepotPimService';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  STOREFRONT_CATEGORY_TREE_PUBLISHED_EVENT,
  STOREFRONT_CATEGORY_TREE_PUBLISHED_KEY,
} from '../../hooks/useStorefrontDepartments';

const DATA_TYPES: { value: PimAttributeDataType; label: string }[] = [
  { value: 'text', label: '文本' },
  { value: 'number', label: '数值' },
  { value: 'boolean', label: '是/否' },
  { value: 'enum', label: '下拉选项（单选）' },
  { value: 'multi_enum', label: '下拉选项（多选）' },
  { value: 'dimension', label: '尺寸（长×宽×高）' },
];

const DISPLAY_GROUPS = ['Specifications', 'Dimensions', 'Materials', 'Certifications', 'Packaging', 'Other'];

interface AttrForm {
  label: string;
  dataType: PimAttributeDataType;
  unit: string;
  optionsText: string;
  displayGroup: string;
  isRequired: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
}

const emptyForm: AttrForm = {
  label: '',
  dataType: 'text',
  unit: '',
  optionsText: '',
  displayGroup: 'Specifications',
  isRequired: false,
  isFilterable: false,
  isSearchable: false,
};

type EditorMode = 'create-root' | 'create-child' | 'edit' | null;
type TreeDropMode = 'before' | 'inside' | 'after';

interface TreeDropTarget {
  nodeId: string;
  mode: TreeDropMode;
  isReparenting: boolean;
  isGuarded: boolean;
}

const findNodeById = (nodes: CategoryNode[], nodeId: string | null): CategoryNode | null => {
  if (!nodeId) return null;
  const stack = [...nodes];
  while (stack.length > 0) {
    const current = stack.shift()!;
    if (current.id === nodeId) return current;
    stack.unshift(...current.children);
  }
  return null;
};

const countLeafNodes = (nodes: CategoryNode[]): number =>
  flattenCategoryTree(nodes).filter((item) => item.isLeaf).length;

const countDescendantProducts = (node: CategoryNode, counts: Record<string, number>): number => {
  const ownCount = counts[node.id] || 0;
  return ownCount + node.children.reduce((sum, child) => sum + countDescendantProducts(child, counts), 0);
};

const countDescendantTemplates = (node: CategoryNode, templateByCategory: Map<string, PimTemplate>): number => {
  const ownCount = templateByCategory.has(node.id) ? 1 : 0;
  return ownCount + node.children.reduce((sum, child) => sum + countDescendantTemplates(child, templateByCategory), 0);
};

const collectAncestorIds = (nodes: CategoryNode[], targetId: string | null): string[] => {
  if (!targetId) return [];

  const visit = (node: CategoryNode, ancestors: string[]): string[] | null => {
    if (node.id === targetId) return ancestors;
    for (const child of node.children) {
      const result = visit(child, [...ancestors, node.id]);
      if (result) return result;
    }
    return null;
  };

  for (const node of nodes) {
    const result = visit(node, []);
    if (result) return result;
  }
  return [];
};

const nodeHasDescendant = (node: CategoryNode, targetId: string): boolean =>
  node.children.some((child) => child.id === targetId || nodeHasDescendant(child, targetId));

const getNodePath = (nodes: CategoryNode[], targetId: string): CategoryNode[] => {
  const visit = (node: CategoryNode, path: CategoryNode[]): CategoryNode[] | null => {
    const nextPath = [...path, node];
    if (node.id === targetId) return nextPath;
    for (const child of node.children) {
      const result = visit(child, nextPath);
      if (result) return result;
    }
    return null;
  };

  for (const node of nodes) {
    const result = visit(node, []);
    if (result) return result;
  }
  return [];
};

const removeNodeFromTree = (
  nodes: CategoryNode[],
  nodeId: string
): { nodes: CategoryNode[]; removed: CategoryNode | null } => {
  let removed: CategoryNode | null = null;

  const nextNodes = nodes.reduce<CategoryNode[]>((acc, node) => {
    if (node.id === nodeId) {
      removed = node;
      return acc;
    }

    const childResult = removeNodeFromTree(node.children, nodeId);
    if (childResult.removed) {
      removed = childResult.removed;
      acc.push({ ...node, children: childResult.nodes });
      return acc;
    }

    acc.push(node);
    return acc;
  }, []);

  return { nodes: nextNodes, removed };
};

const insertNodeByTarget = (
  nodes: CategoryNode[],
  targetId: string,
  mode: TreeDropMode,
  nodeToInsert: CategoryNode
): CategoryNode[] => {
  if (mode === 'inside') {
    return nodes.map((node) =>
      node.id === targetId
        ? { ...node, children: [...node.children, nodeToInsert] }
        : { ...node, children: insertNodeByTarget(node.children, targetId, mode, nodeToInsert) }
    );
  }

  const nextNodes: CategoryNode[] = [];
  for (const node of nodes) {
    if (node.id === targetId && mode === 'before') nextNodes.push(nodeToInsert);
    nextNodes.push(
      node.children.length > 0
        ? { ...node, children: insertNodeByTarget(node.children, targetId, mode, nodeToInsert) }
        : node
    );
    if (node.id === targetId && mode === 'after') nextNodes.push(nodeToInsert);
  }
  return nextNodes;
};

const normalizeTree = (
  nodes: CategoryNode[],
  parentId: string | null = null,
  depth = 0,
  parentPath: string[] = []
): CategoryNode[] =>
  nodes.map((node, index) => {
    const pathParts = [...parentPath, node.name];
    return {
      ...node,
      parentId,
      depth,
      sortOrder: index + 1,
      path: pathParts.join(' / '),
      children: normalizeTree(node.children, node.id, depth + 1, pathParts),
    };
  });

const getDropMode = (event: React.DragEvent<HTMLElement>): TreeDropMode => {
  const bounds = event.currentTarget.getBoundingClientRect();
  const offsetY = event.clientY - bounds.top;
  if (offsetY < bounds.height * 0.28) return 'before';
  if (offsetY > bounds.height * 0.72) return 'after';
  return 'inside';
};

const getSafeDropTarget = (
  event: React.DragEvent<HTMLElement>,
  nodes: CategoryNode[],
  draggedNode: CategoryNode,
  hoveredNode: CategoryNode
): TreeDropTarget | null => {
  const rawMode = getDropMode(event);
  if (rawMode === 'inside') {
    return { nodeId: hoveredNode.id, mode: 'inside', isReparenting: true, isGuarded: false };
  }

  const hoveredPath = getNodePath(nodes, hoveredNode.id);
  const sameDepthTarget = hoveredPath[draggedNode.depth] || hoveredPath[hoveredPath.length - 1];
  if (!sameDepthTarget) return null;

  const mode = rawMode === 'before' ? 'before' : 'after';
  return {
    nodeId: sameDepthTarget.id,
    mode,
    isReparenting: sameDepthTarget.parentId !== draggedNode.parentId,
    isGuarded: rawMode === 'inside' || sameDepthTarget.id !== hoveredNode.id,
  };
};

export default function CategoryAttributeManager() {
  const [tree, setTree] = useState<CategoryNode[]>([]);
  const [templates, setTemplates] = useState<PimTemplate[]>([]);
  const [attributes, setAttributes] = useState<PimAttribute[]>([]);
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  const [expandedIds, setExpandedIds] = useState<string[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<TreeDropTarget | null>(null);
  const [sortingSaving, setSortingSaving] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [publishSaving, setPublishSaving] = useState(false);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);
  const [lastPublishedAt, setLastPublishedAt] = useState<string | null>(null);

  const [editorMode, setEditorMode] = useState<EditorMode>(null);
  const [nodeForm, setNodeForm] = useState({
    name: '',
    description: '',
    sortOrder: '100',
  });
  const [nodeSaving, setNodeSaving] = useState(false);

  const [form, setForm] = useState<AttrForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async (preferredSelectedId?: string | null) => {
    setLoading(true);
    try {
      const [nextTree, tmplRes, attrRes, prodRes] = await Promise.all([
        fetchCategoryTree(),
        supabase.from('category_attribute_templates').select('*'),
        supabase.from('category_attributes').select('*').order('display_order'),
        supabase.from('products').select('category_id'),
      ]);

      setTree(nextTree);
      setTemplates((tmplRes.data || []) as PimTemplate[]);
      setAttributes((attrRes.data || []) as PimAttribute[]);

      const counts: Record<string, number> = {};
      for (const row of prodRes.data || []) {
        if (row.category_id) counts[row.category_id] = (counts[row.category_id] || 0) + 1;
      }
      setProductCounts(counts);

      const flat = flattenCategoryTree(nextTree);
      setSelectedNodeId((currentSelectedId) =>
        preferredSelectedId && flat.some((item) => item.id === preferredSelectedId)
          ? preferredSelectedId
          : currentSelectedId && flat.some((item) => item.id === currentSelectedId)
            ? currentSelectedId
            : flat[0]?.id || null
      );

      if (preferredSelectedId) {
        const ancestorIds = collectAncestorIds(nextTree, preferredSelectedId);
        setExpandedIds((current) => Array.from(new Set([...current, ...ancestorIds])));
      }
    } catch (error) {
      toast.error('加载分类失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const flatNodes = useMemo(() => flattenCategoryTree(tree), [tree]);
  const selectedNode = useMemo(() => findNodeById(tree, selectedNodeId), [tree, selectedNodeId]);
  const selectedNodePath = selectedNode?.path || '';
  const isLeafSelection = Boolean(selectedNode && selectedNode.children.length === 0 && selectedNode.depth >= 2);

  const templateByCategory = useMemo(() => {
    const map = new Map<string, PimTemplate>();
    for (const template of templates) map.set(template.category_id, template);
    return map;
  }, [templates]);

  const templateForSelected = selectedNode ? templateByCategory.get(selectedNode.id) || null : null;
  const attrsForSelected = useMemo(() => {
    if (!templateForSelected) return [];
    return attributes.filter((item) => item.template_id === templateForSelected.id);
  }, [attributes, templateForSelected]);

  const toggleExpanded = (nodeId: string) => {
    setExpandedIds((current) =>
      current.includes(nodeId) ? current.filter((item) => item !== nodeId) : [...current, nodeId]
    );
  };

  const resetTreeDrag = () => {
    setDraggedNodeId(null);
    setDropTarget(null);
  };

  const handleTreeDrop = async (targetNodeId: string, mode: TreeDropMode) => {
    if (!draggedNodeId || draggedNodeId === targetNodeId || sortingSaving) {
      resetTreeDrag();
      return;
    }

    const draggedNode = findNodeById(tree, draggedNodeId);
    const targetNode = findNodeById(tree, targetNodeId);
    if (!draggedNode || !targetNode) {
      resetTreeDrag();
      return;
    }

    if (nodeHasDescendant(draggedNode, targetNodeId)) {
      toast.error('不能把类目拖到自己的下级里面');
      resetTreeDrag();
      return;
    }

    const { nodes: treeWithoutDragged, removed } = removeNodeFromTree(tree, draggedNodeId);
    if (!removed) {
      resetTreeDrag();
      return;
    }

    const nextTree = normalizeTree(insertNodeByTarget(treeWithoutDragged, targetNodeId, mode, removed));

    setTree(nextTree);
    if (mode === 'inside') {
      setExpandedIds((current) => Array.from(new Set([...current, targetNodeId])));
    }
    resetTreeDrag();
    setSortingSaving(true);
    try {
      await saveCategoryTreeDraft(nextTree);
      setHasDraftChanges(true);
      toast.success('分类位置草稿已保存');
    } catch (error) {
      toast.error('保存分类位置草稿失败，已重新加载');
      await load(selectedNodeId);
    } finally {
      setSortingSaving(false);
    }
  };

  const openCreateRoot = () => {
    setEditorMode('create-root');
    setNodeForm({ name: '', description: '', sortOrder: String(tree.length + 1) });
  };

  const openCreateChild = () => {
    if (!selectedNode) {
      toast.error('请先选择父级类目');
      return;
    }
    setEditorMode('create-child');
    setNodeForm({
      name: '',
      description: '',
      sortOrder: String(selectedNode.children.length + 1 || 1),
    });
    setExpandedIds((current) => Array.from(new Set([...current, selectedNode.id])));
  };

  const openEditNode = () => {
    if (!selectedNode) {
      toast.error('请先选择一个类目');
      return;
    }
    setEditorMode('edit');
    setNodeForm({
      name: selectedNode.name,
      description: selectedNode.description || '',
      sortOrder: String(selectedNode.sortOrder || 100),
    });
  };

  const resetNodeEditor = () => {
    setEditorMode(null);
    setNodeForm({ name: '', description: '', sortOrder: '100' });
  };

  const syncAndReload = async (preferredSelectedId?: string | null) => {
    await load(preferredSelectedId);
  };

  const announceStorefrontCategoryPublish = () => {
    const detail = { publishedAt: new Date().toISOString(), tree };
    window.localStorage.setItem(STOREFRONT_CATEGORY_TREE_PUBLISHED_KEY, JSON.stringify(detail));
    window.dispatchEvent(new CustomEvent(STOREFRONT_CATEGORY_TREE_PUBLISHED_EVENT, { detail }));
  };

  const handleSaveDraft = async () => {
    setDraftSaving(true);
    try {
      await saveCategoryTreeDraft(tree);
      setHasDraftChanges(true);
      toast.success('分类草稿已保存');
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      toast.error(`保存分类草稿失败: ${message}`);
    } finally {
      setDraftSaving(false);
    }
  };

  const handlePublishToStorefront = async () => {
    setPublishSaving(true);
    try {
      await saveCategoryTree(tree);
      const publishedAt = new Date().toISOString();
      setLastPublishedAt(publishedAt);
      setHasDraftChanges(false);
      announceStorefrontCategoryPublish();
      toast.success('分类已发布到前端');
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      toast.error(`发布到前端失败: ${message}`);
    } finally {
      setPublishSaving(false);
    }
  };

  const handleNodeSave = async () => {
    const name = nodeForm.name.trim();
    if (!name) {
      toast.error('类目名称不能为空');
      return;
    }

    setNodeSaving(true);
    try {
      if (editorMode === 'edit' && selectedNode) {
        await updateCategoryNode(selectedNode.id, {
          name,
          description: nodeForm.description,
          sort_order: Number(nodeForm.sortOrder || 100),
        });
        await syncAndReload(selectedNode.id);
        setHasDraftChanges(true);
        toast.success('类目已更新');
      } else {
        const created = await createCategoryNode({
          name,
          parentId: editorMode === 'create-child' ? selectedNode?.id || null : null,
          description: nodeForm.description,
          sortOrder: Number(nodeForm.sortOrder || 100),
        });
        await syncAndReload(created.id);
        setHasDraftChanges(true);
        toast.success(editorMode === 'create-root' ? '已新增顶级分类' : '已新增子分类');
      }
      resetNodeEditor();
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      toast.error(`保存类目失败: ${message}`);
    } finally {
      setNodeSaving(false);
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNode) {
      toast.error('请先选择一个类目');
      return;
    }

    const confirmed = window.confirm(`确认删除类目“${selectedNode.name}”及其所有下级吗？`);
    if (!confirmed) return;

    setNodeSaving(true);
    try {
      const fallbackSelectedId = selectedNode.parentId;
      await deleteCategoryNodeBranch(selectedNode.id);
      await syncAndReload(fallbackSelectedId);
      setHasDraftChanges(true);
      toast.success('类目已删除');
      resetNodeEditor();
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      toast.error(`删除失败: ${message}`);
    } finally {
      setNodeSaving(false);
    }
  };

  const handleSaveAttribute = async () => {
    if (!selectedNode || !isLeafSelection) {
      toast.error('请先选择可挂 SKU 的末级类目');
      return;
    }
    if (!form.label.trim()) {
      toast.error('属性名称不能为空');
      return;
    }

    setSaving(true);
    try {
      let template = templateByCategory.get(selectedNode.id) || null;
      if (!template) {
        template = await upsertPimTemplate({
          categoryId: selectedNode.id,
          templateName: `${selectedNode.name} Attributes`,
          status: 'active',
          versionNo: 1,
          requiredScoreThreshold: 80,
        });
      }

      const maxOrder = attrsForSelected.length ? Math.max(...attrsForSelected.map((item) => item.display_order)) : 0;

      await upsertPimAttribute({
        id: editingId || undefined,
        templateId: template.id,
        attributeKey: form.label,
        label: form.label,
        dataType: form.dataType,
        unit: form.unit,
        optionsText: form.optionsText,
        displayGroup: form.displayGroup,
        isRequired: form.isRequired,
        isFilterable: form.isFilterable,
        isSearchable: form.isSearchable,
        isCompliance: false,
        displayOrder: editingId
          ? (attrsForSelected.find((item) => item.id === editingId)?.display_order ?? maxOrder + 1)
          : maxOrder + 1,
      });

      toast.success(editingId ? '属性已更新' : '属性已添加');
      setForm(emptyForm);
      setEditingId(null);
      await load(selectedNode.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : '未知错误';
      toast.error(`保存属性失败: ${message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditAttribute = (attr: PimAttribute) => {
    setEditingId(attr.id);
    setForm({
      label: attr.label,
      dataType: attr.data_type,
      unit: attr.unit ?? '',
      optionsText: Array.isArray(attr.options) ? attr.options.join(', ') : '',
      displayGroup: attr.display_group,
      isRequired: attr.is_required,
      isFilterable: attr.is_filterable,
      isSearchable: attr.is_searchable,
    });
  };

  const handleDeleteAttribute = async (attrId: string) => {
    if (!window.confirm('确认删除该属性？')) return;
    try {
      await deletePimAttribute(attrId);
      toast.success('属性已删除');
      await load(selectedNodeId);
    } catch {
      toast.error('删除失败');
    }
  };

  const setAttr = (key: keyof AttrForm, value: string | boolean) =>
    setForm((current) => ({ ...current, [key]: value }));

  const renderNode = (node: CategoryNode) => {
    const expanded = expandedIds.includes(node.id);
    const selected = selectedNodeId === node.id;
    const productCount = countDescendantProducts(node, productCounts);
    const templateCount = countDescendantTemplates(node, templateByCategory);
    const canExpand = node.children.length > 0;
    const isDragging = draggedNodeId === node.id;
    const isDropTarget = dropTarget?.nodeId === node.id && draggedNodeId !== node.id;

    const insertionLineStyle = {
      left: `${node.depth * 14 + 12}px`,
      right: '12px',
    };

    return (
      <div key={node.id} className="relative space-y-1">
        {isDropTarget && dropTarget?.mode === 'before' && (
          <span
            className="pointer-events-none absolute top-[-3px] z-20 h-0.5 rounded-full bg-red-500 shadow-[0_0_0_2px_rgba(254,226,226,0.9)]"
            style={insertionLineStyle}
          />
        )}
        {isDropTarget && dropTarget?.mode === 'after' && (
          <span
            className="pointer-events-none absolute bottom-[-3px] z-20 h-0.5 rounded-full bg-red-500 shadow-[0_0_0_2px_rgba(254,226,226,0.9)]"
            style={insertionLineStyle}
          />
        )}
        <div
          role="button"
          tabIndex={0}
          draggable={!sortingSaving}
          onClick={() => {
            setSelectedNodeId(node.id);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              setSelectedNodeId(node.id);
            }
          }}
          onDragStart={(event) => {
            if (sortingSaving) return;
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/plain', node.id);
            setDraggedNodeId(node.id);
          }}
          onDragOver={(event) => {
            if (!draggedNodeId || draggedNodeId === node.id) return;
            const draggedNode = findNodeById(tree, draggedNodeId);
            if (!draggedNode || nodeHasDescendant(draggedNode, node.id)) return;
            const nextDropTarget = getSafeDropTarget(event, tree, draggedNode, node);
            if (!nextDropTarget) return;
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            setDropTarget(nextDropTarget);
          }}
          onDragLeave={() => {
            if (dropTarget?.nodeId === node.id) setDropTarget(null);
          }}
          onDrop={(event) => {
            event.preventDefault();
            if (!dropTarget) return;
            void handleTreeDrop(dropTarget.nodeId, dropTarget.mode);
          }}
          onDragEnd={resetTreeDrag}
          className={[
            'cursor-pointer',
            'relative flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm transition-colors',
            isDragging ? 'opacity-50' : '',
            isDropTarget && dropTarget?.mode === 'inside' ? 'border-dashed border-blue-500 bg-blue-50/70 ring-2 ring-blue-100' : '',
            selected ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-transparent text-gray-700 hover:bg-gray-50',
          ].join(' ')}
          style={{ paddingLeft: `${node.depth * 14 + 10}px` }}
        >
          <GripVertical className="h-3.5 w-3.5 shrink-0 cursor-grab text-gray-300 active:cursor-grabbing" />
          {canExpand ? (
            <button
              type="button"
              aria-label={expanded ? '收起分类' : '展开分类'}
              aria-expanded={expanded}
              className="flex h-5 w-5 shrink-0 items-center justify-center rounded hover:bg-white/70"
              onClick={(event) => {
                event.stopPropagation();
                toggleExpanded(node.id);
              }}
            >
              {expanded ? <ChevronDown className="h-3.5 w-3.5 shrink-0" /> : <ChevronRight className="h-3.5 w-3.5 shrink-0" />}
            </button>
          ) : (
            <span className="inline-block h-5 w-5 shrink-0" />
          )}
          <Package className="h-3.5 w-3.5 shrink-0 text-gray-300" />
          <span className="min-w-0 flex-1 truncate">{node.name}</span>
          {productCount > 0 && <span className="text-[11px] text-gray-400">{productCount}p</span>}
          {templateCount > 0 && <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">{templateCount}t</span>}
        </div>
        {expanded && node.children.length > 0 && (
          <div className="space-y-1">
            {node.children.map((child) => renderNode(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex gap-5 pb-6" style={{ minHeight: 700 }}>
      <div className="w-80 shrink-0">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
            <Layers className="h-4 w-4 text-gray-400" />
            分类树
          </h3>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => void handleSaveDraft()}
              disabled={loading || draftSaving || publishSaving || tree.length === 0}
            >
              <Save className="mr-1 h-3.5 w-3.5" />
              {draftSaving ? '保存中' : '保存'}
            </Button>
            <Button
              size="sm"
              className="h-8 px-2 text-xs"
              onClick={() => void handlePublishToStorefront()}
              disabled={loading || draftSaving || publishSaving || tree.length === 0}
            >
              <Upload className="mr-1 h-3.5 w-3.5" />
              {publishSaving ? '发布中' : '发布'}
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={openCreateRoot}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => void load()} disabled={loading}>
              <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>

        <Card className="border-gray-200">
          <CardContent className="p-3">
            {loading ? (
              <div className="py-10 text-center text-xs text-gray-400">加载中...</div>
            ) : tree.length === 0 ? (
              <div className="py-10 text-center text-xs text-gray-400">暂无分类数据，请先新增顶级分类</div>
            ) : (
              <div className="space-y-1">{tree.map((node) => renderNode(node))}</div>
            )}

            <div className="mt-4 space-y-1 border-t border-gray-100 pt-3 text-xs text-gray-400">
              <div className="flex justify-between">
                <span>发布状态</span>
                <span className={hasDraftChanges ? 'text-amber-600' : 'text-emerald-600'}>
                  {hasDraftChanges ? '草稿待发布' : '已发布'}
                </span>
              </div>
              {lastPublishedAt && (
                <div className="flex justify-between"><span>最近发布</span><span>{new Date(lastPublishedAt).toLocaleString()}</span></div>
              )}
              <div className="flex justify-between"><span>顶级分类</span><span>{tree.length}</span></div>
              <div className="flex justify-between"><span>全部节点</span><span>{flatNodes.length}</span></div>
              <div className="flex justify-between"><span>末级类目</span><span>{countLeafNodes(tree)}</span></div>
              <div className="flex justify-between"><span>属性总数</span><span>{attributes.length}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 min-w-0 space-y-4">
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold text-gray-900">
                  {selectedNode ? selectedNode.name : '类目维护中心'}
                </CardTitle>
                <p className="mt-1 text-xs text-gray-500">
                  {selectedNode
                    ? `${selectedNodePath} · 第 ${selectedNode.depth + 1} 级`
                    : '支持新增任意层级类目。选择一个节点后，可继续往下扩展四级、五级甚至更深层级。'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" className="h-8" onClick={openCreateRoot}>
                  <Plus className="mr-1 h-3.5 w-3.5" />新增顶级类目
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={openCreateChild} disabled={!selectedNode}>
                  <Plus className="mr-1 h-3.5 w-3.5" />新增下级
                </Button>
                <Button variant="outline" size="sm" className="h-8" onClick={openEditNode} disabled={!selectedNode}>
                  <Pencil className="mr-1 h-3.5 w-3.5" />编辑类目
                </Button>
                <Button variant="outline" size="sm" className="h-8 text-red-600" onClick={() => void handleDeleteNode()} disabled={!selectedNode || nodeSaving}>
                  <Trash2 className="mr-1 h-3.5 w-3.5" />删除类目
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedNode && (
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">节点 ID: {selectedNode.id}</Badge>
                <Badge variant="outline">下级 {selectedNode.children.length}</Badge>
                <Badge variant="outline">SKU {countDescendantProducts(selectedNode, productCounts)}</Badge>
                <Badge variant="outline">模板 {countDescendantTemplates(selectedNode, templateByCategory)}</Badge>
                {selectedNode.children.length === 0 ? (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">末级类目</Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">中间节点</Badge>
                )}
              </div>
            )}

            {editorMode && (
              <div className="grid gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 md:grid-cols-2">
                <div className="md:col-span-2 flex items-center justify-between">
                  <div className="text-sm font-semibold text-blue-900">
                    {editorMode === 'edit' ? '编辑类目' : editorMode === 'create-root' ? '新增顶级类目' : '新增下级类目'}
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={resetNodeEditor}>
                    <X className="mr-1 h-3.5 w-3.5" />取消
                  </Button>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">类目名称 *</Label>
                  <Input
                    className="mt-1 h-9"
                    value={nodeForm.name}
                    onChange={(event) => setNodeForm((current) => ({ ...current, name: event.target.value }))}
                    placeholder="例如：Countertop Dishwashers"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">排序</Label>
                  <Input
                    className="mt-1 h-9"
                    type="number"
                    value={nodeForm.sortOrder}
                    onChange={(event) => setNodeForm((current) => ({ ...current, sortOrder: event.target.value }))}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-xs text-gray-600">描述</Label>
                  <Input
                    className="mt-1 h-9"
                    value={nodeForm.description}
                    onChange={(event) => setNodeForm((current) => ({ ...current, description: event.target.value }))}
                    placeholder="可选，用于补充类目说明"
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button size="sm" className="h-8" onClick={() => void handleNodeSave()} disabled={nodeSaving}>
                    <Save className="mr-1 h-3.5 w-3.5" />
                    {nodeSaving ? '保存中...' : '保存类目'}
                  </Button>
                </div>
              </div>
            )}

            {!selectedNode && (
              <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center text-sm text-gray-500">
                先从左侧选择一个类目，或者直接新增顶级类目。
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Tag className="h-4 w-4 text-blue-500" />
              属性方案
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!selectedNode ? (
              <div className="flex items-center justify-center rounded-lg border border-dashed border-gray-200 bg-gray-50 py-10">
                <div className="text-center">
                  <FolderOpen className="mx-auto mb-2 h-8 w-8 text-gray-300" />
                  <p className="text-sm font-medium text-gray-500">请选择类目</p>
                  <p className="mt-1 text-xs text-gray-400">选中一个末级类目后，才能为它配置属性模板。</p>
                </div>
              </div>
            ) : !isLeafSelection ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                当前选择的是中间节点。为了保证 SKU 分类清晰，请继续选择最末级类目，再配置属性模板。
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{selectedNode.name}</div>
                    <div className="mt-1 text-xs text-gray-500">
                      {selectedNodePath} · {productCounts[selectedNode.id] || 0} 个产品 · {attrsForSelected.length} 个属性
                    </div>
                  </div>
                  {templateForSelected && (
                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">模板已启用</Badge>
                  )}
                </div>

                <Card className={editingId ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-semibold text-gray-700">{editingId ? '编辑属性' : '新增属性'}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="col-span-2">
                        <Label className="text-xs text-gray-600">属性名称 *</Label>
                        <Input
                          className="mt-1 h-8 text-sm"
                          value={form.label}
                          onChange={(event) => setAttr('label', event.target.value)}
                          placeholder="如：材质、容量、颜色"
                        />
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">数据类型</Label>
                        <select
                          className="mt-1 h-8 w-full rounded border border-gray-200 bg-white px-2 text-xs focus:outline-none"
                          value={form.dataType}
                          onChange={(event) => setAttr('dataType', event.target.value as PimAttributeDataType)}
                        >
                          {DATA_TYPES.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <Label className="text-xs text-gray-600">单位（可选）</Label>
                        <Input
                          className="mt-1 h-8 text-sm"
                          value={form.unit}
                          onChange={(event) => setAttr('unit', event.target.value)}
                          placeholder="如：kg、mm、立方英尺"
                        />
                      </div>

                      {(form.dataType === 'enum' || form.dataType === 'multi_enum') && (
                        <div className="col-span-2 sm:col-span-4">
                          <Label className="text-xs text-gray-600">选项（英文逗号分隔）</Label>
                          <Input
                            className="mt-1 h-8 text-sm"
                            value={form.optionsText}
                            onChange={(event) => setAttr('optionsText', event.target.value)}
                            placeholder="如：White, Black, Stainless Steel"
                          />
                        </div>
                      )}

                      <div>
                        <Label className="text-xs text-gray-600">显示分组</Label>
                        <select
                          className="mt-1 h-8 w-full rounded border border-gray-200 bg-white px-2 text-xs focus:outline-none"
                          value={form.displayGroup}
                          onChange={(event) => setAttr('displayGroup', event.target.value)}
                        >
                          {DISPLAY_GROUPS.map((group) => (
                            <option key={group} value={group}>{group}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col justify-center gap-1.5 pt-1">
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={form.isRequired}
                            onChange={(event) => setAttr('isRequired', event.target.checked)}
                            className="rounded"
                          />
                          必填
                        </label>
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={form.isFilterable}
                            onChange={(event) => setAttr('isFilterable', event.target.checked)}
                            className="rounded"
                          />
                          筛选项
                        </label>
                        <label className="flex cursor-pointer items-center gap-1.5 text-xs text-gray-600">
                          <input
                            type="checkbox"
                            checked={form.isSearchable}
                            onChange={(event) => setAttr('isSearchable', event.target.checked)}
                            className="rounded"
                          />
                          可搜索
                        </label>
                      </div>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      {editingId && (
                        <Button variant="ghost" size="sm" className="h-7" onClick={() => { setForm(emptyForm); setEditingId(null); }}>
                          <X className="mr-1 h-3.5 w-3.5" />取消
                        </Button>
                      )}
                      <Button size="sm" className="h-7" disabled={saving || !form.label.trim()} onClick={() => void handleSaveAttribute()}>
                        {saving ? '保存中...' : editingId ? <><Save className="mr-1 h-3.5 w-3.5" />更新</> : <><Plus className="mr-1 h-3.5 w-3.5" />添加属性</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-xs font-semibold text-gray-700">
                      <span>属性方案（{attrsForSelected.length}）</span>
                      {attrsForSelected.length === 0 && <span className="font-normal text-gray-400">暂无属性，请在上方添加</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    {attrsForSelected.length > 0 && (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-4">属性名</TableHead>
                            <TableHead>类型</TableHead>
                            <TableHead>分组</TableHead>
                            <TableHead>标记</TableHead>
                            <TableHead>选项 / 单位</TableHead>
                            <TableHead className="w-20" />
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {attrsForSelected.map((attr) => (
                            <TableRow key={attr.id} className={editingId === attr.id ? 'bg-blue-50' : ''}>
                              <TableCell className="pl-4">
                                <div className="font-medium text-sm">{attr.label}</div>
                                <div className="font-mono text-xs text-gray-400">{attr.attribute_key}</div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px] capitalize">
                                  {DATA_TYPES.find((item) => item.value === attr.data_type)?.label ?? attr.data_type}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-gray-500">{attr.display_group}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {attr.is_required && <Badge variant="destructive" className="px-1 py-0 text-[9px]">必填</Badge>}
                                  {attr.is_filterable && <Badge variant="secondary" className="px-1 py-0 text-[9px]">筛选</Badge>}
                                  {attr.is_searchable && <Badge className="bg-blue-100 px-1 py-0 text-[9px] text-blue-700 hover:bg-blue-100">搜索</Badge>}
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[120px] text-xs text-gray-500">
                                {attr.unit ? (
                                  <span className="text-gray-600">单位: {attr.unit}</span>
                                ) : Array.isArray(attr.options) && attr.options.length > 0 ? (
                                  <span className="block truncate">{(attr.options as string[]).join(', ')}</span>
                                ) : '—'}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => handleEditAttribute(attr)}>
                                    编辑
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-400 hover:text-red-600" onClick={() => void handleDeleteAttribute(attr.id)}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
