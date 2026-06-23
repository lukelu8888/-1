import {
  DIRECT_ROLE_CODE_MAP,
  REGION_DISPLAY_LABEL_MAP,
  REGION_LABEL_MAP,
  ROLE_PROFILE_RULES,
  TITLE_ROLE_MATCHERS,
  type PermissionRoleMap,
} from './roleMappingRules';

export type ResolvedPermissionRole = {
  code: string;
  name: string;
};

const EMPTY_PERMISSION_ROLE_MAP: PermissionRoleMap = {};

export function normalizeRegionCode(region?: string) {
  return String(region || '').trim().toUpperCase();
}

export function inferRegionCode(region?: string, department?: string) {
  const normalizedRegion = normalizeRegionCode(region);
  if (['NA', 'SA', 'EA', 'ALL'].includes(normalizedRegion)) {
    return normalizedRegion === 'ALL' ? 'all' : normalizedRegion;
  }

  const normalizedDepartment = String(department || '').trim();
  if (normalizedDepartment.includes('北美')) return 'NA';
  if (normalizedDepartment.includes('南美')) return 'SA';
  if (normalizedDepartment.includes('欧非')) return 'EA';
  return normalizedRegion || 'all';
}

export function getRegionDisplayLabel(region?: string) {
  return REGION_DISPLAY_LABEL_MAP[normalizeRegionCode(region)] || '';
}

export function getRegionDepartmentLabel(region?: string) {
  return REGION_LABEL_MAP[normalizeRegionCode(region)] || '';
}

export function getRoleDisplayName(code: string, region?: string, fallbackName?: string) {
  const profile = ROLE_PROFILE_RULES[code];
  const regionLabel = getRegionDisplayLabel(region);
  if (profile?.regionalized && regionLabel) {
    return `${regionLabel}${profile.baseLabel}`;
  }
  return fallbackName || profile?.baseLabel || code;
}

export function getRegionalRoleDisplayName(
  permissionRoleMap: PermissionRoleMap,
  code: string,
  region?: string,
  fallbackName?: string,
) {
  return getRoleDisplayName(code, region, fallbackName || permissionRoleMap[code]?.name || code);
}

export function getDepartmentAndTitleForRole(code: string, region?: string) {
  const profile = ROLE_PROFILE_RULES[code];
  if (!profile) return { department: '', title: '' };

  const regionLabel = getRegionDepartmentLabel(region);
  if (profile.regionalized) {
    return {
      department: regionLabel ? `${profile.department}-${regionLabel}` : profile.department,
      title: profile.title,
    };
  }

  return {
    department: profile.department,
    title: profile.title,
  };
}

function resolveFallbackRoleFromStandardUser(department: string, title: string) {
  if (department.includes('财务')) return 'Finance';
  if (department.includes('采购')) return 'Procurement';
  if (department.includes('单证')) return 'Documentation_Officer';
  if (department.includes('船务')) return 'Documentation_Officer';
  if (department.includes('市场')) return 'Marketing_Ops';
  if (department.includes('品控')) return 'QC';
  if (department.includes('销售') && title.includes('跟单')) return 'Order_Coordinator';
  if (department.includes('销售')) return 'Sales_Rep';
  return '';
}

export function resolvePermissionRole(
  permissionRoleMap: PermissionRoleMap,
  rawRole?: string,
  title?: string,
  department?: string,
  region?: string,
): ResolvedPermissionRole {
  const role = String(rawRole || '').trim();
  const normalizedTitle = String(title || '').trim();
  const normalizedDepartment = String(department || '').trim();

  if (DIRECT_ROLE_CODE_MAP[role]) {
    const code = DIRECT_ROLE_CODE_MAP[role];
    return {
      code,
      name: getRegionalRoleDisplayName(permissionRoleMap, code, region, permissionRoleMap[code]?.name || code),
    };
  }

  if (/跟单\/单证员/i.test(normalizedTitle)) {
    const code = normalizedDepartment.includes('单证')
      ? 'Documentation_Officer'
      : 'Order_Coordinator';
    return {
      code,
      name: getRegionalRoleDisplayName(permissionRoleMap, code, region, permissionRoleMap[code]?.name || code),
    };
  }

  const titleHit = TITLE_ROLE_MATCHERS.find((item) => item.match.test(normalizedTitle));
  if (titleHit) {
    return {
      code: titleHit.code,
      name: getRegionalRoleDisplayName(permissionRoleMap, titleHit.code, region, permissionRoleMap[titleHit.code]?.name || titleHit.code),
    };
  }

  if (role === 'company_admin') {
    const code = normalizedDepartment.includes('IT') ? 'Admin' : 'CEO';
    return {
      code,
      name: getRegionalRoleDisplayName(permissionRoleMap, code, region, permissionRoleMap[code]?.name || code),
    };
  }

  if (role === 'standard_user') {
    const deptFallback = resolveFallbackRoleFromStandardUser(normalizedDepartment, normalizedTitle);
    if (deptFallback) {
      return {
        code: deptFallback,
        name: getRegionalRoleDisplayName(permissionRoleMap, deptFallback, region, permissionRoleMap[deptFallback]?.name || deptFallback),
      };
    }
  }

  return {
    code: role || 'Unassigned',
    name: getRegionalRoleDisplayName(
      permissionRoleMap,
      role || 'Unassigned',
      region,
      permissionRoleMap[role]?.name || role || '未分配',
    ),
  };
}

export function resolvePermissionRoleCode(
  rawRole?: string,
  title?: string,
  department?: string,
  region?: string,
) {
  return resolvePermissionRole(EMPTY_PERMISSION_ROLE_MAP, rawRole, title, department, region).code;
}

export function deriveAccountRoleDefaults(params: {
  rawRole?: string;
  title?: string;
  department?: string;
  region?: string;
}) {
  const region = inferRegionCode(params.region, params.department);
  const role = resolvePermissionRoleCode(
    params.rawRole,
    params.title,
    params.department,
    region,
  );

  return {
    role,
    region,
  };
}
