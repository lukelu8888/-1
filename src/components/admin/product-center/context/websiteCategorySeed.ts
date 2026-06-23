import { departments } from '../../../../data/header/departmentsData';
import { productCategories } from '../../../../data/productCategories';
import type { ProductAttribute, ProductCategory } from './types';

const TENANT = 'tenant_default';

const slugify = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);

const now = () => new Date().toISOString();
const lastWeek = () => new Date(Date.now() - 7 * 86400e3).toISOString();

const websiteCategoryNameZh: Record<string, string> = {
  'Decor & Furniture': '装饰与家具',
  'Living Room Furniture': '客厅家具',
  Sofas: '沙发',
  Sectionals: '组合沙发',
  Loveseats: '双人沙发',
  Recliners: '躺椅',
  'Coffee Tables': '茶几',
  'TV Stands': '电视柜',
  'Bedroom Furniture': '卧室家具',
  Beds: '床',
  Dressers: '梳妆柜',
  Nightstands: '床头柜',
  Armoires: '衣柜',
  'Bedroom Sets': '卧室套装',
  'Dining Room Furniture': '餐厅家具',
  'Dining Tables': '餐桌',
  'Dining Chairs': '餐椅',
  'Bar Stools': '吧椅',
  Buffets: '餐边柜',
  'China Cabinets': '餐具柜',
  'Home Decor': '家居装饰',
  'Wall Art': '墙面艺术',
  'Decorative Pillows': '装饰枕',
  Throws: '毯子',
  Vases: '花瓶',
  Candles: '蜡烛',
  'Rugs & Area Carpets': '地毯与区域毯',
  'Area Rugs': '区域毯',
  'Runner Rugs': '走廊毯',
  'Outdoor Rugs': '户外地毯',
  'Rug Pads': '地毯垫',
  'Window Treatments': '窗饰',
  Curtains: '窗帘',
  Blinds: '百叶窗',
  Shades: '遮光帘',
  Drapes: '帷幔',
  Valances: '窗幔',
  'Wall Art & Mirrors': '墙饰与镜子',
  'Framed Art': '装框画',
  'Canvas Art': '帆布画',
  'Wall Mirrors': '墙镜',
  'Wall Decals': '墙贴',
  'Lighting Fixtures': '照明灯具',
  Chandeliers: '枝形吊灯',
  'Pendant Lights': '吊灯',
  'Table Lamps': '台灯',
  'Floor Lamps': '落地灯',
  'Decorative Accents': '装饰摆件',
  'Decorative Bowls': '装饰碗',
  Sculptures: '雕塑摆件',
  Clocks: '时钟',
  'Photo Frames': '相框',
  'Seasonal Decor': '季节装饰',
  'Holiday Decor': '节日装饰',
  'Seasonal Wreaths': '季节花环',
  'Outdoor Decorations': '户外装饰',
  'Lighting & Fans': '照明与风扇',
  'Ceiling Lights': '吸顶灯',
  'Flush Mount': '贴顶灯',
  'Semi-Flush Mount': '半吸顶灯',
  'Ceiling Fans with Lights': '带灯吊扇',
  'Chandeliers & Pendants': '吊灯与垂灯',
  'Crystal Chandeliers': '水晶吊灯',
  'Modern Pendants': '现代吊灯',
  'Island Lights': '岛台灯',
  'Wall Sconces': '壁灯',
  'Indoor Sconces': '室内壁灯',
  'Outdoor Sconces': '户外壁灯',
  'Vanity Lights': '浴室镜前灯',
  'Track & Rail Lighting': '轨道照明',
  'Track Lighting Kits': '轨道灯套装',
  'Track Heads': '轨道灯头',
  'Monorail Systems': '单轨照明系统',
  'Recessed Lighting': '嵌入式照明',
  'Recessed Cans': '嵌入式灯筒',
  'Recessed Trims': '嵌入式灯圈',
  'Retrofit Kits': '改装套件',
  'Path Lights': '路径灯',
  Spotlights: '射灯',
  'Post Lights': '柱头灯',
  'String Lights': '串灯',
  'Indoor Fans': '室内风扇',
  'Outdoor Fans': '户外风扇',
  'Fan Accessories': '风扇配件',
  'LED Bulbs': 'LED 灯泡',
  'CFL Bulbs': '节能灯泡',
  'Smart Bulbs': '智能灯泡',
  'Specialty Bulbs': '特种灯泡',
  'Lamp Shades': '灯罩',
  'Drum Shades': '鼓形灯罩',
  'Empire Shades': '帝国形灯罩',
  'Bell Shades': '钟形灯罩',
  'Smart Lighting': '智能照明',
  'Smart Switches': '智能开关',
  'Lighting Controllers': '照明控制器',
  'Outdoor Living': '户外生活',
  'Patio Furniture': '庭院家具',
  'Patio Sets': '庭院套装',
  'Lounge Chairs': '躺椅',
  'Outdoor Sofas': '户外沙发',
  'Adirondack Chairs': '阿迪朗达克椅',
  'Grills & Outdoor Cooking': '烧烤与户外烹饪',
  'Gas Grills': '燃气烤炉',
  'Charcoal Grills': '炭烤炉',
  'Pellet Grills': '颗粒烤炉',
  Smokers: '烟熏炉',
  'Outdoor Heating': '户外取暖',
  'Patio Heaters': '庭院取暖器',
  'Fire Tables': '火炉桌',
  Chimineas: '户外壁炉',
  'Gazebos & Pergolas': '凉亭与花架',
  Gazebos: '凉亭',
  Pergolas: '花架',
  Pavilions: '亭阁',
  Canopies: '遮阳棚',
  'Patio Umbrellas': '庭院伞',
  'Market Umbrellas': '市集伞',
  'Cantilever Umbrellas': '悬臂伞',
  'Umbrella Bases': '伞座',
  'Outdoor Cushions': '户外坐垫',
  'Chair Cushions': '椅垫',
  'Bench Cushions': '长凳垫',
  'Pillow Sets': '抱枕套装',
  'Fire Pits & Fireplaces': '火盆与户外壁炉',
  'Wood Fire Pits': '木燃火盆',
  'Gas Fire Pits': '燃气火盆',
  'Outdoor Fireplaces': '户外壁炉',
  'Outdoor Storage': '户外收纳',
  'Deck Boxes': '露台收纳箱',
  Sheds: '储物棚',
  'Storage Benches': '收纳长凳',
  'Playsets & Trampolines': '游乐架与蹦床',
  'Swing Sets': '秋千组合',
  Trampolines: '蹦床',
  Playhouses: '儿童游戏屋',
  'Outdoor Décor': '户外装饰',
  'Garden Statues': '花园雕像',
  Fountains: '喷泉',
  Planters: '花盆',
  'Wind Chimes': '风铃',
  'Windows & Doors': '门窗',
  'Entry Doors': '入户门',
  'French Doors': '法式对开门',
  'Sliding Doors': '推拉门',
  'Storm Doors': '防风门',
  'Garage Doors': '车库门',
  'Full View Storm Doors': '全景防风门',
  'Retractable Screen Doors': '可伸缩纱门',
  'Sectional Doors': '分段车库门',
  'Garage Door Openers': '车库门开门器',
  'Garage Door Parts': '车库门配件',
  'Door Handles': '门把手',
  'Door Frames & Jambs': '门框与门套',
  'Door Frames': '门框',
  'Door Jambs': '门套',
  'Door Trim': '门线条',
  Shutters: '百叶窗板',
  'Weather Stripping': '门窗密封条',
  'Door Sweeps': '门底密封条',
  'Weather Strip': '密封条',
  'Door Seals': '门密封件',
};

