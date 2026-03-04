-- ============================================================
-- Migration 017: 步骤 2a — 新建 document_types + country_region_map
-- 执行顺序：先 2a，验收后再 2b
-- ============================================================

-- ============================================================
-- 1. document_types — 单据类型定义表（12种）
-- ============================================================
CREATE TABLE IF NOT EXISTS public.document_types (
  doc_type    TEXT PRIMARY KEY,              -- ING / QR / XJ / BJ / QT / SC / PR / CG / IR / SH / CI / PL
  label_zh    TEXT NOT NULL,                 -- 中文名称
  label_en    TEXT NOT NULL,                 -- 英文名称
  scope_type  TEXT NOT NULL,                 -- global / region / customer / derived
  prefix      TEXT NOT NULL,                 -- 编号前缀，如 ING、QR
  format      TEXT NOT NULL,                 -- 编号格式说明，如 ING-YYMMDD-XXXX
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 插入 12 种单据定义（幂等：有则更新）
INSERT INTO public.document_types
  (doc_type, label_zh, label_en, scope_type, prefix, format)
VALUES
  ('ING', '客户询价单',   'Customer Inquiry',        'customer', 'ING', 'ING-YYMMDD-XXXX'),
  ('QR',  '报价请求单',   'Quotation Request',        'global',   'QR',  'QR-YYMMDD-XXXX'),
  ('XJ',  '采购询价单',   'Supplier Inquiry',         'global',   'XJ',  'XJ-YYMMDD-XXXX'),
  ('BJ',  '供应商报价单', 'Supplier Quotation',        'global',   'BJ',  'BJ-YYMMDD-XXXX'),
  ('QT',  '客户报价单',   'Customer Quotation',        'region',   'QT',  'QT-REGION-YYMMDD-XXXX'),
  ('SC',  '销售合同',     'Sales Contract',            'region',   'SC',  'SC-REGION-YYMMDD-XXXX'),
  ('PR',  '采购请求单',   'Purchase Request',          'global',   'PR',  'PR-YYMMDD-XXXX'),
  ('CG',  '采购订单',     'Purchase Order',            'global',   'CG',  'CG-YYMMDD-XXXX'),
  ('IR',  '验货报告',     'Inspection Report',         'global',   'IR',  'IR-YYMMDD-XXXX'),
  ('SH',  '出货/订舱单',  'Shipment',                  'global',   'SH',  'SH-YYMMDD-XXXX'),
  ('CI',  '商业发票',     'Commercial Invoice',        'derived',  'CI',  'CI-SC-<sc_number>'),
  ('PL',  '装箱单',       'Packing List',              'derived',  'PL',  'PL-SC-<sc_number>')
ON CONFLICT (doc_type) DO UPDATE SET
  label_zh   = EXCLUDED.label_zh,
  label_en   = EXCLUDED.label_en,
  scope_type = EXCLUDED.scope_type,
  prefix     = EXCLUDED.prefix,
  format     = EXCLUDED.format,
  is_active  = EXCLUDED.is_active;

-- ============================================================
-- 2. country_region_map — 国家→区域利润中心映射
-- ============================================================
CREATE TABLE IF NOT EXISTS public.country_region_map (
  country_code   TEXT PRIMARY KEY,           -- ISO 3166-1 alpha-2，如 US / CN
  country_name   TEXT NOT NULL,
  region_code    TEXT NOT NULL,              -- NA / SA / EA / UNKNOWN
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 插入区域映射数据（幂等：有则更新 region_code）
INSERT INTO public.country_region_map (country_code, country_name, region_code) VALUES
  -- NA — North America
  ('US', 'United States',          'NA'),
  ('CA', 'Canada',                 'NA'),

  -- SA — South America + Central America + Mexico
  ('MX', 'Mexico',                 'SA'),
  ('BR', 'Brazil',                 'SA'),
  ('AR', 'Argentina',              'SA'),
  ('CL', 'Chile',                  'SA'),
  ('CO', 'Colombia',               'SA'),
  ('PE', 'Peru',                   'SA'),
  ('VE', 'Venezuela',              'SA'),
  ('EC', 'Ecuador',                'SA'),
  ('BO', 'Bolivia',                'SA'),
  ('PY', 'Paraguay',               'SA'),
  ('UY', 'Uruguay',                'SA'),
  ('GY', 'Guyana',                 'SA'),
  ('SR', 'Suriname',               'SA'),
  ('GT', 'Guatemala',              'SA'),
  ('HN', 'Honduras',               'SA'),
  ('SV', 'El Salvador',            'SA'),
  ('NI', 'Nicaragua',              'SA'),
  ('CR', 'Costa Rica',             'SA'),
  ('PA', 'Panama',                 'SA'),
  ('CU', 'Cuba',                   'SA'),
  ('DO', 'Dominican Republic',     'SA'),
  ('PR', 'Puerto Rico',            'SA'),
  ('JM', 'Jamaica',                'SA'),
  ('TT', 'Trinidad and Tobago',    'SA'),
  ('HT', 'Haiti',                  'SA'),
  ('BZ', 'Belize',                 'SA'),

  -- EA — Europe + Africa + Middle East + Asia + Australia + NZ
  -- Europe
  ('GB', 'United Kingdom',         'EA'),
  ('DE', 'Germany',                'EA'),
  ('FR', 'France',                 'EA'),
  ('IT', 'Italy',                  'EA'),
  ('ES', 'Spain',                  'EA'),
  ('NL', 'Netherlands',            'EA'),
  ('BE', 'Belgium',                'EA'),
  ('SE', 'Sweden',                 'EA'),
  ('NO', 'Norway',                 'EA'),
  ('DK', 'Denmark',                'EA'),
  ('FI', 'Finland',                'EA'),
  ('PL', 'Poland',                 'EA'),
  ('CZ', 'Czech Republic',         'EA'),
  ('SK', 'Slovakia',               'EA'),
  ('AT', 'Austria',                'EA'),
  ('CH', 'Switzerland',            'EA'),
  ('PT', 'Portugal',               'EA'),
  ('GR', 'Greece',                 'EA'),
  ('RO', 'Romania',                'EA'),
  ('HU', 'Hungary',                'EA'),
  ('BG', 'Bulgaria',               'EA'),
  ('HR', 'Croatia',                'EA'),
  ('RS', 'Serbia',                 'EA'),
  ('UA', 'Ukraine',                'EA'),
  ('RU', 'Russia',                 'EA'),
  ('TR', 'Turkey',                 'EA'),
  ('IE', 'Ireland',                'EA'),
  ('LU', 'Luxembourg',             'EA'),
  ('SI', 'Slovenia',               'EA'),
  ('EE', 'Estonia',                'EA'),
  ('LV', 'Latvia',                 'EA'),
  ('LT', 'Lithuania',              'EA'),
  ('BY', 'Belarus',                'EA'),
  ('MD', 'Moldova',                'EA'),
  ('GE', 'Georgia',                'EA'),
  ('AM', 'Armenia',                'EA'),
  ('AZ', 'Azerbaijan',             'EA'),
  ('IS', 'Iceland',                'EA'),
  ('MT', 'Malta',                  'EA'),
  ('CY', 'Cyprus',                 'EA'),
  -- Middle East
  ('SA', 'Saudi Arabia',           'EA'),
  ('AE', 'United Arab Emirates',   'EA'),
  ('QA', 'Qatar',                  'EA'),
  ('KW', 'Kuwait',                 'EA'),
  ('BH', 'Bahrain',                'EA'),
  ('OM', 'Oman',                   'EA'),
  ('IL', 'Israel',                 'EA'),
  ('JO', 'Jordan',                 'EA'),
  ('LB', 'Lebanon',                'EA'),
  ('IQ', 'Iraq',                   'EA'),
  ('IR', 'Iran',                   'EA'),
  ('SY', 'Syria',                  'EA'),
  ('YE', 'Yemen',                  'EA'),
  -- Africa
  ('ZA', 'South Africa',           'EA'),
  ('NG', 'Nigeria',                'EA'),
  ('EG', 'Egypt',                  'EA'),
  ('ET', 'Ethiopia',               'EA'),
  ('KE', 'Kenya',                  'EA'),
  ('GH', 'Ghana',                  'EA'),
  ('TZ', 'Tanzania',               'EA'),
  ('MA', 'Morocco',                'EA'),
  ('DZ', 'Algeria',                'EA'),
  ('TN', 'Tunisia',                'EA'),
  ('UG', 'Uganda',                 'EA'),
  ('SN', 'Senegal',                'EA'),
  ('CM', 'Cameroon',               'EA'),
  ('CI_C', 'Cote d Ivoire',        'EA'),  -- CI 与 商业发票前缀冲突，用 CI_C
  ('AO', 'Angola',                 'EA'),
  ('MZ', 'Mozambique',             'EA'),
  ('ZM', 'Zambia',                 'EA'),
  ('ZW', 'Zimbabwe',               'EA'),
  ('RW', 'Rwanda',                 'EA'),
  ('SD', 'Sudan',                  'EA'),
  ('LY', 'Libya',                  'EA'),
  -- Asia
  ('CN', 'China',                  'EA'),
  ('JP', 'Japan',                  'EA'),
  ('KR', 'South Korea',            'EA'),
  ('IN', 'India',                  'EA'),
  ('SG', 'Singapore',              'EA'),
  ('MY', 'Malaysia',               'EA'),
  ('TH', 'Thailand',               'EA'),
  ('VN', 'Vietnam',                'EA'),
  ('ID', 'Indonesia',              'EA'),
  ('PH', 'Philippines',            'EA'),
  ('PK', 'Pakistan',               'EA'),
  ('BD', 'Bangladesh',             'EA'),
  ('LK', 'Sri Lanka',              'EA'),
  ('NP', 'Nepal',                  'EA'),
  ('MM', 'Myanmar',                'EA'),
  ('KH', 'Cambodia',               'EA'),
  ('LA', 'Laos',                   'EA'),
  ('TW', 'Taiwan',                 'EA'),
  ('HK', 'Hong Kong',              'EA'),
  ('MO', 'Macau',                  'EA'),
  ('MN', 'Mongolia',               'EA'),
  ('KZ', 'Kazakhstan',             'EA'),
  ('UZ', 'Uzbekistan',             'EA'),
  -- Australia & NZ
  ('AU', 'Australia',              'EA'),
  ('NZ', 'New Zealand',            'EA')
ON CONFLICT (country_code) DO UPDATE SET
  region_code  = EXCLUDED.region_code,
  country_name = EXCLUDED.country_name;

-- ============================================================
-- RLS（只读策略，authenticated 用户可读，禁止随意修改）
-- ============================================================
ALTER TABLE public.document_types     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_region_map ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'document_types' AND policyname = 'read_document_types'
  ) THEN
    CREATE POLICY read_document_types ON public.document_types
      FOR SELECT TO authenticated USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'country_region_map' AND policyname = 'read_country_region_map'
  ) THEN
    CREATE POLICY read_country_region_map ON public.country_region_map
      FOR SELECT TO authenticated USING (true);
  END IF;
END;
$$;

