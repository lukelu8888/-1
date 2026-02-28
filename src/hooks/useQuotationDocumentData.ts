/**
 * useQuotationDocumentData
 *
 * Single hook that resolves everything the QuotationDocument needs:
 *   1. The raw quotation object (from localStorage or a passed-in prop)
 *   2. The supplier profile (email → suppliersDatabase → SupplierProfile)
 *   3. A normalised document-data structure ready for rendering
 *
 * Data-source priority:
 *   supplierId  →  quotation.supplierCode  →  quotation.supplierEmail  →  user.email
 *   logoUrl     →  suppliersDatabase[supplier].logoUrl  (user-uploaded in future)
 *
 * The hook is fully synchronous (all data is local) so there is no
 * network loading state.  If a future API is added, swap the sync
 * resolution for async and set `loading: true` during the fetch.
 */

import { useMemo } from 'react';
import { useUser } from '../contexts/UserContext';
import { useOrganization } from '../contexts/OrganizationContext';
import {
  suppliersDatabase,
  findSupplier,
  toSupplierProfile,
  type SupplierProfile,
} from '../data/suppliersData';
import { calcGrandTotal, calcLineAmount } from '../utils/formatters';

// ─── Normalised item used by the document renderer ────────────────────────────
export interface QuotationDocItem {
  no: number;
  modelNo: string;
  imageUrl?: string;
  description: string;
  specification: string;
  quantity: number;
  unit: string;
  /** Single-unit price in the quotation currency */
  unitPrice: number | null;
  /** qty × unitPrice (pre-computed, or from item.amount) */
  lineAmount: number | null;
  currency: string;
  remarks?: string;
}

// ─── Normalised quotation document data ───────────────────────────────────────
export interface QuotationDocData {
  quotationNo: string;
  quotationDate: string;
  validUntil: string;
  rfqReference?: string;
  inquiryReference?: string;

  currency: string;

  /** Supplier info resolved from suppliersDatabase */
  supplier: SupplierProfile;

  buyer: {
    name: string;
    nameEn: string;
    address: string;
    tel: string;
    email: string;
    contactPerson: string;
  };

  items: QuotationDocItem[];

  /** Grand total (from quotation.totalAmount, or calculated from items) */
  totalAmount: number;

  terms: {
    paymentTerms?: string;
    deliveryTerms?: string;
    deliveryTime?: string;
    deliveryAddress?: string;
    moq?: string;
    qualityStandard?: string;
    warranty?: string;
    packaging?: string;
    shippingMarks?: string;
    remarks?: string;
  };

  supplierRemarks?: {
    content: string;
    remarkDate?: string;
    remarkBy?: string;
  };
}

// ─── Hook return type ─────────────────────────────────────────────────────────
export interface UseQuotationDocumentDataResult {
  /** Resolved, ready-to-render document data. null while not ready. */
  data: QuotationDocData | null;
  /** True if the quotation object was null/undefined */
  isEmpty: boolean;
  /** Always false (sync) – placeholder for future async fetch */
  loading: false;
  /** Always null (sync) – placeholder for future async error */
  error: null;
}

// ─── Fallback supplier profile (when database lookup fails) ───────────────────
function buildFallbackProfile(quotation: any): SupplierProfile {
  return {
    id:            quotation.supplierCode || 'unknown',
    name:          quotation.supplierCompany || quotation.supplierName || '供应商',
    nameEn:        '',
    code:          quotation.supplierCode || '',
    email:         quotation.supplierEmail || '',
    phone:         quotation.supplierPhone || '',
    address:       quotation.documentData?.supplier?.address || '供应商地址',
    contactPerson: quotation.supplierName || quotation.supplierContact || '联系人',
    logoUrl:       null,
  };
}

// ─── Item normaliser ──────────────────────────────────────────────────────────
/**
 * Merge strategy for items with prices:
 *
 *   quotation.items[]          – live pricing (updated by the quotation editor)
 *   quotation.documentData.products[] – product metadata (name, modelNo, spec, image)
 *
 * We ALWAYS use quotation.items[] as the authoritative price source because
 * the editor writes back to items[], not to documentData.products[].
 *
 * For fields only on documentData.products (e.g. imageUrl, detailed spec),
 * we merge them in by index position.
 *
 * unitPrice == 0 is treated as "not yet priced" → renders as null (displays "—")
 * so the document never shows misleading 0.00 values.
 */
