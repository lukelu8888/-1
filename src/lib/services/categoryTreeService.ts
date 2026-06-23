import type { MainCategory } from '@/data/productData';
import { supabase } from '@/lib/supabase';
import { toRegionCode } from '@/lib/supabaseService';

export interface CategoryNodeRow {
  id: string;
  name: string;
  parent_id: string | null;
  description: string | null;
  sort_order: number;
  region_code?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CategoryNode {
  id: string;
  name: string;
  parentId: string | null;
  description?: string;
  sortOrder: number;
  regionCode?: string | null;
  depth: number;
  path: string;
  children: CategoryNode[];
}

export interface CategoryPathEntry {
  id: string;
  name: string;
  path: string;
  depth: number;
  rootId: string;
  rootName: string;
  secondLevelId: string | null;
  secondLevelName: string | null;
  isLeaf: boolean;
}

type LegacyMainRow = {
  id: string;
  name: string;
  icon?: string | null;
  description?: string | null;
  sort_order: number;
  region_code?: string | null;
};

type LegacySubRow = {
  id: string;
  main_category_id: string;
  name: string;
  description?: string | null;
  sort_order: number;
  region_code?: string | null;
};

type LegacyLeafRow = {
  id: string;
  sub_category_id: string;
  name: string;
  description?: string | null;
  sort_order: number;
  region_code?: string | null;
};

const db = supabase as any;

const normalizeRegionCode = (value?: string | null) => {
  if (!value) return null;
  return toRegionCode(value) || value;
};

const compareRegion = (rowRegion?: string | null, targetRegion?: string | null) => {
  const normalizedTarget = normalizeRegionCode(targetRegion);
  const normalizedRow = normalizeRegionCode(rowRegion);
  if (!normalizedTarget) return true;
  return normalizedRow === null || normalizedRow === normalizedTarget;
};

const slugify = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);

const sortRows = <T extends { sort_order?: number; name?: string | null }>(rows: T[]) =>
  [...rows].sort((a, b) => {
    const orderDelta = Number(a.sort_order || 0) - Number(b.sort_order || 0);
    if (orderDelta !== 0) return orderDelta;
    return String(a.name || '').localeCompare(String(b.name || ''));
  });

const flattenRows = (nodes: CategoryNode[]): CategoryNodeRow[] => {
  const rows: CategoryNodeRow[] = [];
  const visit = (node: CategoryNode) => {
    rows.push({
      id: node.id,
      name: node.name,
      parent_id: node.parentId,
      description: node.description ?? null,
      sort_order: node.sortOrder,
      region_code: node.regionCode ?? null,
    });
    for (const child of node.children) visit(child);
  };
  for (const node of nodes) visit(node);
  return rows;
};

export const buildCategoryTree = (rows: CategoryNodeRow[]): CategoryNode[] => {
  const sortedRows = sortRows(rows);
  const childrenByParent = new Map<string | null, CategoryNodeRow[]>();
  for (const row of sortedRows) {
    const key = row.parent_id || null;
    const list = childrenByParent.get(key) || [];
    list.push(row);
    childrenByParent.set(key, list);
  }

  const buildBranch = (
    row: CategoryNodeRow,
    depth: number,
    parentPath: string[]
  ): CategoryNode => {
    const pathParts = [...parentPath, row.name];
    const children = (childrenByParent.get(row.id) || []).map((child) => buildBranch(child, depth + 1, pathParts));
    return {
      id: row.id,
      name: row.name,
      parentId: row.parent_id,
      description: row.description ?? undefined,
      sortOrder: Number(row.sort_order || 0),
      regionCode: row.region_code ?? null,
      depth,
      path: pathParts.join(' / '),
      children,
    };
  };

  return (childrenByParent.get(null) || []).map((row) => buildBranch(row, 0, []));
};

