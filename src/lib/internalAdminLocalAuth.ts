const LOCAL_ADMIN_AUTH_STORAGE_KEY = 'cosun_admin_local_auth'
const LOCAL_ADMIN_AUTH_EMAIL_STORAGE_KEY = 'cosun_admin_local_auth_email'
const LOCAL_ADMIN_AUTH_PASSWORD_STORAGE_KEY = 'cosun_admin_local_auth_password'

export function getLocalAdminAuth() {
  if (typeof window === 'undefined') {
    return {
      enabled: false,
      email: '',
      password: '',
    }
  }

  return {
    enabled: localStorage.getItem(LOCAL_ADMIN_AUTH_STORAGE_KEY) === 'true',
    email: String(localStorage.getItem(LOCAL_ADMIN_AUTH_EMAIL_STORAGE_KEY) || '').trim().toLowerCase(),
    password: String(sessionStorage.getItem(LOCAL_ADMIN_AUTH_PASSWORD_STORAGE_KEY) || '').trim(),
  }
}
