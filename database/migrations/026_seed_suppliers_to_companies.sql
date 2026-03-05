-- Migration 026: 将前端静态供应商数据迁移到 companies 表
-- Supabase-first: companies 表成为唯一供应商数据源
-- party_type 枚举值需先确认，查询：SELECT enum_range(NULL::party_type_enum);

-- 先查 party_type 枚举允许的值
-- SELECT typname, enumlabel FROM pg_enum JOIN pg_type ON pg_type.oid = pg_enum.enumtypid WHERE typname LIKE '%party%';

DO $$
DECLARE
  v_tenant_id uuid := '3683e7c6-8c05-4074-8a58-5e9e599ff4b9'; -- COSUN 单租户
BEGIN

INSERT INTO public.companies (
  tenant_id, party_type, code, name, name_en,
  region, address, main_email, main_phone,
  industry, business_types, certifications,
  supplier_level, supplier_category,
  production_capacity, on_time_rate, quality_rate,
  cooperation_years, status, notes
)
VALUES
  (v_tenant_id, 'supplier', 'DG-HS-001', '东莞市华盛电器有限公司', 'Dongguan Huasheng Electrical Co., Ltd.',
   '广东', '广东省东莞市长安镇工业园区', 'zhang@huasheng.com', '+86 769 8888 1234',
   '电气设备', ARRAY['trading','project'], ARRAY['ISO9001','CE','RoHS'],
   'A', '电气设备', '50万件/月', 96.5, 98.2, 5, 'active', '联系人：张伟'),

  (v_tenant_id, 'supplier', 'FS-XD-002', '佛山市鑫达卫浴制造厂', 'Foshan Xinda Sanitary Ware Factory',
   '广东', '广东省佛山市南海区狮山镇', 'li@xinda.com', '+86 757 8888 5678',
   '卫浴产品', ARRAY['trading','agency'], ARRAY['ISO9001','CUPC','Watermark'],
   'A', '卫浴产品', '30万件/月', 94.8, 97.5, 4, 'active', '联系人：李娜'),

  (v_tenant_id, 'supplier', 'WZ-JG-003', '温州精工五金配件厂', 'Wenzhou Jinggong Hardware Factory',
   '浙江', '浙江省温州市龙湾区经济开发区', 'wang@jinggong.com', '+86 577 8888 9012',
   '门窗配件', ARRAY['trading','agency'], ARRAY['ISO9001'],
   'B', '门窗配件', '20万件/月', 91.2, 95.8, 3, 'active', '联系人：王强'),

  (v_tenant_id, 'supplier', 'JN-AQ-004', '济南安全劳保用品公司', 'Jinan Safety Products Co., Ltd.',
   '山东', '山东省济南市历城区工业园', 'zhao@safety.com', '+86 531 8888 3456',
   '劳保用品', ARRAY['trading'], ARRAY['ISO9001','CE'],
   'B', '劳保用品', '15万件/月', 88.5, 94.2, 2, 'active', '联系人：赵敏'),

  (v_tenant_id, 'supplier', 'NB-CX-005', '宁波创新电器制造厂', 'Ningbo Chuangxin Electrical Factory',
   '浙江', '浙江省宁波市北仑区', 'liu@chuangxin.com', '+86 574 8888 7890',
   '电气设备', ARRAY['trading'], ARRAY['ISO9001'],
   'C', '电气设备', '10万件/月', 83.3, 91.5, 1, 'active', '联系人：刘洋'),

  (v_tenant_id, 'supplier', 'SH-MH-006', '上海明辉建材有限公司', 'Shanghai Minghui Building Materials Co., Ltd.',
   '上海', '上海市浦东新区张江高科技园区', 'chen@minghui.com', '+86 21 8888 2345',
   '建筑材料', ARRAY['trading','project'], ARRAY['ISO9001','ISO14001'],
   'A', '建筑材料', '100万件/月', 97.8, 98.5, 6, 'active', '联系人：陈明'),

  (v_tenant_id, 'supplier', 'FZ-HD-007', '福州鸿达照明科技公司', 'Fuzhou Hongda Lighting Technology Co., Ltd.',
   '福建', '福建省福州市仓山区金山工业园', 'lin@hongda.com', '+86 591 8888 6789',
   '照明灯具', ARRAY['trading'], ARRAY['ISO9001','CE','Energy Star'],
   'B', '照明灯具', '25万件/月', 92.5, 96.3, 3, 'active', '联系人：林芳'),

  (v_tenant_id, 'supplier', 'SZ-JM-008', '苏州精密五金工具厂', 'Suzhou Precision Hardware Tools Factory',
   '江苏', '江苏省苏州市吴江区经济开发区', 'zhou@precision.com', '+86 512 8888 4567',
   '五金工具', ARRAY['trading','agency'], ARRAY['ISO9001','CE'],
   'B', '五金工具', '35万件/月', 93.2, 96.8, 4, 'active', '联系人：周磊'),

  (v_tenant_id, 'supplier', 'HZ-YJ-009', '杭州雅居家居用品公司', 'Hangzhou Yaju Home Products Co., Ltd.',
   '浙江', '浙江省杭州市余杭区临平新城', 'wu@yaju.com', '+86 571 8888 8901',
   '家居用品', ARRAY['trading'], ARRAY['ISO9001'],
   'C', '家居用品', '18万件/月', 89.6, 94.5, 2, 'active', '联系人：吴静'),

  (v_tenant_id, 'supplier', 'SZ-MD-010', '深圳市明达电器有限公司', 'Shenzhen Mingda Electrical Co., Ltd.',
   '广东', '广东省深圳市宝安区西乡街道', 'zhang@mingda.com', '+86 755 8888 8888',
   '电气设备', ARRAY['trading','inspection','project'], ARRAY['ISO9001','CE','RoHS','UL'],
   'A', '电气设备', '80万件/月', 98.2, 99.1, 7, 'active', '联系人：张经理')

ON CONFLICT (id) DO NOTHING;

END $$;

-- 验收查询
-- SELECT code, name, supplier_level, main_email, status FROM public.companies WHERE party_type = 'supplier' ORDER BY code;