const integratedDepartments: Record<string, string> = {
  'Lighting & Fans': 'electrical.lighting-ceiling-fans',
  'Windows & Doors': 'doors-windows',
};

const normalizeName = (value: string) => slugify(value).replace(/^windows-and-doors$/, 'doors-and-windows');

const makeCategory = (
  path: string[],
  level: number,
  sortOrder: number,
  name: string,
  nameEn: string,
  parentId: string | null,
): ProductCategory => {
  const code = path.join('.');
  return {
    id: `cat_${path.join('_')}`,
    tenantId: TENANT,
    parentId,
    level,
    code,
    name,
    nameEn,
    sortOrder,
    isActive: true,
    seoTitle: level === 1 ? `Wholesale ${nameEn}` : undefined,
    seoDescription: level === 1 ? `Bulk ${nameEn} products for B2B and contractor markets.` : undefined,
    createdAt: lastWeek(),
    updatedAt: now(),
  };
};

const findCategoryByCode = (categories: ProductCategory[], code: string) =>
  categories.find((category) => category.code === code);

const findChildByEnglishName = (categories: ProductCategory[], parentId: string, nameEn: string) =>
  categories.find(
    (category) => category.parentId === parentId && normalizeName(category.nameEn || category.name) === normalizeName(nameEn),
  );