const legacyRowsToTree = (
  mains: LegacyMainRow[],
  subs: LegacySubRow[],
  leaves: LegacyLeafRow[],
  regionCode?: string | null
): CategoryNode[] => {
  const filteredMains = sortRows(mains.filter((row) => compareRegion(row.region_code, regionCode)));
  const filteredSubs = sortRows(subs.filter((row) => compareRegion(row.region_code, regionCode)));
  const filteredLeaves = sortRows(leaves.filter((row) => compareRegion(row.region_code, regionCode)));

  const rankedRows: Array<CategoryNodeRow & { depthRank: number }> = [
    ...filteredMains.map((row) => ({
      id: row.id,
      name: row.name,
      parent_id: null,
      description: row.description ?? null,
      sort_order: row.sort_order,
      region_code: row.region_code ?? null,
      depthRank: 1,
    })),
    ...filteredSubs.map((row) => ({
      id: row.id,
      name: row.name,
      parent_id: row.main_category_id,
      description: row.description ?? null,
      sort_order: row.sort_order,
      region_code: row.region_code ?? null,
      depthRank: 2,
    })),
    ...filteredLeaves.map((row) => ({
      id: row.id,
      name: row.name,
      parent_id: row.sub_category_id,
      description: row.description ?? null,
      sort_order: row.sort_order,
      region_code: row.region_code ?? null,
      depthRank: 3,
    })),
  ];

  const dedupedRows = new Map<string, CategoryNodeRow & { depthRank: number }>();
  for (const row of rankedRows) {
    const existing = dedupedRows.get(row.id);
    if (!existing || row.depthRank >= existing.depthRank) {
      dedupedRows.set(row.id, row);
    }
  }

  return buildCategoryTree(Array.from(dedupedRows.values()));
};

const collectLeafRowsForLegacySync = (
  nodes: CategoryNode[],
  rootId: string,
  secondLevelId: string,
  tail: string[] = []
): Array<{
  id: string;
  rootId: string;
  secondLevelId: string;
  name: string;
  description?: string;
  sortOrder: number;
}> => {
  const rows: Array<{
    id: string;
    rootId: string;
    secondLevelId: string;
    name: string;
    description?: string;
    sortOrder: number;
  }> = [];

  for (const node of nodes) {
    const nextTail = [...tail, node.name];
    if (node.children.length === 0) {
      rows.push({
        id: node.id,
        rootId,
        secondLevelId,
        name: nextTail.join(' / '),
        description: node.description,
        sortOrder: node.sortOrder,
      });
      continue;
    }
    rows.push(...collectLeafRowsForLegacySync(node.children, rootId, secondLevelId, nextTail));
  }

  return rows;
};

const buildLegacyRowsFromTree = (nodes: CategoryNode[], regionCode?: string | null) => {
  const normalizedRegion = normalizeRegionCode(regionCode);

  const mainRows = nodes.map((node, index) => ({
    id: node.id,
    name: node.name,
    icon: 'Package',
    description: node.description ?? null,
    sort_order: index + 1,
    region_code: normalizedRegion,
  }));

  const subRows: LegacySubRow[] = [];
  const leafRows: LegacyLeafRow[] = [];

  nodes.forEach((root, rootIndex) => {
    root.children.forEach((child, childIndex) => {
      subRows.push({
        id: child.id,
        main_category_id: root.id,
        name: child.name,
        description: child.description ?? null,
        sort_order: childIndex + 1,
        region_code: normalizedRegion,
      });

      const descendantLeaves =
        child.children.length === 0
          ? [
              {
                id: child.id,
                rootId: root.id,
                secondLevelId: child.id,
                name: child.name,
                description: child.description,
                sortOrder: child.sortOrder,
              },
            ]
          : collectLeafRowsForLegacySync(child.children, root.id, child.id);

      descendantLeaves.forEach((leaf, leafIndex) => {
        leafRows.push({
          id: leaf.id,
          sub_category_id: child.id,
          name: leaf.name,
          description: leaf.description ?? null,
          sort_order: leafIndex + 1,
          region_code: normalizedRegion,
        });
      });
    });
  });

  return { mainRows, subRows, leafRows };
};

