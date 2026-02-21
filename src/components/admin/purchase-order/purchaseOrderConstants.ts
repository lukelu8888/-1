/**
 * 🔥 采购订单管理 - 常量配置
 * 包含所有预设选项和配置常量
 */

// 🔥 16条询价条款预设选项
export const TERMS_OPTIONS = {
  currency: ['元', 'USD', 'EUR', 'GBP', 'JPY', 'CNY'],
  paymentTerms: [
    'T/T 30% 预付，70% 发货前付清',
    'T/T 50% 预付，50% 发货前付清',
    'T/T 100% 预付',
    'T/T 30天账期',
    'T/T 60天账期',
    'L/C 信用证',
    '月结30天',
    '月结60天'
  ],
  deliveryTerms: [
    'EXW 工厂交货',
    'FOB 离岸价',
    'CIF 到岸价',
    'DDP 完税交货',
    'DAP 目的地交货',
    'FCA 货交承运人'
  ],
  deliveryAddress: [
    '福建省福州市仓山区仓山工业区',
    '广东省深圳市宝安区物流园',
    '江苏省苏州市工业园区',
    '浙江省宁波市北仑港区',
    '上海市浦东新区外高桥保税区'
  ],
  deliveryRequirement: [
    '收到订单后30天内交货',
    '收到订单后45天内交货',
    '收到订单后60天内交货',
    '按批次交货，每批间隔15天',
    '紧急订单，15天内交货'
  ],
  qualityStandard: [
    '产品需符合GB/T国标，如有国际标准（ISO、CE等）请提供相关认证',
    '符合GB/T国标要求',
    '符合ISO 9001质量体系标准',
    '符合CE认证要求',
    '符合UL认证要求',
    '符合RoHS环保标准'
  ],
  inspectionMethod: [
    '到货后5%抽检，如有不合格品按比例折算退款或补货',
    '第三方检测机构验货',
    '工厂出货前验货',
    '到货后全检',
    '到货后10%抽检',
    'AQL 2.5标准抽检'
  ],
  packaging: [
    '标准出口包装，纸箱+托盘，适合长途运输',
    '标准出口包装',
    '纸箱包装',
    '木箱包装',
    '托盘包装',
    '防潮包装',
    '客户指定包装'
  ],
  shippingMarks: [
    '中性唛头，或根据客户要求定制唛头（具体要求来单确认）',
    '中性唛头',
    '客户指定唛头',
    '无唛头要求',
    '品牌唛头'
  ],
  inspectionRequirement: [
    '请在报价单中注明报价有效期和交货周期',
    '出货前第三方验货',
    '出货前工厂验货',
    '到货后验货',
    '无验货要求'
  ],
  technicalDocuments: [
    '产品说明书、检测报告、认证证书（CE/RoHS等）',
    '产品说明书',
    '检测报告',
    '认证证书',
    '质保书',
    '安装指南',
    '操作手册'
  ],
  ipRights: [
    '产品设计、商标、专利归属我方，供应商不得侵权',
    '产品设计归我方所有',
    '商标归我方所有',
    '无特殊知识产权要求',
    '按合同约定'
  ],
  confidentiality: [
    '客户信息、价格信息严格保密，不得泄露给第三方',
    '严格保密，不得泄露',
    '商业机密保密',
    '按保密协议执行',
    '一般保密要求'
  ],
  sampleRequirement: [
    '如需样品，请提供免费样品（邮费到付）',
    '需提供免费样品',
    '需提供样品（收取样品费）',
    '无样品要求',
    '样品费可退'
  ],
  moq: [
    '无最小起订量限制',
    '最小起订量100件',
    '最小起订量500件',
    '最小起订量1000件',
    '最小起订量1个20尺柜',
    '最小起订量1个40尺柜'
  ],
  remarks: [
    '其他特殊要求请在报价单中说明',
    '无特殊要求',
    '详见附件',
    '按合同约定'
  ]
};

// 🔥 状态配置
export const STATUS_CONFIG = {
  draft: { label: '草稿', color: 'bg-gray-100 text-gray-800' },
  pending: { label: '待发送', color: 'bg-yellow-100 text-yellow-800' },
  sent: { label: '已发送', color: 'bg-blue-100 text-blue-800' },
  confirmed: { label: '已确认', color: 'bg-green-100 text-green-800' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-800' }
};

// 🔥 默认表单值
export const DEFAULT_FORM_VALUES = {
  currency: '元',
  paymentTerms: 'T/T 30% 预付，70% 发货前付清',
  deliveryTerms: 'EXW 工厂交货',
  deliveryAddress: '福建省福州市仓山区仓山工业区',
  deliveryRequirement: '收到订单后30天内交货',
  qualityStandard: '产品需符合GB/T国标，如有国际标准（ISO、CE等）请提供相关认证',
  inspectionMethod: '到货后5%抽检，如有不合格品按比例折算退款或补货',
  packaging: '标准出口包装，纸箱+托盘，适合长途运输',
  shippingMarks: '中性唛头，或根据客户要求定制唛头（具体要求来单确认）',
  inspectionRequirement: '请在报价单中注明报价有效期和交货周期',
  technicalDocuments: '产品说明书、检测报告、认证证书（CE/RoHS等）',
  ipRights: '产品设计、商标、专利归属我方，供应商不得侵权',
  confidentiality: '客户信息、价格信息严格保密，不得泄露给第三方',
  sampleRequirement: '如需样品，请提供免费样品（邮费到付）',
  moq: '无最小起订量限制',
  remarks: '其他特殊要求请在报价单中说明'
};
