import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { departments } from '../src/data/header/departmentsData.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationFileName = '20260429160000_reset_storefront_departments_from_header.sql';
const migrationPath = path.join(__dirname, '..', 'supabase', 'migrations', migrationFileName);

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

const escapeSql = (value) => String(value || '').replace(/'/g, "''");

const valuesBlock = (rows) =>
  rows.map((row) => `  (${row.join(', ')})`).join(',\n');

const departmentRows = departments.map((department, index) => [
  index + 1,
  `'${escapeSql(department.name)}'`,
  `'${escapeSql(slugify(department.name) || `department-${index + 1}`)}'`,
]);

const subcategoryRows = departments.flatMap((department) =>
  department.subcategories.map((subcategory, index) => [
    `'${escapeSql(department.name)}'`,
    index + 1,
    `'${escapeSql(subcategory.name)}'`,
    `'${escapeSql(slugify(`${department.name}-${subcategory.name}`) || `${slugify(department.name)}-subcategory-${index + 1}`)}'`,
  ])
);

const leafRows = departments.flatMap((department) =>
  department.subcategories.flatMap((subcategory) =>
    subcategory.items.map((leafName, index) => [
      `'${escapeSql(department.name)}'`,
      `'${escapeSql(subcategory.name)}'`,
      index + 1,
      `'${escapeSql(leafName)}'`,
      `'${escapeSql(slugify(`${department.name}-${subcategory.name}-${leafName}`) || `${slugify(subcategory.name)}-leaf-${index + 1}`)}'`,
    ])
  )
);

const sql = `begin;

create temporary table tmp_raw_departments (
  sort_order integer not null,
  name text not null,
  fallback_id text not null
) on commit drop;

insert into tmp_raw_departments (sort_order, name, fallback_id)
values
${valuesBlock(departmentRows)};

create temporary table tmp_raw_subcategories (
  department_name text not null,
  sort_order integer not null,
  name text not null,
  fallback_id text not null
) on commit drop;

insert into tmp_raw_subcategories (department_name, sort_order, name, fallback_id)
values
${valuesBlock(subcategoryRows)};

create temporary table tmp_raw_leaves (
  department_name text not null,
  subcategory_name text not null,
  sort_order integer not null,
  name text not null,
  fallback_id text not null
) on commit drop;

insert into tmp_raw_leaves (department_name, subcategory_name, sort_order, name, fallback_id)
values
${valuesBlock(leafRows)};

create temporary table tmp_desired_main on commit drop as
select
  coalesce(em.id, rd.fallback_id) as id,
  rd.name,
  rd.sort_order
from tmp_raw_departments rd
left join public.product_main_categories em on lower(em.name) = lower(rd.name);

create temporary table tmp_desired_sub_raw on commit drop as
select
  coalesce(es.id, rs.fallback_id) as candidate_id,
  rs.fallback_id,
  dm.id as main_category_id,
  rs.name,
  rs.sort_order,
  rs.department_name
from tmp_raw_subcategories rs
join tmp_desired_main dm on dm.name = rs.department_name
left join (
  select distinct on (lower(m.name), lower(s.name))
    s.id,
    s.name,
    m.name as department_name
  from public.product_sub_categories s
  join public.product_main_categories m on m.id = s.main_category_id
  order by lower(m.name), lower(s.name), s.id
) es
  on lower(es.department_name) = lower(rs.department_name)
 and lower(es.name) = lower(rs.name);

create temporary table tmp_desired_sub on commit drop as
select
  case
    when row_number() over (partition by candidate_id order by department_name, sort_order, name) = 1
      then candidate_id
    else fallback_id
  end as id,
  main_category_id,
  name,
  sort_order,
  department_name
from tmp_desired_sub_raw;

create temporary table tmp_desired_leaf_raw on commit drop as
select
  coalesce(el.id, rl.fallback_id) as candidate_id,
  rl.fallback_id,
  ds.id as sub_category_id,
  rl.name,
  rl.sort_order,
  rl.department_name,
  rl.subcategory_name
from tmp_raw_leaves rl
join tmp_desired_sub ds
  on ds.department_name = rl.department_name
 and ds.name = rl.subcategory_name
left join (
  select distinct on (lower(m.name), lower(s.name), lower(c.name))
    c.id,
    c.name,
    s.name as subcategory_name,
    m.name as department_name
  from public.product_categories c
  join public.product_sub_categories s on s.id = c.sub_category_id
  join public.product_main_categories m on m.id = s.main_category_id
  order by lower(m.name), lower(s.name), lower(c.name), c.id
) el
  on lower(el.department_name) = lower(rl.department_name)
 and lower(el.subcategory_name) = lower(rl.subcategory_name)
 and lower(el.name) = lower(rl.name);

create temporary table tmp_desired_leaf on commit drop as
select
  case
    when row_number() over (partition by candidate_id order by department_name, subcategory_name, sort_order, name) = 1
      then candidate_id
    else fallback_id
  end as id,
  sub_category_id,
  name,
  sort_order,
  department_name,
  subcategory_name
from tmp_desired_leaf_raw;

delete from public.product_category_nodes;
delete from public.product_categories;
delete from public.product_sub_categories;
delete from public.product_main_categories;

insert into public.product_main_categories (id, name, icon, description, sort_order, region_code)
select id, name, 'Package', null, sort_order, null
from tmp_desired_main
order by sort_order;

insert into public.product_sub_categories (id, main_category_id, name, description, sort_order, region_code)
select id, main_category_id, name, null, sort_order, null
from tmp_desired_sub
order by department_name, sort_order;

insert into public.product_categories (id, sub_category_id, name, description, sort_order, region_code)
select id, sub_category_id, name, null, sort_order, null
from tmp_desired_leaf
order by department_name, subcategory_name, sort_order;

insert into public.product_category_nodes (id, name, parent_id, description, sort_order, region_code)
select id, name, null, null, sort_order, null
from tmp_desired_main
union all
select id, name, main_category_id, null, sort_order, null
from tmp_desired_sub
union all
select id, name, sub_category_id, null, sort_order, null
from tmp_desired_leaf;

commit;
`;

await fs.writeFile(migrationPath, sql, 'utf8');
console.log(migrationPath);