const nextSortOrder = (categories: ProductCategory[], parentId: string | null) =>
  Math.max(0, ...categories.filter((category) => category.parentId === parentId).map((category) => category.sortOrder)) + 1;

const addWebsiteChild = (
  categories: ProductCategory[],
  parent: ProductCategory,
  nameEn: string,
  pathSegment: string,
): ProductCategory => {
  const existing = findChildByEnglishName(categories, parent.id, nameEn);
  if (existing) return existing;

  const path = [...parent.code.split('.'), pathSegment];
  const child = makeCategory(
    path,
    parent.level + 1,
    nextSortOrder(categories, parent.id),
    websiteCategoryNameZh[nameEn] ?? nameEn,
    nameEn,
    parent.id,
  );
  categories.push(child);
  return child;
};

const mergeWebsiteDepartmentInto = (
  categories: ProductCategory[],
  departmentName: string,
  targetCode: string,
) => {
  const department = departments.find((item) => item.name === departmentName);
  const parent = findCategoryByCode(categories, targetCode);
  if (!department || !parent) return;

  department.subcategories.forEach((subcategory) => {
    const subcategoryNode = addWebsiteChild(
      categories,
      parent,
      subcategory.name,
      slugify(subcategory.name) || `subcategory-${nextSortOrder(categories, parent.id)}`,
    );

    subcategory.items.forEach((item) => {
      addWebsiteChild(
        categories,
        subcategoryNode,
        item,
        slugify(item) || `leaf-${nextSortOrder(categories, subcategoryNode.id)}`,
      );
    });
  });
};

export const buildWebsiteCategories = (): ProductCategory[] => {
  const categories: ProductCategory[] = [];
  const seenTopLevelNames = new Set<string>();

  productCategories.forEach((level1, l1Index) => {
    const l1Path = [level1.id];
    const l1 = makeCategory(l1Path, 1, l1Index + 1, level1.label, level1.enLabel, null);
    categories.push(l1);
    seenTopLevelNames.add(level1.enLabel.toLowerCase());

    level1.categories.forEach((level2, l2Index) => {
      const l2Path = [...l1Path, level2.id];
      const l2 = makeCategory(l2Path, 2, l2Index + 1, level2.label, level2.enLabel, l1.id);
      categories.push(l2);

      level2.subCategories.forEach((level3, l3Index) => {
        const l3Path = [...l2Path, level3.id];
        categories.push(makeCategory(l3Path, 3, l3Index + 1, level3.label, level3.enLabel, l2.id));
      });
    });
  });

  Object.entries(integratedDepartments).forEach(([departmentName, targetCode]) => {
    mergeWebsiteDepartmentInto(categories, departmentName, targetCode);
    seenTopLevelNames.add(departmentName.toLowerCase());
  });

  departments
    .filter((department) => !seenTopLevelNames.has(department.name.toLowerCase()))
    .forEach((department, departmentIndex) => {
      const l1Id = slugify(department.name) || `website-department-${departmentIndex + 1}`;
      const l1Path = [l1Id];
      const l1 = makeCategory(
        l1Path,
        1,
        productCategories.length + departmentIndex + 1,
        websiteCategoryNameZh[department.name] ?? department.name,
        department.name,
        null,
      );
      categories.push(l1);

      department.subcategories.forEach((subcategory, subcategoryIndex) => {
        const l2Id = slugify(subcategory.name) || `subcategory-${subcategoryIndex + 1}`;
        const l2Path = [...l1Path, l2Id];
        const l2 = makeCategory(
          l2Path,
          2,
          subcategoryIndex + 1,
          websiteCategoryNameZh[subcategory.name] ?? subcategory.name,
          subcategory.name,
          l1.id,
        );
        categories.push(l2);

        subcategory.items.forEach((item, itemIndex) => {
          const l3Id = slugify(item) || `leaf-${itemIndex + 1}`;
          categories.push(
            makeCategory([...l2Path, l3Id], 3, itemIndex + 1, websiteCategoryNameZh[item] ?? item, item, l2.id),
          );
        });
      });
    });

  return categories;
};