export const flattenCategoryTree = (nodes: CategoryNode[]): CategoryPathEntry[] => {
  const flat: CategoryPathEntry[] = [];

  const visit = (
    node: CategoryNode,
    root: CategoryNode,
    secondLevel: CategoryNode | null
  ) => {
    flat.push({
      id: node.id,
      name: node.name,
      path: node.path,
      depth: node.depth,
      rootId: root.id,
      rootName: root.name,
      secondLevelId: secondLevel?.id ?? null,
      secondLevelName: secondLevel?.name ?? null,
      isLeaf: node.children.length === 0,
    });

    for (const child of node.children) {
      visit(child, root, node.depth === 0 ? child : secondLevel);
    }
  };

  for (const root of nodes) visit(root, root, null);
  return flat;
};

export const buildLegacyCatalogFromCategoryTree = (nodes: CategoryNode[]): MainCategory[] => {
  return nodes.map((root) => ({
    id: root.id,
    name: root.name,
    icon: 'Package',
    description: root.description,
    subCategories: root.children.map((child) => {
      const leafRows =
        child.children.length === 0
          ? [{ id: child.id, name: child.name, description: child.description }]
          : collectLeafRowsForLegacySync(child.children, root.id, child.id).map((leaf) => ({
              id: leaf.id,
              name: leaf.name,
              description: leaf.description,
            }));

      return {
        id: child.id,
        name: child.name,
        description: child.description,
        productCategories: leafRows.map((leaf) => ({
          id: leaf.id,
          name: leaf.name,
          description: leaf.description,
          products: [],
        })),
      };
    }),
  }));
};

export async function fetchCategoryTree(regionCodeOverride?: string | null): Promise<CategoryNode[]> {
  const regionCode = normalizeRegionCode(regionCodeOverride);
  let canonicalTreeError: unknown = null;

  try {
    const { data, error } = await db.from('product_category_nodes').select('*').order('sort_order');
    if (!error && Array.isArray(data) && data.length > 0) {
      const rows = (data as CategoryNodeRow[]).filter((row) => compareRegion(row.region_code, regionCode));
      return buildCategoryTree(rows);
    }
    if (error) canonicalTreeError = error;
  } catch (error) {
    canonicalTreeError = error;
  }

  const [mainRes, subRes, leafRes] = await Promise.all([
    supabase.from('product_main_categories').select('*').order('sort_order'),
    supabase.from('product_sub_categories').select('*').order('sort_order'),
    supabase.from('product_categories').select('*').order('sort_order'),
  ]);

  if (mainRes.error) throw mainRes.error;
  if (subRes.error) throw subRes.error;
  if (leafRes.error) throw leafRes.error;

  const legacyTree = legacyRowsToTree(
    (mainRes.data || []) as LegacyMainRow[],
    (subRes.data || []) as LegacySubRow[],
    (leafRes.data || []) as LegacyLeafRow[],
    regionCode
  );
  if (canonicalTreeError) {
    console.warn('product_category_nodes unavailable; using legacy category tables.', canonicalTreeError);
  }
  return legacyTree;
}

export async function fetchPublishedCategoryTree(regionCodeOverride?: string | null): Promise<CategoryNode[]> {
  const regionCode = normalizeRegionCode(regionCodeOverride);
  const [mainRes, subRes, leafRes] = await Promise.all([
    supabase.from('product_main_categories').select('*').order('sort_order'),
    supabase.from('product_sub_categories').select('*').order('sort_order'),
    supabase.from('product_categories').select('*').order('sort_order'),
  ]);

  if (mainRes.error) throw mainRes.error;
  if (subRes.error) throw subRes.error;
  if (leafRes.error) throw leafRes.error;

  return legacyRowsToTree(
    (mainRes.data || []) as LegacyMainRow[],
    (subRes.data || []) as LegacySubRow[],
    (leafRes.data || []) as LegacyLeafRow[],
    regionCode
  );
}

