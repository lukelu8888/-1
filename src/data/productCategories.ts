// 基于Home Depot等大型建材零售商的行业标准分类结构
// 适配B2B外贸建材网站的完整类目体系

export interface CategoryLevel3 {
  id: string;
  label: string;
  enLabel: string;
}

export interface CategoryLevel2 {
  id: string;
  label: string;
  enLabel: string;
  subCategories: CategoryLevel3[];
}

export interface CategoryLevel1 {
  id: string;
  label: string;
  enLabel: string;
  iconName?: string; // 图标名称，在组件中映射到实际图标
  categories: CategoryLevel2[];
}

export const productCategories: CategoryLevel1[] = [
  {
    id: 'appliances',
    label: '家用电器',
    enLabel: 'Appliances',
    categories: [
      {
        id: 'kitchen-appliances',
        label: '厨房电器',
        enLabel: 'Kitchen Appliances',
        subCategories: [
          { id: 'refrigerators', label: '冰箱', enLabel: 'Refrigerators' },
          { id: 'dishwashers', label: '洗碗机', enLabel: 'Dishwashers' },
          { id: 'ranges', label: '烤箱炉灶', enLabel: 'Ranges' },
          { id: 'microwaves', label: '微波炉', enLabel: 'Microwaves' },
          { id: 'range-hoods', label: '抽油烟机', enLabel: 'Range Hoods' },
          { id: 'garbage-disposals', label: '垃圾处理器', enLabel: 'Garbage Disposals' }
        ]
      },
      {
        id: 'laundry',
        label: '洗衣设备',
        enLabel: 'Laundry',
        subCategories: [
          { id: 'washers', label: '洗衣机', enLabel: 'Washers' },
          { id: 'dryers', label: '烘干机', enLabel: 'Dryers' },
          { id: 'washer-dryer-combos', label: '洗烘一体机', enLabel: 'Washer & Dryer Combos' },
          { id: 'laundry-accessories', label: '洗衣配件', enLabel: 'Laundry Accessories' }
        ]
      },
      {
        id: 'heating-cooling',
        label: '供暖制冷',
        enLabel: 'Heating & Cooling',
        subCategories: [
          { id: 'air-conditioners', label: '空调', enLabel: 'Air Conditioners' },
          { id: 'heaters', label: '加热器', enLabel: 'Heaters' },
          { id: 'fans', label: '风扇', enLabel: 'Fans' },
          { id: 'thermostats', label: '温控器', enLabel: 'Thermostats' },
          { id: 'air-purifiers', label: '空气净化器', enLabel: 'Air Purifiers' },
          { id: 'dehumidifiers', label: '除湿机', enLabel: 'Dehumidifiers' }
        ]
      }
    ]
  },
  {
    id: 'bath',
    label: '卫浴洁具',
    enLabel: 'Bath',
    categories: [
      {
        id: 'toilets-seats',
        label: '马桶座便器',
        enLabel: 'Toilets & Toilet Seats',
        subCategories: [
          { id: 'toilets', label: '马桶', enLabel: 'Toilets' },
          { id: 'toilet-seats', label: '马桶座圈', enLabel: 'Toilet Seats' },
          { id: 'bidets', label: '智能坐便器', enLabel: 'Bidets & Bidet Seats' },
          { id: 'urinals', label: '小便器', enLabel: 'Urinals' }
        ]
      },
      {
        id: 'faucets',
        label: '水龙头',
        enLabel: 'Faucets',
        subCategories: [
          { id: 'bathroom-faucets', label: '浴室龙头', enLabel: 'Bathroom Faucets' },
          { id: 'kitchen-faucets', label: '厨房龙头', enLabel: 'Kitchen Faucets' },
          { id: 'tub-shower-faucets', label: '浴缸淋浴龙头', enLabel: 'Tub & Shower Faucets' },
          { id: 'utility-faucets', label: '工用龙头', enLabel: 'Utility Faucets' },
          { id: 'faucet-parts', label: '龙头配件', enLabel: 'Faucet Parts & Repair' }
        ]
      },
      {
        id: 'sinks',
        label: '水槽洗手盆',
        enLabel: 'Sinks',
        subCategories: [
          { id: 'bathroom-sinks', label: '浴室洗手盆', enLabel: 'Bathroom Sinks' },
          { id: 'kitchen-sinks', label: '厨房水槽', enLabel: 'Kitchen Sinks' },
          { id: 'utility-sinks', label: '工用水槽', enLabel: 'Utility Sinks' },
          { id: 'sink-accessories', label: '水槽配件', enLabel: 'Sink Accessories' }
        ]
      },
      {
        id: 'showers',
        label: '淋浴花洒',
        enLabel: 'Showers',
        subCategories: [
          { id: 'shower-heads', label: '淋浴花洒头', enLabel: 'Shower Heads' },
          { id: 'shower-systems', label: '淋浴系统', enLabel: 'Shower Systems' },
          { id: 'shower-doors', label: '淋浴门', enLabel: 'Shower Doors' },
          { id: 'shower-panels', label: '淋浴隔板', enLabel: 'Shower Panels' },
          { id: 'shower-bases', label: '淋浴底盆', enLabel: 'Shower Bases' }
        ]
      },
      {
        id: 'bathtubs',
        label: '浴缸',
        enLabel: 'Bathtubs',
        subCategories: [
          { id: 'alcove-tubs', label: '嵌入式浴缸', enLabel: 'Alcove Bathtubs' },
          { id: 'freestanding-tubs', label: '独立式浴缸', enLabel: 'Freestanding Bathtubs' },
          { id: 'whirlpool-tubs', label: '按摩浴缸', enLabel: 'Whirlpool Tubs' },
          { id: 'tub-accessories', label: '浴缸配件', enLabel: 'Bathtub Accessories' }
        ]
      },
      {
        id: 'vanities',
        label: '浴室柜',
        enLabel: 'Vanities',
        subCategories: [
          { id: 'bathroom-vanities', label: '浴室梳妆台', enLabel: 'Bathroom Vanities' },
          { id: 'vanity-tops', label: '台面', enLabel: 'Vanity Tops' },
          { id: 'medicine-cabinets', label: '药柜', enLabel: 'Medicine Cabinets' },
          { id: 'mirrors', label: '镜子', enLabel: 'Bathroom Mirrors' }
        ]
      },
      {
        id: 'bath-accessories',
        label: '卫浴配件',
        enLabel: 'Bath Accessories',
        subCategories: [
          { id: 'towel-bars', label: '毛巾架', enLabel: 'Towel Bars & Hooks' },
          { id: 'toilet-paper-holders', label: '纸巾架', enLabel: 'Toilet Paper Holders' },
          { id: 'soap-dispensers', label: '皂液器', enLabel: 'Soap Dispensers' },
          { id: 'shower-caddies', label: '置物架', enLabel: 'Shower Caddies' },
          { id: 'bath-hardware', label: '卫浴五金', enLabel: 'Bathroom Hardware' }
        ]
      }
    ]
  },
  {
    id: 'building-materials',
    label: '建筑材料',
    enLabel: 'Building Materials',
    categories: [
      {
        id: 'lumber',
        label: '木材',
        enLabel: 'Lumber & Composites',
        subCategories: [
          { id: 'dimensional-lumber', label: '规格材', enLabel: 'Dimensional Lumber' },
          { id: 'plywood', label: '胶合板', enLabel: 'Plywood' },
          { id: 'osb', label: 'OSB板材', enLabel: 'OSB' },
          { id: 'mdf', label: 'MDF密度板', enLabel: 'MDF' },
          { id: 'hardwood', label: '硬木', enLabel: 'Hardwood' },
          { id: 'treated-lumber', label: '防腐木', enLabel: 'Pressure Treated Lumber' }
        ]
      },
      {
        id: 'concrete-cement',
        label: '混凝土水泥',
        enLabel: 'Concrete & Cement',
        subCategories: [
          { id: 'cement', label: '水泥', enLabel: 'Cement' },
          { id: 'concrete-mix', label: '混凝土', enLabel: 'Concrete Mix' },
          { id: 'mortar', label: '砂浆', enLabel: 'Mortar' },
          { id: 'grout', label: '灌浆料', enLabel: 'Grout' },
          { id: 'concrete-blocks', label: '混凝土砌块', enLabel: 'Concrete Blocks' }
        ]
      },
      {
        id: 'insulation',
        label: '保温隔热',
        enLabel: 'Insulation',
        subCategories: [
          { id: 'fiberglass-insulation', label: '玻璃纤维保温', enLabel: 'Fiberglass Insulation' },
          { id: 'foam-insulation', label: '泡沫保温', enLabel: 'Foam Insulation' },
          { id: 'reflective-insulation', label: '反射保温', enLabel: 'Reflective Insulation' },
          { id: 'weatherstripping', label: '密封条', enLabel: 'Weatherstripping' }
        ]
      },
      {
        id: 'drywall',
        label: '石膏板',
        enLabel: 'Drywall',
        subCategories: [
          { id: 'drywall-panels', label: '石膏板材', enLabel: 'Drywall Panels' },
          { id: 'joint-compound', label: '接缝腻子', enLabel: 'Joint Compound' },
          { id: 'drywall-tape', label: '石膏板胶带', enLabel: 'Drywall Tape' },
          { id: 'drywall-tools', label: '石膏板工具', enLabel: 'Drywall Tools' }
        ]
      },
      {
        id: 'roofing',
        label: '屋顶材料',
        enLabel: 'Roofing',
        subCategories: [
          { id: 'shingles', label: '瓦片', enLabel: 'Shingles' },
          { id: 'roof-underlayment', label: '防水层', enLabel: 'Roof Underlayment' },
          { id: 'flashing', label: '泛水板', enLabel: 'Flashing' },
          { id: 'gutters', label: '排水沟', enLabel: 'Gutters & Accessories' }
        ]
      },
      {
        id: 'siding',
        label: '外墙装饰',
        enLabel: 'Siding',
        subCategories: [
          { id: 'vinyl-siding', label: '乙烯基壁板', enLabel: 'Vinyl Siding' },
          { id: 'fiber-cement', label: '纤维水泥板', enLabel: 'Fiber Cement Siding' },
          { id: 'wood-siding', label: '木质壁板', enLabel: 'Wood Siding' },
          { id: 'trim', label: '装饰条', enLabel: 'Trim & Molding' }
        ]
      }
    ]
  },
  {
    id: 'doors-windows',
    label: '门窗',
    enLabel: 'Doors & Windows',
    categories: [
      {
        id: 'interior-doors',
        label: '室内门',
        enLabel: 'Interior Doors',
        subCategories: [
          { id: 'panel-doors', label: '板式门', enLabel: 'Panel Doors' },
          { id: 'french-doors', label: '法式对开门', enLabel: 'French Doors' },
          { id: 'barn-doors', label: '谷仓门', enLabel: 'Barn Doors' },
          { id: 'pocket-doors', label: '推拉门', enLabel: 'Pocket Doors' },
          { id: 'bifold-doors', label: '折叠门', enLabel: 'Bifold Doors' }
        ]
      },
      {
        id: 'exterior-doors',
        label: '外门',
        enLabel: 'Exterior Doors',
        subCategories: [
          { id: 'front-doors', label: '前门', enLabel: 'Front Doors' },
          { id: 'patio-doors', label: '庭院门', enLabel: 'Patio Doors' },
          { id: 'storm-doors', label: '防风门', enLabel: 'Storm Doors' },
          { id: 'security-doors', label: '防盗门', enLabel: 'Security Doors' },
          { id: 'garage-doors', label: '车库门', enLabel: 'Garage Doors' }
        ]
      },
      {
        id: 'windows',
        label: '窗户',
        enLabel: 'Windows',
        subCategories: [
          { id: 'double-hung', label: '双悬窗', enLabel: 'Double Hung Windows' },
          { id: 'casement', label: '平开窗', enLabel: 'Casement Windows' },
          { id: 'sliding', label: '推拉窗', enLabel: 'Sliding Windows' },
          { id: 'awning', label: '上悬窗', enLabel: 'Awning Windows' },
          { id: 'bay-bow', label: '凸窗', enLabel: 'Bay & Bow Windows' },
          { id: 'skylights', label: '天窗', enLabel: 'Skylights' }
        ]
      },
      {
        id: 'door-hardware',
        label: '门五金',
        enLabel: 'Door Hardware',
        subCategories: [
          { id: 'door-locks', label: '门锁', enLabel: 'Door Locks' },
          { id: 'door-knobs', label: '门把手', enLabel: 'Door Knobs' },
          { id: 'door-levers', label: '门拉手', enLabel: 'Door Levers' },
          { id: 'deadbolts', label: '插销锁', enLabel: 'Deadbolts' },
          { id: 'hinges', label: '铰链', enLabel: 'Hinges' },
          { id: 'door-closers', label: '闭门器', enLabel: 'Door Closers' }
        ]
      },
      {
        id: 'window-hardware',
        label: '窗户五金',
        enLabel: 'Window Hardware',
        subCategories: [
          { id: 'window-locks', label: '窗锁', enLabel: 'Window Locks' },
          { id: 'window-handles', label: '窗把手', enLabel: 'Window Handles' },
          { id: 'window-screens', label: '纱窗', enLabel: 'Window Screens' },
          { id: 'blinds-shades', label: '百叶窗', enLabel: 'Blinds & Shades' }
        ]
      }
    ]
  },
  {
    id: 'electrical',
    label: '电气照明',
    enLabel: 'Electrical',
    categories: [
      {
        id: 'lighting-ceiling-fans',
        label: '照明灯具',
        enLabel: 'Lighting & Ceiling Fans',
        subCategories: [
          { id: 'indoor-lighting', label: '室内照明', enLabel: 'Indoor Lighting' },
          { id: 'outdoor-lighting', label: '室外照明', enLabel: 'Outdoor Lighting' },
          { id: 'ceiling-fans', label: '吊扇', enLabel: 'Ceiling Fans' },
          { id: 'light-bulbs', label: '灯泡', enLabel: 'Light Bulbs' },
          { id: 'landscape-lighting', label: '景观照明', enLabel: 'Landscape Lighting' },
          { id: 'led-strip-lights', label: 'LED灯带', enLabel: 'LED Strip Lights' }
        ]
      },
      {
        id: 'outlets-switches',
        label: '插座开关',
        enLabel: 'Outlets & Switches',
        subCategories: [
          { id: 'wall-outlets', label: '墙壁插座', enLabel: 'Wall Outlets' },
          { id: 'light-switches', label: '开关', enLabel: 'Light Switches' },
          { id: 'dimmers', label: '调光器', enLabel: 'Dimmers' },
          { id: 'gfci-outlets', label: '漏电保护插座', enLabel: 'GFCI Outlets' },
          { id: 'usb-outlets', label: 'USB插座', enLabel: 'USB Outlets' },
          { id: 'smart-switches', label: '智能开关', enLabel: 'Smart Switches' }
        ]
      },
      {
        id: 'electrical-boxes',
        label: '电气盒',
        enLabel: 'Electrical Boxes & Covers',
        subCategories: [
          { id: 'junction-boxes', label: '接线盒', enLabel: 'Junction Boxes' },
          { id: 'outlet-boxes', label: '插座盒', enLabel: 'Outlet Boxes' },
          { id: 'wall-plates', label: '面板', enLabel: 'Wall Plates' },
          { id: 'conduit', label: '线管', enLabel: 'Conduit' }
        ]
      },
      {
        id: 'wire-cable',
        label: '电线电缆',
        enLabel: 'Wire & Cable',
        subCategories: [
          { id: 'electrical-wire', label: '电线', enLabel: 'Electrical Wire' },
          { id: 'extension-cords', label: '延长线', enLabel: 'Extension Cords' },
          { id: 'cable-ties', label: '扎带', enLabel: 'Cable Ties & Accessories' },
          { id: 'wire-connectors', label: '接线端子', enLabel: 'Wire Connectors' }
        ]
      },
      {
        id: 'circuit-breakers',
        label: '断路器',
        enLabel: 'Circuit Breakers & Panels',
        subCategories: [
          { id: 'breakers', label: '断路器', enLabel: 'Circuit Breakers' },
          { id: 'load-centers', label: '配电箱', enLabel: 'Load Centers' },
          { id: 'fuses', label: '保险丝', enLabel: 'Fuses' },
          { id: 'surge-protectors', label: '浪涌保护器', enLabel: 'Surge Protectors' }
        ]
      }
    ]
  },
  {
    id: 'flooring',
    label: '地板地材',
    enLabel: 'Flooring',
    categories: [
      {
        id: 'hardwood-flooring',
        label: '实木地板',
        enLabel: 'Hardwood Flooring',
        subCategories: [
          { id: 'solid-hardwood', label: '纯实木', enLabel: 'Solid Hardwood' },
          { id: 'engineered-hardwood', label: '工程木', enLabel: 'Engineered Hardwood' },
          { id: 'bamboo', label: '竹地板', enLabel: 'Bamboo Flooring' }
        ]
      },
      {
        id: 'laminate-flooring',
        label: '强化地板',
        enLabel: 'Laminate Flooring',
        subCategories: [
          { id: 'ac-rated', label: 'AC等级地板', enLabel: 'AC Rated Laminate' },
          { id: 'waterproof-laminate', label: '防水强化', enLabel: 'Waterproof Laminate' }
        ]
      },
      {
        id: 'vinyl-flooring',
        label: '乙烯基地板',
        enLabel: 'Vinyl Flooring',
        subCategories: [
          { id: 'luxury-vinyl-plank', label: 'LVP豪华乙烯基', enLabel: 'Luxury Vinyl Plank (LVP)' },
          { id: 'vinyl-tile', label: '乙烯基瓷砖', enLabel: 'Vinyl Tile' },
          { id: 'sheet-vinyl', label: '卷材乙烯基', enLabel: 'Sheet Vinyl' }
        ]
      },
      {
        id: 'tile-flooring',
        label: '瓷砖地板',
        enLabel: 'Tile Flooring',
        subCategories: [
          { id: 'ceramic-tile', label: '陶瓷砖', enLabel: 'Ceramic Tile' },
          { id: 'porcelain-tile', label: '瓷质砖', enLabel: 'Porcelain Tile' },
          { id: 'natural-stone', label: '天然石材', enLabel: 'Natural Stone Tile' },
          { id: 'mosaic-tile', label: '马赛克砖', enLabel: 'Mosaic Tile' }
        ]
      },
      {
        id: 'carpet',
        label: '地毯',
        enLabel: 'Carpet',
        subCategories: [
          { id: 'carpet-rolls', label: '卷材地毯', enLabel: 'Carpet Rolls' },
          { id: 'carpet-tiles', label: '地毯砖', enLabel: 'Carpet Tiles' },
          { id: 'area-rugs', label: '区域地毯', enLabel: 'Area Rugs' }
        ]
      },
      {
        id: 'flooring-accessories',
        label: '地板配件',
        enLabel: 'Flooring Accessories',
        subCategories: [
          { id: 'underlayment', label: '地板垫', enLabel: 'Underlayment' },
          { id: 'adhesives', label: '胶粘剂', enLabel: 'Flooring Adhesives' },
          { id: 'transition-strips', label: '过渡条', enLabel: 'Transition Strips' },
          { id: 'baseboards', label: '踢脚线', enLabel: 'Baseboards' }
        ]
      }
    ]
  },
  {
    id: 'hardware',
    label: '五金工具',
    enLabel: 'Hardware',
    categories: [
      {
        id: 'fasteners',
        label: '紧固件',
        enLabel: 'Fasteners',
        subCategories: [
          { id: 'screws', label: '螺丝', enLabel: 'Screws' },
          { id: 'nails', label: '钉子', enLabel: 'Nails' },
          { id: 'bolts', label: '螺栓', enLabel: 'Bolts' },
          { id: 'nuts', label: '螺母', enLabel: 'Nuts' },
          { id: 'washers', label: '垫圈', enLabel: 'Washers' },
          { id: 'anchors', label: '膨胀螺丝', enLabel: 'Anchors' }
        ]
      },
      {
        id: 'cabinet-hardware',
        label: '橱柜五金',
        enLabel: 'Cabinet Hardware',
        subCategories: [
          { id: 'cabinet-knobs', label: '橱柜把手', enLabel: 'Cabinet Knobs' },
          { id: 'cabinet-pulls', label: '橱柜拉手', enLabel: 'Cabinet Pulls' },
          { id: 'cabinet-hinges', label: '橱柜铰链', enLabel: 'Cabinet Hinges' },
          { id: 'drawer-slides', label: '抽屉滑轨', enLabel: 'Drawer Slides' },
          { id: 'catches-latches', label: '门扣', enLabel: 'Catches & Latches' }
        ]
      },
      {
        id: 'hooks-storage',
        label: '挂钩收纳',
        enLabel: 'Hooks & Storage',
        subCategories: [
          { id: 'wall-hooks', label: '墙钩', enLabel: 'Wall Hooks' },
          { id: 'ceiling-hooks', label: '顶钩', enLabel: 'Ceiling Hooks' },
          { id: 'shelf-brackets', label: '搁板支架', enLabel: 'Shelf Brackets' },
          { id: 'garage-storage', label: '车库收纳', enLabel: 'Garage Storage' }
        ]
      },
      {
        id: 'chains-ropes',
        label: '链条绳索',
        enLabel: 'Chains & Ropes',
        subCategories: [
          { id: 'chains', label: '链条', enLabel: 'Chains' },
          { id: 'ropes', label: '绳索', enLabel: 'Ropes' },
          { id: 'bungee-cords', label: '弹力绳', enLabel: 'Bungee Cords' },
          { id: 'tie-downs', label: '捆绑带', enLabel: 'Tie-Downs' }
        ]
      }
    ]
  },
  {
    id: 'heating-cooling',
    label: '暖通空调',
    enLabel: 'Heating & Cooling',
    categories: [
      {
        id: 'hvac',
        label: 'HVAC系统',
        enLabel: 'HVAC Systems',
        subCategories: [
          { id: 'furnaces', label: '熔炉', enLabel: 'Furnaces' },
          { id: 'heat-pumps', label: '热泵', enLabel: 'Heat Pumps' },
          { id: 'air-handlers', label: '空气处理器', enLabel: 'Air Handlers' },
          { id: 'hvac-parts', label: 'HVAC配件', enLabel: 'HVAC Parts & Accessories' }
        ]
      },
      {
        id: 'portable-heating',
        label: '便携加热器',
        enLabel: 'Portable Heating',
        subCategories: [
          { id: 'space-heaters', label: '空间加热器', enLabel: 'Space Heaters' },
          { id: 'electric-heaters', label: '电加热器', enLabel: 'Electric Heaters' },
          { id: 'propane-heaters', label: '丙烷加热器', enLabel: 'Propane Heaters' }
        ]
      },
      {
        id: 'ventilation',
        label: '通风换气',
        enLabel: 'Ventilation',
        subCategories: [
          { id: 'exhaust-fans', label: '排气扇', enLabel: 'Exhaust Fans' },
          { id: 'duct-vents', label: '风管通风口', enLabel: 'Ducts & Vents' },
          { id: 'attic-ventilation', label: '阁楼通风', enLabel: 'Attic Ventilation' }
        ]
      }
    ]
  },
  {
    id: 'kitchen',
    label: '厨房设备',
    enLabel: 'Kitchen',
    categories: [
      {
        id: 'cabinets',
        label: '橱柜',
        enLabel: 'Cabinets',
        subCategories: [
          { id: 'kitchen-cabinets', label: '厨房橱柜', enLabel: 'Kitchen Cabinets' },
          { id: 'bathroom-cabinets', label: '浴室柜', enLabel: 'Bathroom Cabinets' },
          { id: 'garage-cabinets', label: '车库柜', enLabel: 'Garage Cabinets' },
          { id: 'laundry-cabinets', label: '洗衣柜', enLabel: 'Laundry Cabinets' }
        ]
      },
      {
        id: 'countertops',
        label: '台面',
        enLabel: 'Countertops',
        subCategories: [
          { id: 'laminate-countertops', label: '层压台面', enLabel: 'Laminate Countertops' },
          { id: 'granite-countertops', label: '花岗岩台面', enLabel: 'Granite Countertops' },
          { id: 'quartz-countertops', label: '石英台��', enLabel: 'Quartz Countertops' },
          { id: 'butcher-block', label: '实木台面', enLabel: 'Butcher Block Countertops' }
        ]
      },
      {
        id: 'backsplash',
        label: '后挡板',
        enLabel: 'Backsplash',
        subCategories: [
          { id: 'tile-backsplash', label: '瓷砖后挡板', enLabel: 'Tile Backsplash' },
          { id: 'peel-stick', label: '自粘后挡板', enLabel: 'Peel & Stick Backsplash' },
          { id: 'glass-backsplash', label: '玻璃后挡板', enLabel: 'Glass Backsplash' }
        ]
      }
    ]
  },
  {
    id: 'lawn-garden',
    label: '园艺花园',
    enLabel: 'Lawn & Garden',
    categories: [
      {
        id: 'outdoor-power',
        label: '户外动力设备',
        enLabel: 'Outdoor Power Equipment',
        subCategories: [
          { id: 'lawn-mowers', label: '割草机', enLabel: 'Lawn Mowers' },
          { id: 'trimmers', label: '修剪机', enLabel: 'Trimmers & Edgers' },
          { id: 'blowers', label: '吹风机', enLabel: 'Blowers' },
          { id: 'pressure-washers', label: '高压清洗机', enLabel: 'Pressure Washers' },
          { id: 'chainsaws', label: '电锯', enLabel: 'Chainsaws' }
        ]
      },
      {
        id: 'irrigation',
        label: '灌溉系统',
        enLabel: 'Watering & Irrigation',
        subCategories: [
          { id: 'garden-hoses', label: '园艺软管', enLabel: 'Garden Hoses' },
          { id: 'sprinklers', label: '洒水器', enLabel: 'Sprinklers' },
          { id: 'drip-irrigation', label: '滴灌系统', enLabel: 'Drip Irrigation' },
          { id: 'hose-reels', label: '软管卷盘', enLabel: 'Hose Reels' }
        ]
      },
      {
        id: 'landscaping',
        label: '景观美化',
        enLabel: 'Landscaping',
        subCategories: [
          { id: 'mulch', label: '覆盖物', enLabel: 'Mulch' },
          { id: 'soil', label: '土壤', enLabel: 'Soil & Amendments' },
          { id: 'pavers', label: '铺路石', enLabel: 'Pavers & Stepping Stones' },
          { id: 'edging', label: '花园边界', enLabel: 'Garden Edging' }
        ]
      },
      {
        id: 'fencing',
        label: '围栏',
        enLabel: 'Fencing',
        subCategories: [
          { id: 'wood-fencing', label: '木栅栏', enLabel: 'Wood Fencing' },
          { id: 'vinyl-fencing', label: '乙烯基栅栏', enLabel: 'Vinyl Fencing' },
          { id: 'chain-link', label: '链环栅栏', enLabel: 'Chain Link Fencing' },
          { id: 'fence-posts', label: '栅栏柱', enLabel: 'Fence Posts & Rails' }
        ]
      }
    ]
  },
  {
    id: 'paint',
    label: '涂料油漆',
    enLabel: 'Paint',
    categories: [
      {
        id: 'interior-paint',
        label: '内墙涂料',
        enLabel: 'Interior Paint',
        subCategories: [
          { id: 'wall-paint', label: '墙面漆', enLabel: 'Wall Paint' },
          { id: 'ceiling-paint', label: '天花板漆', enLabel: 'Ceiling Paint' },
          { id: 'trim-paint', label: '装饰条漆', enLabel: 'Trim & Door Paint' },
          { id: 'primer', label: '底漆', enLabel: 'Primer' }
        ]
      },
      {
        id: 'exterior-paint',
        label: '外墙涂料',
        enLabel: 'Exterior Paint',
        subCategories: [
          { id: 'house-paint', label: '房屋外墙漆', enLabel: 'House & Siding Paint' },
          { id: 'deck-paint', label: '甲板漆', enLabel: 'Deck & Porch Paint' },
          { id: 'masonry-paint', label: '砌体漆', enLabel: 'Masonry Paint' },
          { id: 'roof-coating', label: '屋顶涂料', enLabel: 'Roof Coating' }
        ]
      },
      {
        id: 'specialty-paint',
        label: '特殊涂料',
        enLabel: 'Specialty Paint',
        subCategories: [
          { id: 'spray-paint', label: '喷漆', enLabel: 'Spray Paint' },
          { id: 'chalkboard-paint', label: '黑板漆', enLabel: 'Chalkboard Paint' },
          { id: 'cabinet-paint', label: '橱柜漆', enLabel: 'Cabinet & Furniture Paint' }
        ]
      },
      {
        id: 'paint-supplies',
        label: '涂料用品',
        enLabel: 'Paint Supplies',
        subCategories: [
          { id: 'brushes-rollers', label: '刷子滚筒', enLabel: 'Brushes & Rollers' },
          { id: 'paint-trays', label: '油漆盘', enLabel: 'Paint Trays & Liners' },
          { id: 'drop-cloths', label: '防尘布', enLabel: 'Drop Cloths' },
          { id: 'painters-tape', label: '美纹纸胶带', enLabel: 'Painter\'s Tape' }
        ]
      }
    ]
  },
  {
    id: 'plumbing',
    label: '管道水暖',
    enLabel: 'Plumbing',
    categories: [
      {
        id: 'pipes-fittings',
        label: '管道配件',
        enLabel: 'Pipes & Fittings',
        subCategories: [
          { id: 'pvc-pipe', label: 'PVC管', enLabel: 'PVC Pipe & Fittings' },
          { id: 'copper-pipe', label: '铜管', enLabel: 'Copper Pipe & Fittings' },
          { id: 'pex-pipe', label: 'PEX管', enLabel: 'PEX Pipe & Fittings' },
          { id: 'abs-pipe', label: 'ABS管', enLabel: 'ABS Pipe & Fittings' }
        ]
      },
      {
        id: 'valves',
        label: '阀门',
        enLabel: 'Valves',
        subCategories: [
          { id: 'shutoff-valves', label: '截止阀', enLabel: 'Shutoff Valves' },
          { id: 'ball-valves', label: '球阀', enLabel: 'Ball Valves' },
          { id: 'gate-valves', label: '闸阀', enLabel: 'Gate Valves' },
          { id: 'check-valves', label: '止回阀', enLabel: 'Check Valves' }
        ]
      },
      {
        id: 'water-heaters',
        label: '热水器',
        enLabel: 'Water Heaters',
        subCategories: [
          { id: 'tank-water-heaters', label: '储水式热水器', enLabel: 'Tank Water Heaters' },
          { id: 'tankless-water-heaters', label: '即热式热水器', enLabel: 'Tankless Water Heaters' },
          { id: 'water-heater-parts', label: '热水器配件', enLabel: 'Water Heater Parts' }
        ]
      },
      {
        id: 'plumbing-repair',
        label: '管道维修',
        enLabel: 'Plumbing Repair',
        subCategories: [
          { id: 'toilet-parts', label: '马桶配件', enLabel: 'Toilet Repair Parts' },
          { id: 'faucet-repair', label: '龙头维修', enLabel: 'Faucet Repair Parts' },
          { id: 'drain-cleaning', label: '排水清洁', enLabel: 'Drain Cleaning' },
          { id: 'plumbers-putty', label: '水管密封胶', enLabel: 'Plumber\'s Putty & Sealants' }
        ]
      }
    ]
  },
  {
    id: 'storage-organization',
    label: '存储收纳',
    enLabel: 'Storage & Organization',
    categories: [
      {
        id: 'shelving',
        label: '货架',
        enLabel: 'Shelving',
        subCategories: [
          { id: 'wire-shelving', label: '金属网架', enLabel: 'Wire Shelving' },
          { id: 'wood-shelving', label: '木质货架', enLabel: 'Wood Shelving' },
          { id: 'plastic-shelving', label: '塑料货架', enLabel: 'Plastic Shelving' },
          { id: 'wall-shelves', label: '墙面搁板', enLabel: 'Wall Shelves' }
        ]
      },
      {
        id: 'storage-bins',
        label: '储物箱',
        enLabel: 'Storage Bins & Boxes',
        subCategories: [
          { id: 'plastic-bins', label: '塑料箱', enLabel: 'Plastic Storage Bins' },
          { id: 'storage-totes', label: '手提箱', enLabel: 'Storage Totes' },
          { id: 'decorative-bins', label: '装饰收纳盒', enLabel: 'Decorative Storage' }
        ]
      },
      {
        id: 'closet-organization',
        label: '衣柜整理',
        enLabel: 'Closet Organization',
        subCategories: [
          { id: 'closet-systems', label: '衣柜系统', enLabel: 'Closet Systems' },
          { id: 'hangers', label: '衣架', enLabel: 'Hangers' },
          { id: 'shoe-racks', label: '鞋架', enLabel: 'Shoe Racks' },
          { id: 'storage-drawers', label: '收纳抽屉', enLabel: 'Storage Drawers' }
        ]
      }
    ]
  },
  {
    id: 'tools',
    label: '工具设备',
    enLabel: 'Tools',
    categories: [
      {
        id: 'power-tools',
        label: '电动工具',
        enLabel: 'Power Tools',
        subCategories: [
          { id: 'drills', label: '电钻', enLabel: 'Drills' },
          { id: 'saws', label: '电锯', enLabel: 'Saws' },
          { id: 'sanders', label: '砂光机', enLabel: 'Sanders' },
          { id: 'grinders', label: '磨光机', enLabel: 'Grinders' },
          { id: 'nail-guns', label: '射钉枪', enLabel: 'Nail Guns' },
          { id: 'impact-drivers', label: '冲击起子', enLabel: 'Impact Drivers' }
        ]
      },
      {
        id: 'hand-tools',
        label: '手动工具',
        enLabel: 'Hand Tools',
        subCategories: [
          { id: 'hammers', label: '锤子', enLabel: 'Hammers' },
          { id: 'screwdrivers', label: '螺丝刀', enLabel: 'Screwdrivers' },
          { id: 'wrenches', label: '扳手', enLabel: 'Wrenches' },
          { id: 'pliers', label: '钳子', enLabel: 'Pliers' },
          { id: 'measuring-tools', label: '测量工具', enLabel: 'Measuring & Layout Tools' },
          { id: 'levels', label: '水平仪', enLabel: 'Levels' }
        ]
      },
      {
        id: 'tool-storage',
        label: '工具存储',
        enLabel: 'Tool Storage',
        subCategories: [
          { id: 'tool-boxes', label: '工具箱', enLabel: 'Tool Boxes' },
          { id: 'tool-chests', label: '工具柜', enLabel: 'Tool Chests' },
          { id: 'tool-bags', label: '工具包', enLabel: 'Tool Bags' },
          { id: 'tool-belts', label: '工具腰带', enLabel: 'Tool Belts' }
        ]
      },
      {
        id: 'safety-equipment',
        label: '安全设备',
        enLabel: 'Safety Equipment',
        subCategories: [
          { id: 'safety-glasses', label: '安全眼镜', enLabel: 'Safety Glasses' },
          { id: 'work-gloves', label: '工作手套', enLabel: 'Work Gloves' },
          { id: 'hard-hats', label: '安全帽', enLabel: 'Hard Hats' },
          { id: 'ear-protection', label: '听力保护', enLabel: 'Ear Protection' },
          { id: 'dust-masks', label: '防尘口罩', enLabel: 'Dust Masks & Respirators' }
        ]
      }
    ]
  }
];

// 辅助函数：获取所有一级类目
export const getLevel1Categories = (): CategoryLevel1[] => {
  return productCategories;
};

// 辅助函数：根据一级类目ID获取二级类目
export const getLevel2Categories = (level1Id: string): CategoryLevel2[] => {
  const level1 = productCategories.find(cat => cat.id === level1Id);
  return level1?.categories || [];
};

// 辅助函数：根据二级类目ID获取三级类目
export const getLevel3Categories = (level1Id: string, level2Id: string): CategoryLevel3[] => {
  const level1 = productCategories.find(cat => cat.id === level1Id);
  const level2 = level1?.categories.find(cat => cat.id === level2Id);
  return level2?.subCategories || [];
};

// 辅助函数：扁平化所有类目
export const flattenCategories = () => {
  const result: Array<{
    level1: string;
    level2: string;
    level3: string;
    path: string;
  }> = [];

  productCategories.forEach(l1 => {
    l1.categories.forEach(l2 => {
      l2.subCategories.forEach(l3 => {
        result.push({
          level1: l1.enLabel,
          level2: l2.enLabel,
          level3: l3.enLabel,
          path: `${l1.id} > ${l2.id} > ${l3.id}`
        });
      });
    });
  });

  return result;
};