const categoryIdsWhere = (categories: ProductCategory[], predicate: (category: ProductCategory) => boolean) =>
  categories.filter(predicate).map((category) => category.id);

export const buildWebsiteAttributes = (categories: ProductCategory[]): ProductAttribute[] => {
  const allCategoryIds = categories.map((category) => category.id);
  const electricalIds = categoryIdsWhere(categories, (category) =>
    /electrical|lighting|appliance|heating|cooling|tools/.test(category.code),
  );
  const surfaceIds = categoryIdsWhere(categories, (category) =>
    /bath|flooring|hardware|doors-windows|kitchen|paint|plumbing|building-materials|decor-furniture/.test(
      category.code,
    ),
  );
  const logisticsIds = categoryIdsWhere(categories, (category) => category.level >= 2);
  const timestamp = now();
  const createdAt = lastWeek();

  return [
    {
      id: 'attr_color',
      tenantId: TENANT,
      code: 'color',
      label: '颜色',
      dataType: 'enum',
      options: ['白色', '黑色', '银灰', '香槟金', '木纹色', '透明'],
      isFilterable: true,
      includeInImport: true,
      appliesToCategoryIds: allCategoryIds,
      sortOrder: 1,
      createdAt,
      updatedAt: timestamp,
    },
    {
      id: 'attr_voltage',
      tenantId: TENANT,
      code: 'voltage',
      label: '电压',
      dataType: 'enum',
      unit: 'V',
      options: ['110V', '120V', '220V', '230V', '110-240V'],
      isFilterable: true,
      includeInImport: true,
      appliesToCategoryIds: electricalIds,
      sortOrder: 2,
      createdAt,
      updatedAt: timestamp,
    },
    {
      id: 'attr_material',
      tenantId: TENANT,
      code: 'material',
      label: '材质',
      dataType: 'text',
      isFilterable: true,
      includeInImport: true,
      appliesToCategoryIds: allCategoryIds,
      sortOrder: 3,
      createdAt,
      updatedAt: timestamp,
    },
    {
      id: 'attr_finish',
      tenantId: TENANT,
      code: 'finish',
      label: '表面处理',
      dataType: 'enum',
      options: ['哑光', '亮光', '拉丝', '喷粉', '电镀', '未处理'],
      isFilterable: true,
      includeInImport: true,
      appliesToCategoryIds: surfaceIds,
      sortOrder: 4,
      createdAt,
      updatedAt: timestamp,
    },
    {
      id: 'attr_power_wattage',
      tenantId: TENANT,
      code: 'power_wattage',
      label: '功率',
      dataType: 'number',
      unit: 'W',
      isFilterable: true,
      includeInImport: true,
      appliesToCategoryIds: electricalIds,
      sortOrder: 5,
      createdAt,
      updatedAt: timestamp,
    },
    {
      id: 'attr_pack_size',
      tenantId: TENANT,
      code: 'pack_size',
      label: '包装规格',
      dataType: 'text',
      isFilterable: false,
      includeInImport: true,
      appliesToCategoryIds: logisticsIds,
      sortOrder: 6,
      createdAt,
      updatedAt: timestamp,
    },
  ];
};
