const ACCESS_TOKEN_KEY = "cm_access_token";
const USER_ROLE_KEY = "cm_user_role";

export type UserRole = "ADMIN" | "MEDECIN" | "SECRETAIRE";

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setSession(token: string, role: UserRole) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
  localStorage.setItem(USER_ROLE_KEY, role);
}

export function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
}

export function isAuthenticated() {
  return Boolean(getAccessToken());
}

export function getUserRole() {
  return (localStorage.getItem(USER_ROLE_KEY) as UserRole | null) ?? null;
}
