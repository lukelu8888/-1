import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { departments } from '../data/departmentsData';

type Page = 'home' | 'projectsolution' | 'qcmaster' | 'shipmenthub' | 'specials' | 'products' | 'catalog' | 'failurecases' | 'services' | 'socialmedia' | 'news' | 'about' | 'member' | 'login' | 'admin-login' | 'register' | 'supplier' | 'dashboard' | 'furnitureinspection' | 'textilesinspection' | 'toysinspection' | 'electronicsinspection' | 'appliancesinspection' | 'lightinginspection' | 'shoesinspection' | 'packaginginspection' | 'privacy-policy' | 'terms-of-service' | 'category' | 'cart' | 'live' | 'live-archive' | 'ai-content-studio' | string;

interface RouterContextType {
  currentPage: Page;
  navigateTo: (page: Page | string, params?: any) => void;
  categoryParams?: { category: string; subcategory?: string };
}

const RouterContext = createContext<RouterContextType | undefined>(undefined);

function isSupabaseAuthHash(hash: string): boolean {
  const raw = String(hash || '').trim();
  if (!raw.startsWith('#')) return false;
  const fragment = raw.slice(1);
  if (!fragment || fragment.startsWith('/')) return false;
  return (
    fragment.includes('access_token=') ||
    fragment.includes('refresh_token=') ||
    fragment.includes('error_description=') ||
    fragment.includes('error=') ||
    fragment.includes('type=magiclink') ||
    fragment.includes('type=recovery') ||
    fragment.includes('type=invite')
  );
}

function parsePageFromHash(hash: string): string | null {
  if (isSupabaseAuthHash(hash)) {
    return 'admin-formal-login';
  }
  // Supports: "#/admin-login" or "#admin-login"
  const raw = (hash || '').trim();
  if (!raw) return null;
  if (!raw.startsWith('#')) return null;

  const withoutHash = raw.slice(1);
  const cleaned = withoutHash.startsWith('/') ? withoutHash.slice(1) : withoutHash;
  const page = decodeURIComponent(cleaned).trim();
  if (['deals', 'offers', 'deals-offers', 'deals-and-offers'].includes(page.toLowerCase())) {
    return 'specials';
  }
  return page ? page : null;
}

function buildHashFromPage(page: string): string {
  const safe = encodeURIComponent(page);
  return `#/${safe}`;
}

function slugifyCategoryName(categoryName: string): string {
  return categoryName
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getCategoryParamsFromPage(page: string): { category: string } | undefined {
  if (!page.startsWith('category-')) return undefined;
  const slug = page.replace(/^category-/, '');
  const department = departments.find((dept) => slugifyCategoryName(dept.name) === slug);
  return department ? { category: department.name } : undefined;
}

// Storage keys
const STORAGE_KEYS = {
  currentPage: 'cosun_current_page',
  categoryParams: 'cosun_category_params'
};

export function RouterProvider({ children }: { children: ReactNode }) {
  // Initialize state from URL hash, then localStorage, or default to 'home'
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    try {
      const fromHash = parsePageFromHash(window.location.hash);
      if (fromHash) return fromHash as Page;
      const saved = localStorage.getItem(STORAGE_KEYS.currentPage);
      return saved ? (saved as Page) : 'home';
    } catch {
      return 'home';
    }
  });

  const [categoryParams, setCategoryParams] = useState<{ category: string; subcategory?: string } | undefined>(() => {
    try {
      const fromHash = parsePageFromHash(window.location.hash);
      const paramsFromHash = fromHash ? getCategoryParamsFromPage(fromHash) : undefined;
      if (paramsFromHash) return paramsFromHash;
      const saved = localStorage.getItem(STORAGE_KEYS.categoryParams);
      return saved ? JSON.parse(saved) : undefined;
    } catch {
      return undefined;
    }
  });

  // Save to localStorage whenever page changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.currentPage, currentPage);
    } catch (error) {
      console.error('Failed to save page to localStorage:', error);
    }
  }, [currentPage]);

  // Keep URL hash in sync (so users can use a fixed URL like /#/admin-login)
  useEffect(() => {
    try {
      if (isSupabaseAuthHash(window.location.hash)) {
        return;
      }
      const desired = buildHashFromPage(String(currentPage));
      if (window.location.hash !== desired) {
        window.location.hash = desired;
      }
    } catch {
      // ignore
    }
  }, [currentPage]);

  // Support browser back/forward
  useEffect(() => {
    const onHashChange = () => {
      const next = parsePageFromHash(window.location.hash);
      if (!next) return;
      setCurrentPage((prev) => (String(prev) === next ? prev : (next as Page)));
      const paramsFromHash = getCategoryParamsFromPage(next);
      if (paramsFromHash) {
        setCategoryParams(paramsFromHash);
      } else if (!next.startsWith('category-')) {
        setCategoryParams(undefined);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Save to localStorage whenever category params change
  useEffect(() => {
    try {
      if (categoryParams) {
        localStorage.setItem(STORAGE_KEYS.categoryParams, JSON.stringify(categoryParams));
      } else {
        localStorage.removeItem(STORAGE_KEYS.categoryParams);
      }
    } catch (error) {
      console.error('Failed to save category params to localStorage:', error);
    }
  }, [categoryParams]);

  const navigateTo = (page: Page | string, params?: any) => {
    setCurrentPage(page as Page);
    if (params) {
      setCategoryParams(params);
    } else if (page.startsWith('category-')) {
      setCategoryParams(getCategoryParamsFromPage(page));
    } else if (!page.startsWith('category-')) {
      // Clear category params when navigating away from category pages
      setCategoryParams(undefined);
    }
    // Keep navigation snappy: avoid animated scroll on each route change
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  return (
    <RouterContext.Provider value={{ currentPage, navigateTo, categoryParams }}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const context = useContext(RouterContext);
  if (context === undefined) {
    throw new Error('useRouter must be used within a RouterProvider');
  }
  return context;
}