function normaliseItems(quotation: any): QuotationDocItem[] {
  // Live items[] is the price authority
  const liveItems: any[] = quotation.items ?? [];
  // documentData.products carries richer metadata (may exist from creation)
  const metaProducts: any[] = quotation.documentData?.products ?? [];

  // Use whichever array is longer as the base; prefer liveItems when equal
  const base = liveItems.length >= metaProducts.length ? liveItems : metaProducts;
  if (!base.length) return [];

  const currency = quotation.currency || liveItems[0]?.currency || 'CNY';

  return base.map((_, idx: number) => {
    // Merge: live item for prices, meta for display fields
    const live = liveItems[idx] ?? {};
    const meta = metaProducts[idx] ?? {};

    // ── Unit price: always from live items, 0 treated as "not priced" ──
    const rawPrice = live.unitPrice ?? meta.unitPrice;
    const unitPrice: number | null =
      rawPrice != null &&
      Number.isFinite(Number(rawPrice)) &&
      Number(rawPrice) > 0
        ? Number(rawPrice)
        : null;

    // ── Quantity: prefer live, fall back to meta ──
    const qty = Number(live.quantity ?? meta.quantity) || 0;

    // ── Line amount: recalculate from live price × qty ──
    // Never trust the stored amount field — it may be stale from creation time.
    const lineAmount: number | null =
      unitPrice !== null && qty > 0
        ? unitPrice * qty
        : // fall back to any explicitly stored amount only if it's > 0
          (() => {
            const stored = live.amount ?? meta.amount ?? live.lineAmount ?? meta.lineAmount;
            return stored != null && Number.isFinite(Number(stored)) && Number(stored) > 0
              ? Number(stored)
              : null;
          })();

    return {
      no:            live.no ?? meta.no ?? idx + 1,
      modelNo:       live.modelNo || meta.modelNo || live.itemCode || '',
      imageUrl:      live.imageUrl || meta.imageUrl,
      description:   live.description || live.productName || meta.description || meta.productName || '',
      specification: live.specification || meta.specification || '',
      quantity:      qty,
      unit:          live.unit || meta.unit || 'pcs',
      unitPrice,
      lineAmount,
      currency:      live.currency || meta.currency || currency,
      remarks:       live.remarks || meta.remarks,
    };
  });
}

// ─── Main hook ────────────────────────────────────────────────────────────────
/**
 * @param quotation  Raw quotation object from localStorage / parent state.
 *                   Pass null/undefined when nothing is selected.
 */
