import { useEffect, useState } from 'react';
import { getLeafCategoryImage } from '@/data/categoryLeafImages';
import { fetchCategoryTree, type CategoryNode } from '@/lib/services/categoryTreeService';
import {
  storefrontBaselineDepartments as fallbackDepartments,
  type Department,
  type DepartmentSubcategory,
} from '@/lib/storefrontDepartmentBaseline';

export const STOREFRONT_CATEGORY_TREE_PUBLISHED_EVENT = 'storefront-category-tree:published';
export const STOREFRONT_CATEGORY_TREE_PUBLISHED_KEY = 'storefront-category-tree:last-published';

type PublishedCategoryTreeSnapshot = {
  publishedAt: string;
  tree: CategoryNode[];
};

const readPublishedTreeSnapshot = (): CategoryNode[] | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STOREFRONT_CATEGORY_TREE_PUBLISHED_KEY);
    if (!raw) return null;
    const snapshot = JSON.parse(raw) as Partial<PublishedCategoryTreeSnapshot>;
    return Array.isArray(snapshot.tree) ? snapshot.tree : null;
  } catch {
    return null;
  }
};

const findFirstLeaf = (node: CategoryNode): CategoryNode => {
  if (node.children.length === 0) return node;
  return findFirstLeaf(node.children[0]);
};

const collectLeafLabels = (node: CategoryNode, ancestors: string[] = []): string[] => {
  if (node.children.length === 0) {
    return [ancestors.length > 0 ? [...ancestors, node.name].join(' / ') : node.name];
  }

  return node.children.flatMap((child) => {
    if (child.children.length === 0) return [child.name];
    return collectLeafLabels(child, [child.name]);
  });
};

const mergeSubcategoryMeta = (
  departmentName: string,
  subcategoryName: string
): Pick<DepartmentSubcategory, 'image'> => {
  const fallbackDepartment = fallbackDepartments.find((item) => item.name === departmentName);
  const fallbackSubcategory = fallbackDepartment?.subcategories.find((item) => item.name === subcategoryName);
  return {
    image: fallbackSubcategory?.image,
  };
};

export const buildStorefrontDepartmentsFromTree = (tree: CategoryNode[]): Department[] => {
  return tree.map((departmentNode) => {
    const fallbackDepartment = fallbackDepartments.find((item) => item.name === departmentNode.name);
    return {
      name: departmentNode.name,
      href: '#products',
      featuredImage: fallbackDepartment?.featuredImage,
      subcategories: departmentNode.children.map((subNode) => {
        const fallbackMeta = mergeSubcategoryMeta(departmentNode.name, subNode.name);
        const firstLeaf = subNode.children.length > 0 ? findFirstLeaf(subNode) : subNode;
        return {
          name: subNode.name,
          image: fallbackMeta.image || getLeafCategoryImage(firstLeaf.name),
          items: collectLeafLabels(subNode),
        };
      }),
    };
  });
};

export function useStorefrontDepartments() {
  const [departments, setDepartments] = useState<Department[]>(() => {
    const snapshotTree = readPublishedTreeSnapshot();
    return snapshotTree && snapshotTree.length > 0
      ? buildStorefrontDepartmentsFromTree(snapshotTree)
      : fallbackDepartments;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const applyTree = (tree: CategoryNode[]) => {
      if (cancelled || tree.length === 0) return false;
      setDepartments(buildStorefrontDepartmentsFromTree(tree));
      return true;
    };

    const loadSnapshot = () => {
      const snapshotTree = readPublishedTreeSnapshot();
      return Array.isArray(snapshotTree) ? applyTree(snapshotTree) : false;
    };

    const load = async () => {
      setLoading(true);
      try {
        const tree = await fetchCategoryTree();
        if (!applyTree(tree)) loadSnapshot();
      } catch (error) {
        console.warn('Storefront department tree fetch failed; keeping static department fallback.', error);
        if (!loadSnapshot() && !cancelled) {
          setDepartments(fallbackDepartments);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadSnapshot();
    void load();

    const handlePublished = (event: Event) => {
      const tree = (event as CustomEvent<PublishedCategoryTreeSnapshot>).detail?.tree;
      if (Array.isArray(tree) && applyTree(tree)) return;
      if (!loadSnapshot()) void load();
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STOREFRONT_CATEGORY_TREE_PUBLISHED_KEY && !loadSnapshot()) void load();
    };

    window.addEventListener(STOREFRONT_CATEGORY_TREE_PUBLISHED_EVENT, handlePublished);
    window.addEventListener('storage', handleStorage);

    return () => {
      cancelled = true;
      window.removeEventListener(STOREFRONT_CATEGORY_TREE_PUBLISHED_EVENT, handlePublished);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return { departments, loading };
}
