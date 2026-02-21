/**
 * 🏭 行业分类模板
 * - 供应商首次使用时选择行业
 * - 自动初始化该行业的标准产品分类
 */

export interface IndustryTemplate {
  id: string;
  name: string;
  nameEn: string;
  icon: string;
  description: string;
  categories: string[];
}

export const industryTemplates: IndustryTemplate[] = [
  {
    id: 'tiles',
    name: '建材-瓷砖',
    nameEn: 'Tiles & Ceramics',
    icon: '🏛️',
    description: '瓷砖、地砖、墙砖、装饰砖等建筑陶瓷产品',
    categories: [
      '抛光砖',
      '大理石瓷砖',
      '木纹砖',
      '马赛克',
      '仿古砖',
      '通体砖',
      '全抛釉',
      '微晶石',
      '外墙砖',
      '文化砖'
    ]
  },
  {
    id: 'locks',
    name: '锁具五金',
    nameEn: 'Locks & Hardware',
    icon: '🔐',
    description: '智能锁、机械锁、锁芯、门锁配件等安防产品',
    categories: [
      '智能锁',
      '机械锁',
      '锁芯',
      '锁体',
      '门锁配件',
      '挂锁',
      '抽屉锁',
      '特殊锁具',
      '门禁系统',
      '锁具配件'
    ]
  },
  {
    id: 'bathroom',
    name: '卫浴陶瓷',
    nameEn: 'Bathroom & Sanitary',
    icon: '🚿',
    description: '马桶、洗手盆、淋浴房、龙头花洒等卫浴产品',
    categories: [
      '马桶',
      '洗手盆',
      '淋浴房',
      '龙头花洒',
      '五金挂件',
      '浴室柜',
      '蹲便器',
      '小便斗',
      '卫浴配件',
      '智能卫浴'
    ]
  },
  {
    id: 'door-window',
    name: '门窗配件',
    nameEn: 'Door & Window Hardware',
    icon: '🪟',
    description: '门窗五金、铝材、玻璃配件等建筑门窗产品',
    categories: [
      '铝合金门窗',
      '塑钢门窗',
      '门窗五金',
      '密封条',
      '玻璃配件',
      '门窗框料',
      '滑轮滑轨',
      '门窗拉手',
      '合页铰链',
      '门窗锁具'
    ]
  },
  {
    id: 'electrical',
    name: '电气配件',
    nameEn: 'Electrical Components',
    icon: '⚡',
    description: '开关插座、电线电缆、照明配件等电气产品',
    categories: [
      '开关插座',
      '电线电缆',
      '照明配件',
      '配电箱',
      '断路器',
      '接线端子',
      '电气保护',
      '智能电气',
      '线槽线管',
      '电气配件'
    ]
  },
  {
    id: 'safety',
    name: '劳保用品',
    nameEn: 'Safety & PPE',
    icon: '🦺',
    description: '安全帽、防护服、安全鞋、劳保手套等劳保产品',
    categories: [
      '安全帽',
      '防护服',
      '安全鞋',
      '劳保手套',
      '防护眼镜',
      '防护口罩',
      '安全带',
      '防护面罩',
      '劳保配件',
      '应急装备'
    ]
  },
  {
    id: 'furniture',
    name: '家具五金',
    nameEn: 'Furniture Hardware',
    icon: '🪑',
    description: '铰链、滑轨、拉手、脚轮等家具配件',
    categories: [
      '铰链',
      '滑轨',
      '拉手把手',
      '脚轮',
      '连接件',
      '支撑件',
      '升降系统',
      '缓冲器',
      '锁具',
      '装饰件'
    ]
  },
  {
    id: 'plumbing',
    name: '管道配件',
    nameEn: 'Plumbing Fittings',
    icon: '🔧',
    description: '水管、阀门、接头、密封件等管道系统产品',
    categories: [
      'PPR水管',
      'PVC管材',
      '阀门',
      '管道接头',
      '密封圈',
      '管卡管夹',
      '管道配件',
      '排水系统',
      '供水系统',
      '管道工具'
    ]
  },
  {
    id: 'custom',
    name: '自定义',
    nameEn: 'Custom Setup',
    icon: '⚙️',
    description: '完全自定义产品分类，适合特殊行业或多元化产品',
    categories: []
  }
];

/**
 * 🔍 根据行业ID获取模板
 */
export function getIndustryTemplate(industryId: string): IndustryTemplate | undefined {
  return industryTemplates.find(t => t.id === industryId);
}

/**
 * 💾 保存供应商的产品分类配置
 */
export function saveSupplierCategories(categories: string[]) {
  try {
    localStorage.setItem('supplier_product_categories', JSON.stringify(categories));
    console.log('✅ 产品分类已保存:', categories);
  } catch (error) {
    console.error('❌ 保存产品分类失败:', error);
  }
}

/**
 * 📖 读取供应商的产品分类配置
 */
export function loadSupplierCategories(): string[] {
  try {
    const saved = localStorage.getItem('supplier_product_categories');
    if (saved) {
      const categories = JSON.parse(saved);
      console.log('📖 已加载产品分类:', categories);
      return categories;
    }
  } catch (error) {
    console.error('❌ 读取产品分类失败:', error);
  }
  return [];
}

/**
 * 🔍 检查是否已完成行业初始化
 */
export function isIndustryInitialized(): boolean {
  const initialized = localStorage.getItem('supplier_industry_initialized');
  return initialized === 'true';
}

/**
 * ✅ 标记行业初始化完成
 */
export function markIndustryInitialized() {
  localStorage.setItem('supplier_industry_initialized', 'true');
  console.log('✅ 行业初始化已完成');
}

/**
 * 🔄 重置行业初始化（用于测试）
 */
export function resetIndustryInitialization() {
  localStorage.removeItem('supplier_industry_initialized');
  localStorage.removeItem('supplier_product_categories');
  localStorage.removeItem('supplier_selected_industry');
  console.log('🔄 行业初始化已重置');
}

/**
 * 💾 保存选择的行业
 */
export function saveSelectedIndustry(industryId: string) {
  localStorage.setItem('supplier_selected_industry', industryId);
}

/**
 * 📖 读取选择的行业
 */
export function loadSelectedIndustry(): string | null {
  return localStorage.getItem('supplier_selected_industry');
}
