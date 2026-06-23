import { supabase } from '../supabase';

export type PimTemplateStatus = 'draft' | 'active' | 'archived';
export type PimAttributeDataType = 'text' | 'number' | 'boolean' | 'enum' | 'multi_enum' | 'dimension' | 'file' | 'image';
export type PimAssetType = 'main' | 'gallery' | 'lifestyle' | 'detail' | 'dimension' | 'packaging' | 'certificate' | 'manual' | 'video';
export type PimAssetQualityStatus = 'unchecked' | 'approved' | 'needs_review' | 'rejected';

export interface PimTemplate {
  id: string;
  category_id: string;
  template_name: string;
  status: PimTemplateStatus;
  version_no: number;
  required_score_threshold: number;
  created_at?: string;
  updated_at?: string;
}

export interface PimAttribute {
  id: string;
  template_id: string;
  attribute_key: string;
  label: string;
  data_type: PimAttributeDataType;
  unit?: string | null;
  options?: any[];
  is_required: boolean;
  is_filterable: boolean;
  is_searchable: boolean;
  is_compliance: boolean;
  display_group: string;
  display_order: number;
}

export interface PimAttributeValue {
  id: string;
  product_id: string;
  attribute_id: string;
  value_text?: string | null;
  value_number?: number | null;
  value_boolean?: boolean | null;
  value_json?: any;
  updated_at?: string;
}

export interface PimAsset {
  id: string;
  product_id: string;
  asset_type: PimAssetType;
  asset_url: string;
  title?: string | null;
  alt_text?: string | null;
  sort_order: number;
  quality_status: PimAssetQualityStatus;
}

export interface PimVariant {
  id: string;
  parent_product_id: string;
  child_product_id: string;
  variant_axis: string;
  variant_value: string;
  display_order: number;
}

export interface PimSearchIndex {
  product_id: string;
  search_title: string;
  search_keywords: string[];
  brand?: string | null;
  model_number?: string | null;
  internet_sku?: string | null;
  category_path?: string | null;
  updated_at?: string;
}

export interface PimDataset {
  templates: PimTemplate[];
  attributes: PimAttribute[];
  values: PimAttributeValue[];
  assets: PimAsset[];
  variants: PimVariant[];
  searchIndexes: PimSearchIndex[];
}

const normalizeId = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);

const throwIfError = ({ error }: { error: any }) => {
  if (error) throw error;
};

async function withPimTimeout<T>(task: Promise<T>, label: string, timeoutMs = 5000): Promise<T> {
  return Promise.race<T>([
    task,
    new Promise<T>((_, reject) => {
      window.setTimeout(() => reject(new Error(`${label} request timed out`)), timeoutMs);
    }),
  ]);
}

async function safeSelect<T>(table: string, orderColumn?: string): Promise<T[]> {
  try {
    let query = supabase.from(table).select('*');
    if (orderColumn) query = query.order(orderColumn);
    const { data, error } = await withPimTimeout(query, table);
    if (error) {
      console.warn(`PIM table ${table} is unavailable. Run the PIM migration to enable editing.`, error);
      return [];
    }
    return (data ?? []) as T[];
  } catch (error) {
    console.warn(`PIM table ${table} could not be loaded.`, error);
    return [];
  }
}

export async function fetchPimDataset(): Promise<PimDataset> {
  const [templates, attributes, values, assets, variants, searchIndexes] = await Promise.all([
    safeSelect<PimTemplate>('category_attribute_templates', 'category_id'),
    safeSelect<PimAttribute>('category_attributes', 'display_order'),
    safeSelect<PimAttributeValue>('product_attribute_values', 'updated_at'),
    safeSelect<PimAsset>('product_assets', 'sort_order'),
    safeSelect<PimVariant>('product_variants', 'display_order'),
    safeSelect<PimSearchIndex>('product_search_index', 'search_title'),
  ]);
  return { templates, attributes, values, assets, variants, searchIndexes };
}

