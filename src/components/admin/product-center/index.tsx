import { useState } from 'react';
import { ProductCenterProvider } from './context/ProductCenterContext';
import { ProductCenterShell, type ProductCenterModuleId } from './ProductCenterShell';

/**
 * Product Management Center (rebuilt) — entry component.
 *
 * Drop-in replacement for `ProductManagement.tsx` and is used by
 * `AdminDashboard` for the `product-management` route.
 *
 * Architecture:
 *   - <ProductCenterProvider> owns all in-memory state (Phase 1-3 mock).
 *   - <ProductCenterShell> renders the top region bar, left module nav,
 *     and routes between modules + the inline PIM detail page.
 *   - Each module under `modules/*` is self-contained and consumes the
 *     central context via `useProductCenter()` so future Supabase wiring
 *     happens in one place.
 */
export default function ProductCenterApp() {
  const [activeModule, setActiveModule] = useState<ProductCenterModuleId>('pim');
  const [detailProductId, setDetailProductId] = useState<string | null>(null);

  return (
    <ProductCenterProvider>
      <ProductCenterShell
        activeModule={activeModule}
        setActiveModule={setActiveModule}
        detailProductId={detailProductId}
        setDetailProductId={setDetailProductId}
      />
    </ProductCenterProvider>
  );
}