export async function syncCategoryTreeToLegacyTables(nodes: CategoryNode[], regionCodeOverride?: string | null): Promise<void> {
  const regionCode = normalizeRegionCode(regionCodeOverride);
  const { mainRows, subRows, leafRows } = buildLegacyRowsFromTree(nodes, regionCode);

  const [existingMainRes, existingSubRes, existingLeafRes] = await Promise.all([
    supabase.from('product_main_categories').select('id, region_code'),
    supabase.from('product_sub_categories').select('id, region_code'),
    supabase.from('product_categories').select('id, region_code'),
  ]);

  if (existingMainRes.error) throw existingMainRes.error;
  if (existingSubRes.error) throw existingSubRes.error;
  if (existingLeafRes.error) throw existingLeafRes.error;

  const [mainRes, subRes, leafRes] = await Promise.all([
    supabase.from('product_main_categories').upsert(mainRows, { onConflict: 'id' }),
    supabase.from('product_sub_categories').upsert(subRows, { onConflict: 'id' }),
    supabase.from('product_categories').upsert(leafRows, { onConflict: 'id' }),
  ]);

  if (mainRes.error) throw mainRes.error;
  if (subRes.error) throw subRes.error;
  if (leafRes.error) throw leafRes.error;

  const existingMainIds = ((existingMainRes.data || []) as Array<{ id: string; region_code?: string | null }>)
    .filter((row) => compareRegion(row.region_code, regionCode))
    .map((row) => row.id);
  const existingSubIds = ((existingSubRes.data || []) as Array<{ id: string; region_code?: string | null }>)
    .filter((row) => compareRegion(row.region_code, regionCode))
    .map((row) => row.id);
  const existingLeafIds = ((existingLeafRes.data || []) as Array<{ id: string; region_code?: string | null }>)
    .filter((row) => compareRegion(row.region_code, regionCode))
    .map((row) => row.id);

  const nextMainIds = new Set(mainRows.map((row) => row.id));
  const nextSubIds = new Set(subRows.map((row) => row.id));
  const nextLeafIds = new Set(leafRows.map((row) => row.id));

  const deletedMainIds = existingMainIds.filter((id) => !nextMainIds.has(id));
  const deletedSubIds = existingSubIds.filter((id) => !nextSubIds.has(id));
  const deletedLeafIds = existingLeafIds.filter((id) => !nextLeafIds.has(id));

  if (deletedLeafIds.length > 0) {
    const { error } = await supabase.from('product_categories').delete().in('id', deletedLeafIds);
    if (error) throw error;
  }
  if (deletedSubIds.length > 0) {
    const { error } = await supabase.from('product_sub_categories').delete().in('id', deletedSubIds);
    if (error) throw error;
  }
  if (deletedMainIds.length > 0) {
    const { error } = await supabase.from('product_main_categories').delete().in('id', deletedMainIds);
    if (error) throw error;
  }
}

export async function upsertCategoryTreeNodes(rows: CategoryNodeRow[]): Promise<void> {
  const { error } = await db.from('product_category_nodes').upsert(rows, { onConflict: 'id' });
  if (error) throw error;
}

async function pruneCategoryTreeNodes(nodes: CategoryNode[], regionCodeOverride?: string | null): Promise<void> {
  const regionCode = normalizeRegionCode(regionCodeOverride);
  const keepIds = new Set(flattenRows(nodes).map((row) => row.id));
  const { data, error } = await db.from('product_category_nodes').select('id, region_code');
  if (error) throw error;

  const deleteIds = ((data || []) as Array<{ id: string; region_code?: string | null }>)
    .filter((row) => compareRegion(row.region_code, regionCode))
    .map((row) => row.id)
    .filter((id) => !keepIds.has(id));

  if (deleteIds.length === 0) return;
  const { error: deleteError } = await db.from('product_category_nodes').delete().in('id', deleteIds);
  if (deleteError) throw deleteError;
}