export async function upsertPimTemplate(input: {
  id?: string;
  categoryId: string;
  templateName: string;
  status: PimTemplateStatus;
  versionNo: number;
  requiredScoreThreshold: number;
}): Promise<PimTemplate> {
  const id = input.id || `tmpl-${normalizeId(input.categoryId)}-v${input.versionNo}`;
  const { data, error } = await supabase
    .from('category_attribute_templates')
    .upsert(
      {
        id,
        category_id: input.categoryId,
        template_name: input.templateName.trim() || `${input.categoryId} Template`,
        status: input.status,
        version_no: input.versionNo,
        required_score_threshold: input.requiredScoreThreshold,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as PimTemplate;
}

export async function upsertPimAttribute(input: {
  id?: string;
  templateId: string;
  attributeKey: string;
  label: string;
  dataType: PimAttributeDataType;
  unit?: string;
  optionsText?: string;
  isRequired: boolean;
  isFilterable: boolean;
  isSearchable: boolean;
  isCompliance: boolean;
  displayGroup: string;
  displayOrder: number;
}): Promise<PimAttribute> {
  const attributeKey = normalizeId(input.attributeKey || input.label).replace(/-/g, '_');
  const id = input.id || `attr-${normalizeId(input.templateId)}-${attributeKey}`;
  const options = (input.optionsText || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  const { data, error } = await supabase
    .from('category_attributes')
    .upsert(
      {
        id,
        template_id: input.templateId,
        attribute_key: attributeKey,
        label: input.label.trim() || attributeKey,
        data_type: input.dataType,
        unit: input.unit?.trim() || null,
        options,
        is_required: input.isRequired,
        is_filterable: input.isFilterable,
        is_searchable: input.isSearchable,
        is_compliance: input.isCompliance,
        display_group: input.displayGroup.trim() || 'Specifications',
        display_order: Number(input.displayOrder || 100),
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as PimAttribute;
}

export async function deletePimAttribute(id: string): Promise<void> {
  throwIfError(await supabase.from('category_attributes').delete().eq('id', id));
}

export async function upsertPimAttributeValue(input: {
  productId: string;
  attribute: PimAttribute;
  value: string;
}): Promise<PimAttributeValue> {
  const id = `pav-${normalizeId(input.productId)}-${normalizeId(input.attribute.id)}`;
  const value = input.value.trim();
  const payload: Record<string, any> = {
    id,
    product_id: input.productId,
    attribute_id: input.attribute.id,
    value_text: null,
    value_number: null,
    value_boolean: null,
    value_json: null,
    updated_at: new Date().toISOString(),
  };

  if (input.attribute.data_type === 'number' || input.attribute.data_type === 'dimension') {
    const parsed = Number(value);
    payload.value_number = Number.isFinite(parsed) ? parsed : null;
    payload.value_text = value;
  } else if (input.attribute.data_type === 'boolean') {
    payload.value_boolean = ['true', 'yes', 'y', '1', '是'].includes(value.toLowerCase());
    payload.value_text = value;
  } else if (input.attribute.data_type === 'multi_enum') {
    payload.value_json = value.split(',').map((item) => item.trim()).filter(Boolean);
    payload.value_text = value;
  } else {
    payload.value_text = value;
  }

  const { data, error } = await supabase
    .from('product_attribute_values')
    .upsert(payload, { onConflict: 'id' })
    .select('*')
    .single();
  if (error) throw error;
  return data as PimAttributeValue;
}

export async function upsertPimAsset(input: {
  id?: string;
  productId: string;
  assetType: PimAssetType;
  assetUrl: string;
  title?: string;
  altText?: string;
  sortOrder: number;
  qualityStatus: PimAssetQualityStatus;
}): Promise<PimAsset> {
  const id = input.id || `asset-${normalizeId(input.productId)}-${normalizeId(input.assetType)}-${Date.now()}`;
  const { data, error } = await supabase
    .from('product_assets')
    .upsert(
      {
        id,
        product_id: input.productId,
        asset_type: input.assetType,
        asset_url: input.assetUrl.trim(),
        title: input.title?.trim() || null,
        alt_text: input.altText?.trim() || null,
        sort_order: Number(input.sortOrder || 100),
        quality_status: input.qualityStatus,
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as PimAsset;
}

export async function deletePimAsset(id: string): Promise<void> {
  throwIfError(await supabase.from('product_assets').delete().eq('id', id));
}

export async function upsertPimVariant(input: {
  id?: string;
  parentProductId: string;
  childProductId: string;
  variantAxis: string;
  variantValue: string;
  displayOrder: number;
}): Promise<PimVariant> {
  const id = input.id || `variant-${normalizeId(input.parentProductId)}-${normalizeId(input.childProductId)}-${normalizeId(input.variantAxis)}`;
  const { data, error } = await supabase
    .from('product_variants')
    .upsert(
      {
        id,
        parent_product_id: input.parentProductId,
        child_product_id: input.childProductId,
        variant_axis: input.variantAxis.trim(),
        variant_value: input.variantValue.trim(),
        display_order: Number(input.displayOrder || 100),
      },
      { onConflict: 'id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as PimVariant;
}

export async function deletePimVariant(id: string): Promise<void> {
  throwIfError(await supabase.from('product_variants').delete().eq('id', id));
}

export async function upsertPimSearchIndex(input: PimSearchIndex): Promise<PimSearchIndex> {
  const { data, error } = await supabase
    .from('product_search_index')
    .upsert(
      {
        product_id: input.product_id,
        search_title: input.search_title.trim(),
        search_keywords: input.search_keywords,
        brand: input.brand?.trim() || null,
        model_number: input.model_number?.trim() || null,
        internet_sku: input.internet_sku?.trim() || null,
        category_path: input.category_path?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'product_id' },
    )
    .select('*')
    .single();
  if (error) throw error;
  return data as PimSearchIndex;
}
