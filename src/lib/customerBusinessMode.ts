const normalizeLower = (value: unknown) => String(value || '').trim().toLowerCase();

const safeParse = (raw: string | null) => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export type CustomerBusinessMode = {
  projectRevisionEnabled: boolean;
  mode: 'standard' | 'project_enabled';
};

export const resolveCustomerBusinessMode = (): CustomerBusinessMode => {
  if (typeof window === 'undefined') {
    return {
      projectRevisionEnabled: false,
      mode: 'standard',
    };
  }

  const explicitMode = normalizeLower(localStorage.getItem('cosun_customer_business_mode'));
  if (explicitMode === 'project_enabled') {
    return {
      projectRevisionEnabled: true,
      mode: 'project_enabled',
    };
  }

  const customerProfile = safeParse(localStorage.getItem('cosun_customer_profile')) as any;
  const backendUser = safeParse(localStorage.getItem('cosun_backend_user')) as any;
  const authUser = safeParse(localStorage.getItem('cosun_auth_user')) as any;

  const projectRevisionEnabled = Boolean(
    customerProfile?.features?.projectRevisionWorkflow ||
    customerProfile?.projectRevisionEnabled ||
    customerProfile?.customerBusinessMode === 'project_enabled' ||
    backendUser?.features?.projectRevisionWorkflow ||
    backendUser?.projectRevisionEnabled ||
    backendUser?.customerBusinessMode === 'project_enabled' ||
    authUser?.features?.projectRevisionWorkflow ||
    authUser?.projectRevisionEnabled ||
    authUser?.customerBusinessMode === 'project_enabled',
  );

  return {
    projectRevisionEnabled,
    mode: projectRevisionEnabled ? 'project_enabled' : 'standard',
  };
};