export function useQuotationDocumentData(
  quotation: any,
): UseQuotationDocumentDataResult {
  const { user } = useUser();
  const { org } = useOrganization();

  const data = useMemo((): QuotationDocData | null => {
    if (!quotation) return null;

    // ── 1. Resolve supplier profile ──────────────────────────────────────
    let supplierProfile: SupplierProfile;

    const rawSupplier = findSupplier({
      email: quotation.supplierEmail,
      code:  quotation.supplierCode,
      name:  quotation.supplierCompany || quotation.supplierName,
    });

    if (rawSupplier) {
      supplierProfile = toSupplierProfile(rawSupplier);
    } else if (user && (user.type === 'supplier' || user.type === 'manufacturer')) {
      const sessionSupplier = findSupplier({ email: user.email });
      supplierProfile = sessionSupplier
        ? toSupplierProfile(sessionSupplier)
        : buildFallbackProfile(quotation);
    } else {
      supplierProfile = buildFallbackProfile(quotation);
    }

    // Override contactPerson with the quotation's supplierName if more specific
    if (quotation.supplierName && quotation.supplierName !== supplierProfile.name) {
      supplierProfile = { ...supplierProfile, contactPerson: quotation.supplierName };
    }

    // ── OrganizationContext overlay (highest priority) ────────────────────
    // When a supplier is logged in, the OrganizationContext always reflects
    // the most up-to-date company information (including user-uploaded logo,
    // edited name, phone, address). We overlay these fields so the document
    // always shows live data rather than the snapshot stored at quotation
    // creation time.
    //
    // Fields with non-empty values in org take precedence over the database
    // lookup. This ensures that:
    //   1. LOGO uploaded via OrganizationProfile page is immediately visible
    //   2. Company name edits appear in new and existing quotation documents
    //   3. Contact info (phone, address) stays current
    const isSupplierSession =
      user?.type === 'supplier' || user?.type === 'manufacturer';

    if (isSupplierSession) {
      supplierProfile = {
        ...supplierProfile,
        // Only override if the org field has been explicitly set (non-default)
        ...(org.name && org.name !== '供应商公司' ? { name: org.name } : {}),
        ...(org.nameEn && org.nameEn !== 'Supplier Co.' ? { nameEn: org.nameEn } : {}),
        ...(org.phone ? { phone: org.phone } : {}),
        ...(org.address ? { address: org.address } : {}),
        ...(org.contactPerson ? { contactPerson: org.contactPerson } : {}),
        // Logo: always prefer org (data-URI from upload) over database entry
        ...(org.logoUrl ? { logoUrl: org.logoUrl } : {}),
      };
    } else if (org.logoUrl) {
      // Non-supplier session (admin viewing): still apply the logo
      supplierProfile = { ...supplierProfile, logoUrl: org.logoUrl };
    }

    // ── 2. Normalise items ───────────────────────────────────────────────
    const items = normaliseItems(quotation);

    // ── 3. Grand total ───────────────────────────────────────────────────
    // ALWAYS recalculate from normalised items to avoid showing the stale
    // zero that was written at quotation creation (before pricing).
    // Fall back to the stored totalAmount only when items carry no prices
    // at all (e.g. document is still in draft with nothing priced).
    const itemsTotal = items.reduce((sum, it) => sum + (it.lineAmount ?? 0), 0);
    const storedTotal =
      quotation.totalAmount != null && Number.isFinite(Number(quotation.totalAmount))
        ? Number(quotation.totalAmount)
        : 0;
    // Prefer the live-computed total; only fall back to stored if items give 0
    const totalAmount: number = itemsTotal > 0 ? itemsTotal : storedTotal;

    // ── 4. Currency ──────────────────────────────────────────────────────
    const currency = quotation.currency || items[0]?.currency || 'CNY';

    // ── 5. Terms ─────────────────────────────────────────────────────────
    const docTerms = quotation.documentData?.terms ?? {};
    const terms = {
      paymentTerms:    quotation.paymentTerms   || docTerms.paymentTerms,
      deliveryTerms:   quotation.deliveryTerms  || docTerms.deliveryTerms,
      deliveryTime:    docTerms.deliveryTime    || '收到订单后30天内',
      deliveryAddress: docTerms.deliveryAddress,
      moq:             docTerms.moq,
      qualityStandard: docTerms.qualityStandard,
      warranty:        docTerms.warranty,
      packaging:       quotation.packingTerms   || docTerms.packaging,
      shippingMarks:   docTerms.shippingMarks,
      remarks:         quotation.generalRemarks || docTerms.remarks,
    };

    // ── 6. Buyer (COSUN) ─────────────────────────────────────────────────
    const docBuyer = quotation.documentData?.buyer;
    const buyer = {
      name:          docBuyer?.name          || '福建高盛达富建材有限公司',
      nameEn:        docBuyer?.nameEn        || 'Fujian Gaoshengdafu Building Materials Co., Ltd.',
      address:       docBuyer?.address       || '福建省厦门市思明区',
      tel:           docBuyer?.tel           || '+86-592-1234567',
      email:         docBuyer?.email         || 'purchase@cosun.com',
      contactPerson: docBuyer?.contactPerson || quotation.customerName || 'COSUN采购',
    };

    // ── 7. Supplier remarks ──────────────────────────────────────────────
    const rawRemarks =
      quotation.supplierRemarks ||
      quotation.documentData?.supplierRemarks?.content ||
      quotation.generalRemarks;

    const supplierRemarks = rawRemarks
      ? {
          content:    typeof rawRemarks === 'string' ? rawRemarks : rawRemarks.content,
          remarkDate: quotation.quotationDate || new Date().toISOString().split('T')[0],
          remarkBy:   supplierProfile.contactPerson || supplierProfile.name,
        }
      : undefined;

    return {
      quotationNo:       quotation.quotationNo      || '',
      quotationDate:     quotation.quotationDate     || '',
      validUntil:        quotation.validUntil        || '',
      rfqReference:      quotation.sourceXJ          || quotation.sourceQR,
      inquiryReference:  quotation.documentData?.inquiryReference,
      currency,
      supplier:          supplierProfile,
      buyer,
      items,
      totalAmount,
      terms,
      supplierRemarks,
    };
  }, [quotation, user, org]);

  return {
    data,
    isEmpty: !quotation,
    loading:  false,
    error:    null,
  };
}
