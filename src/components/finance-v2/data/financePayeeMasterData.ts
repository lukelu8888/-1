export type FinancePayeeEntityType = 'company' | 'person';
export type FinancePayeePartySide = 'internal' | 'customer' | 'supplier' | 'third_party';
export type FinancePayeeApprovalStatus = 'active' | 'pending_approval';
export type FinancePayeeCategory =
  | 'supplier'
  | 'trucking'
  | 'freight_forwarder'
  | 'inspection_authority'
  | 'customs_broker'
  | 'testing_agency'
  | 'inspection_service'
  | 'landlord'
  | 'property_management'
  | 'employee'
  | 'social_security'
  | 'medical_insurance'
  | 'housing_fund'
  | 'tax_authority'
  | 'air_ticket_service'
  | 'train_ticket_service'
  | 'hotel'
  | 'other';

export interface FinancePayeeMasterRecord {
  id: string;
  name: string;
  masterCode?: string;
  partySide: FinancePayeePartySide;
  entityType: FinancePayeeEntityType;
  category: FinancePayeeCategory;
  approvalStatus: FinancePayeeApprovalStatus;
  expenseScope: 'business' | 'management';
  expenseSubject: string;
  targetModule: 'business_payables' | 'management_payables';
  requiresRegion: boolean;
  department?: string;
  costCenter?: string;
  routingNote?: string;
}

export const financeManagementExpenseSubjects = [
  '工资薪酬',
  '奖金福利',
  '社保',
  '公积金',
  '个税',
  '办公室租金',
  '物业费',
  '水电费',
  '办公用品',
  '办公设备采购',
  '办公设备维护',
  '团建费用',
  '差旅费',
  '招待费',
  '培训费用',
  '其他管理费用',
] as const;

export const financeBusinessExpenseSubjects = [
  '采购货款',
  '海运费',
  '空运费',
  '报关费',
  '验货费',
  '仓储费',
  '货代物流',
  '佣金',
  '样品费',
  '其他业务费用',
] as const;

