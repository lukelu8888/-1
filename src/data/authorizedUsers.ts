type AuthorizedUser = {
  id?: string | null;
  userId?: string | null;
  name?: string;
  username?: string;
  email?: string;
  role?: string;
  userRole?: string;
  portalRole?: string;
  rbacRole?: string;
  company?: string;
  companyName?: string;
  companyId?: string | null;
  region?: string;
};

const safeParse = (value: string | null) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

export const getCurrentUser = (): AuthorizedUser | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const authUser = safeParse(window.localStorage.getItem('cosun_auth_user')) as any;
  const backendUser = safeParse(window.localStorage.getItem('cosun_backend_user')) as any;
  const customerProfile = safeParse(window.localStorage.getItem('cosun_customer_profile')) as any;
  const currentUser = safeParse(window.localStorage.getItem('cosun_current_user')) as any;

  const merged = {
    ...customerProfile,
    ...backendUser,
    ...authUser,
    ...currentUser,
  };

  if (!merged || (!merged.email && !merged.name && !merged.username)) {
    return null;
  }

  return {
    id: merged.id || merged.userId || null,
    userId: merged.userId || merged.id || null,
    name: merged.name || merged.username || merged.contactPerson || '',
    username: merged.username || merged.name || merged.contactPerson || '',
    email: merged.email || '',
    role: merged.role || merged.userRole || merged.portalRole || merged.rbacRole || '',
    userRole: merged.userRole || merged.role || '',
    portalRole: merged.portalRole || '',
    rbacRole: merged.rbacRole || '',
    company: merged.company || merged.companyName || '',
    companyName: merged.companyName || merged.company || '',
    companyId: merged.companyId || null,
    region: merged.region || 'North America',
  };
};

export default getCurrentUser;