export async function syncCategoryTreeFromLegacyCatalog(
  catalog: MainCategory[],
  regionCodeOverride?: string | null
): Promise<void> {
  const regionCode = normalizeRegionCode(regionCodeOverride);
  const rows = new Map<string, CategoryNodeRow>();

  const rememberRow = (row: CategoryNodeRow) => {
    rows.set(row.id, row);
  };

  catalog.forEach((department, departmentIndex) => {
    rememberRow({
      id: department.id,
      name: department.name,
      parent_id: null,
      description: department.description ?? null,
      sort_order: departmentIndex + 1,
      region_code: regionCode,
    });

    department.subCategories.forEach((subCategory, subIndex) => {
      rememberRow({
        id: subCategory.id,
        name: subCategory.name,
        parent_id: department.id,
        description: subCategory.description ?? null,
        sort_order: subIndex + 1,
        region_code: regionCode,
      });

      subCategory.productCategories.forEach((leaf, leafIndex) => {
        rememberRow({
          id: leaf.id,
          name: leaf.name,
          parent_id: subCategory.id,
          description: leaf.description ?? null,
          sort_order: leafIndex + 1,
          region_code: regionCode,
        });
      });
    });
  });

  await upsertCategoryTreeNodes(Array.from(rows.values()));
}

export async function createCategoryNode(input: {
  name: string;
  parentId?: string | null;
  description?: string;
  sortOrder?: number;
  regionCode?: string | null;
}): Promise<CategoryNodeRow> {
  const name = String(input.name || '').trim();
  if (!name) throw new Error('Category name is required');

  const idBase = input.parentId ? `${input.parentId}-${name}` : name;
  const row: CategoryNodeRow = {
    id: slugify(idBase),
    name,
    parent_id: input.parentId ?? null,
    description: input.description?.trim() || null,
    sort_order: Number(input.sortOrder || 100),
    region_code: normalizeRegionCode(input.regionCode),
  };

  await upsertCategoryTreeNodes([row]);
  return row;
}

export async function updateCategoryNode(
  id: string,
  updates: Partial<Pick<CategoryNodeRow, 'name' | 'description' | 'sort_order' | 'parent_id' | 'region_code'>>
): Promise<void> {
  const payload = {
    id,
    ...(updates.name !== undefined ? { name: updates.name.trim() } : {}),
    ...(updates.description !== undefined ? { description: updates.description?.trim() || null } : {}),
    ...(updates.sort_order !== undefined ? { sort_order: Number(updates.sort_order || 100) } : {}),
    ...(updates.parent_id !== undefined ? { parent_id: updates.parent_id } : {}),
    ...(updates.region_code !== undefined ? { region_code: normalizeRegionCode(updates.region_code) } : {}),
  };

  const { error } = await db.from('product_category_nodes').upsert(payload, { onConflict: 'id' });
  if (error) throw error;
}

export async function deleteCategoryNodeBranch(rootNodeId: string): Promise<void> {
  const { data, error } = await db.from('product_category_nodes').select('id,parent_id');
  if (error) throw error;

  const rows = (data || []) as Array<{ id: string; parent_id: string | null }>;
  const childrenByParent = new Map<string | null, string[]>();
  for (const row of rows) {
    const key = row.parent_id || null;
    const list = childrenByParent.get(key) || [];
    list.push(row.id);
    childrenByParent.set(key, list);
  }

  const stack = [rootNodeId];
  const ids: string[] = [];
  while (stack.length > 0) {
    const current = stack.pop()!;
    ids.push(current);
    for (const childId of childrenByParent.get(current) || []) stack.push(childId);
  }

  if (ids.length === 0) return;

  const { data: linkedProducts, error: productError } = await supabase
    .from('products')
    .select('id, category_id')
    .in('category_id', ids);
  if (productError) throw productError;
  if ((linkedProducts || []).length > 0) {
    throw new Error('该类目或其下级类目仍有关联 SKU，请先调整产品分类。');
  }

  await supabase.from('category_attribute_templates').delete().in('category_id', ids);
  const { error: deleteError } = await db.from('product_category_nodes').delete().in('id', ids);
  if (deleteError) throw deleteError;
}

export async function saveCategoryTree(nodes: CategoryNode[], regionCodeOverride?: string | null): Promise<void> {
  await upsertCategoryTreeNodes(flattenRows(nodes));
  await pruneCategoryTreeNodes(nodes, regionCodeOverride);
  await syncCategoryTreeToLegacyTables(nodes, regionCodeOverride);
}

export async function saveCategoryTreeDraft(nodes: CategoryNode[]): Promise<void> {
  await upsertCategoryTreeNodes(flattenRows(nodes));
}