export const financePayeeMasters: FinancePayeeMasterRecord[] = [
  {
    id: 'pm-internal-001',
    name: '福建高盛达富建材有限公司',
    partySide: 'internal',
    entityType: 'company',
    category: 'other',
    approvalStatus: 'active',
    expenseScope: 'management',
    expenseSubject: '其他管理费用',
    targetModule: 'management_payables',
    requiresRegion: false,
    department: '财务部',
    costCenter: '总部共享',
    routingNote: '我方主体主档，仅供识别和内部归属使用，财务不可直接维护。',
  },
  {
    id: 'pm-internal-002',
    name: '赵敏',
    partySide: 'internal',
    entityType: 'person',
    category: 'employee',
    approvalStatus: 'active',
    expenseScope: 'management',
    expenseSubject: '工资薪酬',
    targetModule: 'management_payables',
    requiresRegion: false,
    department: '财务部',
    costCenter: '财务中心',
    routingNote: '我方员工主档，仅供费用归属与内部付款识别，财务不可直接维护。',
  },
  {
    id: 'pm-001',
    name: '东莞华强电器有限公司',
    partySide: 'supplier',
    entityType: 'company',
    category: 'supplier',
    approvalStatus: 'active',
    expenseScope: 'business',
    expenseSubject: '采购货款',
    targetModule: 'business_payables',
    requiresRegion: true,
    routingNote: '供应商主档，默认进入业务类应付账款并要求业务区域。',
  },
  {
    id: 'pm-002',
    name: '深圳鹏程国际货运代理有限公司',
    partySide: 'third_party',
    entityType: 'company',
    category: 'freight_forwarder',
    approvalStatus: 'active',
    expenseScope: 'business',
    expenseSubject: '货代物流',
    targetModule: 'business_payables',
    requiresRegion: true,
    routingNote: '货代服务商主档，默认归类为业务费用并承接到业务应付。',
  },
  {
    id: 'pm-003',
    name: '广州天力报关',
    partySide: 'third_party',
    entityType: 'company',
    category: 'customs_broker',
    approvalStatus: 'active',
    expenseScope: 'business',
    expenseSubject: '报关费',
    targetModule: 'business_payables',
    requiresRegion: true,
    routingNote: '报关服务商主档，默认归类到业务费用。',
  },
  {
    id: 'pm-004',
    name: '深圳市社会保险基金管理局',
    partySide: 'third_party',
    entityType: 'company',
    category: 'social_security',
    approvalStatus: 'active',
    expenseScope: 'management',
    expenseSubject: '社保',
    targetModule: 'management_payables',
    requiresRegion: false,
    department: '人力行政部',
    costCenter: '人力中心',
    routingNote: '医保和社保机构主档，默认进入管理类应付账款，并建议费用部门为人力行政部、成本中心为人力中心。',
  },
  {
    id: 'pm-004b',
    name: '深圳市医疗保障局',
    partySide: 'third_party',
    entityType: 'company',
    category: 'social_security',
    approvalStatus: 'active',
    expenseScope: 'management',
    expenseSubject: '社保',
    targetModule: 'management_payables',
    requiresRegion: false,
    department: '人力行政部',
    costCenter: '人力中心',
    routingNote: '医保和社保机构主档，默认进入管理类应付账款，并建议费用部门为人力行政部、成本中心为人力中心。',
  },
  {
    id: 'pm-005',
    name: '深圳市住房公积金管理中心',
    partySide: 'third_party',
    entityType: 'company',
    category: 'housing_fund',
    approvalStatus: 'active',
    expenseScope: 'management',
    expenseSubject: '公积金',
    targetModule: 'management_payables',
    requiresRegion: false,
    department: '人力行政部',
    costCenter: '人力中心',
    routingNote: '公积金机构主档，默认进入管理类应付账款，并建议费用部门为人力行政部、成本中心为人力中心。',
  },
  {
    id: 'pm-006',
    name: '福州乾满人物业管理有限公司',
    partySide: 'third_party',
    entityType: 'company',
    category: 'property_management',
    approvalStatus: 'active',
    expenseScope: 'management',
    expenseSubject: '物业费',
    targetModule: 'management_payables',
    requiresRegion: false,
    department: '行政部',
    costCenter: '行政中心',
    routingNote: '物业主档，默认进入管理类应付账款，并建议费用科目为物业费、费用部门为行政部、成本中心为行政中心。',
  },
  {
    id: 'pm-006b',
    name: '福州鸿盛写字楼管理有限公司',
    partySide: 'third_party',
    entityType: 'company',
    category: 'landlord',
    approvalStatus: 'active',
    expenseScope: 'management',
    expenseSubject: '办公室租金',
    targetModule: 'management_payables',
    requiresRegion: false,
    department: '行政部',
    costCenter: '行政中心',
    routingNote: '房东主档，默认进入管理类应付账款，并建议费用科目为办公室租金、费用部门为行政部、成本中心为行政中心。',
  },
  {
    id: 'pm-007',
    name: '国家税务总局深圳市税务局',
    partySide: 'third_party',
    entityType: 'company',
    category: 'tax_authority',
    approvalStatus: 'active',
    expenseScope: 'management',
    expenseSubject: '个税',
    targetModule: 'management_payables',
    requiresRegion: false,
    department: '财务部',
    costCenter: '财务中心',
    routingNote: '税务机构主档，默认进入管理类应付账款，并建议费用部门为财务部、成本中心为财务中心。',
  },
  {
    id: 'pm-008',
    name: '携程商旅',
    partySide: 'third_party',
    entityType: 'company',
    category: 'air_ticket_service',
    approvalStatus: 'active',
    expenseScope: 'management',
    expenseSubject: '差旅费',
    targetModule: 'management_payables',
    requiresRegion: false,
    department: '行政部',
    costCenter: '总部共享',
    routingNote: '机票服务商主档，默认进入管理类应付账款，并建议费用部门为行政部、成本中心为总部共享。',
  },
  {
    id: 'pm-009',
    name: '12306 企业购票',
    partySide: 'third_party',
    entityType: 'company',
    category: 'train_ticket_service',
    approvalStatus: 'active',
    expenseScope: 'management',
    expenseSubject: '差旅费',
    targetModule: 'management_payables',
    requiresRegion: false,
    department: '行政部',
    costCenter: '总部共享',
    routingNote: '车票服务商主档，默认进入管理类应付账款，并建议费用部门为行政部、成本中心为总部共享。',
  },
  {
    id: 'pm-010',
    name: '深圳福田香格里拉酒店',
    partySide: 'third_party',
    entityType: 'company',
    category: 'hotel',
    approvalStatus: 'active',
    expenseScope: 'management',
    expenseSubject: '差旅费',
    targetModule: 'management_payables',
    requiresRegion: false,
    department: '行政部',
    costCenter: '总部共享',
    routingNote: '饭店/酒店主档，默认进入管理类应付账款，并建议费用部门为行政部、成本中心为总部共享。',
  },
  {
    id: 'pm-customer-001',
    name: 'Pacific Retail LLC',
    partySide: 'customer',
    entityType: 'company',
    category: 'other',
    approvalStatus: 'active',
    expenseScope: 'business',
    expenseSubject: '其他业务费用',
    targetModule: 'business_payables',
    requiresRegion: true,
    routingNote: '客户侧主档，可用于赔付、返点、客户代垫返还等业务场景。',
  },
];

export function getFinancePayeeCategoryLabel(category: FinancePayeeCategory) {
  switch (category) {
    case 'supplier':
      return '供应商';
    case 'trucking':
      return '拖车公司';
    case 'freight_forwarder':
      return '货代';
    case 'inspection_authority':
      return '商检局';
    case 'customs_broker':
      return '报关行';
    case 'testing_agency':
      return '检测机构';
    case 'inspection_service':
      return '验货服务商';
    case 'landlord':
      return '房东';
    case 'property_management':
      return '物业';
    case 'employee':
      return '员工';
    case 'social_security':
      return '医保和社保机构';
    case 'medical_insurance':
      return '医保和社保机构';
    case 'housing_fund':
      return '公积金机构';
    case 'tax_authority':
      return '税务机构';
    case 'air_ticket_service':
      return '机票服务商';
    case 'train_ticket_service':
      return '车票服务商';
    case 'hotel':
      return '饭店/酒店';
    default:
      return '其他';
  }
}

export function getFinancePayeeEntityTypeLabel(entityType: FinancePayeeEntityType) {
  return entityType === 'person' ? '个人' : '公司';
}

export function getFinancePayeePartySideLabel(partySide: FinancePayeePartySide) {
  switch (partySide) {
    case 'internal':
      return '我方';
    case 'customer':
      return '客户';
    case 'supplier':
      return '供应商';
    default:
      return '第三方';
  }
}

export function getFinancePayeeApprovalStatusLabel(status: FinancePayeeApprovalStatus) {
  return status === 'active' ? '已生效' : '待管理员授权';
}
