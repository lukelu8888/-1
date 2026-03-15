export const getInternalModelNo = (product: any) =>
  product?.internalModelNo ||
  product?.internal_model_no ||
  product?.modelNo ||
  product?.model_no ||
  product?.model ||
  product?.modelNumber ||
  product?.sku ||
  '';

export const getCustomerPartNo = (product: any) =>
  product?.customerModelNo ||
  product?.customerModelNO ||
  product?.customer_model_no ||
  '';

export const getSupplierPartNo = (product: any) =>
  product?.supplierModelNo ||
  product?.supplierModelNO ||
  product?.supplier_model_no ||
  '';

export const hasCustomerPartNo = (product: any) => Boolean(getCustomerPartNo(product));

export const hasSupplierPartNo = (product: any) => Boolean(getSupplierPartNo(product));

export const getProductSourceKey = (product: any) => {
  const source = String(product?.source || '').trim().toLowerCase();
  const addedFrom = String(product?.addedFrom || '').trim().toLowerCase();
  const itemType = String(product?.itemType || '').trim().toLowerCase();

  if (source === 'website' || addedFrom === 'website') return 'website';
  if (source === 'history' || addedFrom === 'history') return 'history';
  if (
    source === 'my_products' ||
    source === 'library' ||
    addedFrom === 'my products' ||
    source === 'manual' ||
    addedFrom === 'manual entry' ||
    addedFrom === 'your items' ||
    itemType === 'standard_sourcing' ||
    itemType === 'oem_custom'
  ) {
    return 'my_products';
  }

  return 'my_products';
};

export const isYourItemsProduct = (product: any) => getProductSourceKey(product) === 'my_products';

export const isWebsiteProduct = (product: any) => getProductSourceKey(product) === 'website';

export const isHistoryProduct = (product: any) => getProductSourceKey(product) === 'history';

export const getCustomerFacingModelNo = (product: any) => {
  const customerPartNo = getCustomerPartNo(product);

  if (isYourItemsProduct(product) && customerPartNo) {
    return customerPartNo;
  }

  return getInternalModelNo(product) || '-';
};

export const getInternalFacingModelNo = (product: any) => getInternalModelNo(product) || '-';

export const getFormalBusinessModelNo = (product: any) => getInternalFacingModelNo(product);

export const getSupplierFacingModelNo = (product: any) => getInternalFacingModelNo(product);

export const shouldShowCustomerRefLine = (product: any) => {
  const customerPartNo = getCustomerPartNo(product);
  if (!customerPartNo) return false;
  return getCustomerFacingModelNo(product) !== customerPartNo;
};

export const shouldShowSupplierRefLine = (product: any) => {
  const supplierPartNo = getSupplierPartNo(product);
  if (!supplierPartNo) return false;
  return getSupplierFacingModelNo(product) !== supplierPartNo;
};

export const getCustomerFacingSourceLabel = (product: any) => {
  const sourceKey = getProductSourceKey(product);
  if (sourceKey === 'website') return 'Website';
  if (sourceKey === 'history') return 'History';
  return 'My Products';
};

export const getModelDisplayBundle = (product: any) => ({
  internalModelNo: getInternalFacingModelNo(product),
  customerPartNo: getCustomerPartNo(product),
  supplierPartNo: getSupplierPartNo(product),
  customerFacingModelNo: getCustomerFacingModelNo(product),
  formalBusinessModelNo: getFormalBusinessModelNo(product),
  supplierFacingModelNo: getSupplierFacingModelNo(product),
  customerSourceLabel: getCustomerFacingSourceLabel(product),
  shouldShowCustomerRefLine: shouldShowCustomerRefLine(product),
  shouldShowSupplierRefLine: shouldShowSupplierRefLine(product),
});
