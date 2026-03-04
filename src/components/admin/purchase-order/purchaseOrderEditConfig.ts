export type EditPOFormState = {
  poNumber: string;
  requirementNo: string;
  xjNumber: string;
  sourceRef: string;
  supplierName: string;
  supplierCode: string;
  supplierContact: string;
  supplierPhone: string;
  supplierAddress: string;
  currency: string;
  paymentTerms: string;
  deliveryTerms: string;
  deliveryAddress: string;
  qualityStandard: string;
  inspectionMethod: string;
  packaging: string;
  shippingMarks: string;
  deliveryPenalty: string;
  qualityPenalty: string;
  warrantyPeriod: string;
  returnPolicy: string;
  confidentiality: string;
  ipRights: string;
  forceMajeure: string;
  disputeResolution: string;
  applicableLaw: string;
  contractValidity: string;
  modification: string;
  termination: string;
  incoterm: string;
  portOfLoading: string;
  portOfDestination: string;
  qualityTerms: string;
  inspectionTerms: string;
  packagingTerms: string;
  warrantyTerms: string;
  penaltyTerms: string;
  disputeResolutionTerms: string;
  taxTerms: string;
  bankTerms: string;
  orderDate: string;
  expectedDate: string;
  actualDate: string;
  status: string;
  paymentStatus: string;
  remarks: string;
};

export type CreateOrderFormState = {
  supplierName: string;
  supplierCode: string;
  currency: string;
  paymentTerms: string;
  deliveryTerms: string;
  expectedDate: string;
  remarks: string;
};

export const createInitialCreateOrderForm = (): CreateOrderFormState => ({
  supplierName: '',
  supplierCode: '',
  currency: 'CNY',
  paymentTerms: '30% 预付，70% 发货前付清',
  deliveryTerms: 'EXW 工厂交货',
  expectedDate: '',
  remarks: '',
});

export const createInitialEditPOForm = (): EditPOFormState => ({
  poNumber: '',
  requirementNo: '',
  xjNumber: '',
  sourceRef: '',
  supplierName: '',
  supplierCode: '',
  supplierContact: '',
  supplierPhone: '',
  supplierAddress: '',
  currency: 'CNY',
  paymentTerms: '',
  deliveryTerms: '',
  deliveryAddress: '',
  qualityStandard: '',
  inspectionMethod: '',
  packaging: '',
  shippingMarks: '',
  deliveryPenalty: '',
  qualityPenalty: '',
  warrantyPeriod: '',
  returnPolicy: '',
  confidentiality: '',
  ipRights: '',
  forceMajeure: '',
  disputeResolution: '',
  applicableLaw: '',
  contractValidity: '',
  modification: '',
  termination: '',
  incoterm: '',
  portOfLoading: '',
  portOfDestination: '',
  qualityTerms: '',
  inspectionTerms: '',
  packagingTerms: '',
  warrantyTerms: '',
  penaltyTerms: '',
  disputeResolutionTerms: '',
  taxTerms: '',
  bankTerms: '',
  orderDate: '',
  expectedDate: '',
  actualDate: '',
  status: 'pending',
  paymentStatus: 'unpaid',
  remarks: '',
});

export const CURRENCY_OPTIONS = ['CNY', 'USD', 'EUR', 'GBP', 'JPY', 'HKD', 'AUD', 'CAD'] as const;

export const EXTRA_TERM_OPTIONS = {
  deliveryPenalty: [
    '每延迟1天按未交货金额的0.5%计违约金',
    '每延迟1天按未交货金额的1%计违约金',
    '延期超过7天，买方有权取消订单',
  ],
  qualityPenalty: [
    '质量不符按不合格货值的10%赔偿',
    '质量不符按不合格货值的20%赔偿',
    '质量异常由卖方承担返工/换货全部费用',
  ],
  warrantyPeriod: ['12个月', '18个月', '24个月'],
  returnPolicy: ['质量问题7天内退换', '质量问题30天内退换', '按合同约定执行'],
  forceMajeure: ['不可抗力双方互不承担违约责任', '不可抗力发生后7日内书面通知对方'],
  disputeResolution: ['协商不成提交厦门仲裁委员会', '协商不成向合同签署地法院起诉'],
  applicableLaw: ['中华人民共和国法律', '合同签署地法律'],
  contractValidity: ['双方盖章后生效', '签署后生效至订单履约完成'],
  modification: ['变更须双方书面确认', '变更以补充协议为准'],
  termination: ['严重违约可单方解除合同', '双方协商一致可终止合同'],
} as const;

export const normalizeCurrencyCode = (value: unknown): string => {
  const raw = String(value || '').trim().toUpperCase();
  if (!raw) return '';
  if (raw === 'RMB' || raw === 'CN¥' || raw === 'YUAN') return 'CNY';
  return raw;
};

export const normalizeRegionalDocNo = (value: unknown): string => {
  let v = String(value || '').trim();
  if (!v) return '';
  v = v
    .replace(/-North America-/gi, '-NA-')
    .replace(/-South America-/gi, '-SA-')
    .replace(/-Europe\s*&\s*Africa-/gi, '-EA-')
    .replace(/-Europe and Africa-/gi, '-EA-');
  return v;
};
