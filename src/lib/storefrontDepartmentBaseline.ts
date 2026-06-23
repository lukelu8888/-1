import { departments, type Department, type DepartmentSubcategory } from '@/data/header/departmentsData';
import type { MainCategory } from '@/data/productData';

const slugify = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);

export type { Department, DepartmentSubcategory };

export const storefrontBaselineDepartments: Department[] = departments;

export const buildMainCategoriesFromStorefrontDepartments = (
  source: Department[] = storefrontBaselineDepartments
): MainCategory[] =>
  source.map((department, departmentIndex) => ({
    id: slugify(department.name) || `department-${departmentIndex + 1}`,
    name: department.name,
    icon: 'Package',
    description: undefined,
    subCategories: department.subcategories.map((subcategory, subcategoryIndex) => ({
      id:
        slugify(`${department.name}-${subcategory.name}`) ||
        `subcategory-${departmentIndex + 1}-${subcategoryIndex + 1}`,
      name: subcategory.name,
      description: undefined,
      productCategories: subcategory.items.map((item, itemIndex) => ({
        id:
          slugify(`${department.name}-${subcategory.name}-${item}`) ||
          `leaf-${departmentIndex + 1}-${subcategoryIndex + 1}-${itemIndex + 1}`,
        name: item,
        description: undefined,
        products: [],
      })),
    })),
  }));
