"use client";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  body?: BodyInit | null;
  headers?: HeadersInit;
  timeoutMs?: number;
  skipAuthRefresh?: boolean;
};

export interface AuthRole {
  id: string;
  name: string;
  key: string;
}

export interface AuthProfile {
  id: string;
  name: string;
  phoneNumber: string;
  email?: string;
  type: string;
  isActive: boolean;
  gender?: string;
  roles?: AuthRole[];
  currentRole?: AuthRole;
  permissions?: Array<{ id?: string; name?: string; key: string }>;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  profile: AuthProfile;
}

export interface CurrentUserResponse {
  id: string;
  name: string;
  email?: string;
  type?: string;
  phoneNumber?: string;
  permissions?: string[];
  role?: AuthRole;
 }

function getApiBaseUrl() {
  const configuredUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (typeof window !== "undefined" && configuredUrl) {
    try {
      const url = new URL(configuredUrl);
      if (url.port === "6000") {
        return "/api/backend";
      }
    } catch {
      return configuredUrl;
    }
  }

  return configuredUrl || "/api/backend";
}

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
}

function getAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const tokenKeys = [
    "auth_token",
    "access_token",
    "accessToken",
    "token",
    "jwt",
  ];

  for (const key of tokenKeys) {
    const value = window.localStorage.getItem(key);
    if (value) {
      return value;
    }
  }

  return null;
}

function getRefreshToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

async function parseResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

let refreshRequest: Promise<string> | null = null;

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
) {
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15000;
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}${path}`, {
      method: options.method || "GET",
      headers,
      body: options.body,
      signal: controller.signal,
    });

    const payload = await parseResponse(response);

    if (!response.ok) {
      const isAuthFailure = response.status === 401 || response.status === 403;
      if (!options.skipAuthRefresh && isAuthFailure && path !== "/auth/refresh") {
        const refreshedToken = await refreshAccessToken();
        if (refreshedToken) {
          return apiRequest<T>(path, {
            ...options,
            skipAuthRefresh: true,
          });
        }
      }

      const message =
        typeof payload === "object" && payload && "message" in payload
          ? Array.isArray(payload.message)
            ? payload.message.join(", ")
            : String(payload.message)
          : typeof payload === "object" && payload && "error" in payload
            ? String(payload.error)
          : `Request failed with status ${response.status}`;

      throw new ApiError(message, response.status);
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The request timed out. Please try again.", 408);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function isApiConfigured() {
  return Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);
}

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const PROFILE_KEY = "auth_profile";

function setCookie(name: string, value: string, maxAgeSeconds = 60 * 60) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax${secure}`;
}

function clearCookie(name: string) {
  if (typeof document === "undefined") {
    return;
  }

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${secure}`;
}

function updateAccessToken(accessToken: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  }

  setCookie(ACCESS_TOKEN_KEY, accessToken);
}

export function setAuthSession(login: LoginResponse) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, login.accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, login.refreshToken);
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(login.profile));
  setCookie(ACCESS_TOKEN_KEY, login.accessToken);
  setCookie(REFRESH_TOKEN_KEY, login.refreshToken, 60 * 60 * 24 * 7);
}

export function clearAuthSession() {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    window.localStorage.removeItem(PROFILE_KEY);
  }

  clearCookie(ACCESS_TOKEN_KEY);
  clearCookie(REFRESH_TOKEN_KEY);
}

export function getStoredProfile() {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(PROFILE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthProfile;
  } catch {
    return null;
  }
}

export function isStoredSuperAdmin() {
  const profile = getStoredProfile();
  const roleKeys = [
    profile?.currentRole?.key,
    ...(profile?.roles?.map((role) => role.key) || []),
  ].filter(Boolean);

  return roleKeys.includes("super_admin");
}

export function getStoredPermissionKeys() {
  if (isStoredSuperAdmin()) {
    return ["*"];
  }

  const profile = getStoredProfile();
  return (profile?.permissions || [])
    .map((permission) => permission.key)
    .filter(Boolean);
}

export function hasStoredPermission(required: string | string[]) {
  if (isStoredSuperAdmin()) {
    return true;
  }

  const requiredPermissions = Array.isArray(required) ? required : [required];
  const currentPermissions = new Set(getStoredPermissionKeys());

  return requiredPermissions.some((permission) => currentPermissions.has(permission));
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    clearAuthSession();
    return null;
  }

  if (!refreshRequest) {
    refreshRequest = (async () => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(`${getApiBaseUrl()}/auth/refresh`, {
          method: "POST",
          headers: {
            Accept: "application/json",
            "x-refresh-token": refreshToken,
          },
          signal: controller.signal,
        });

        const payload = await parseResponse(response);

        if (!response.ok) {
          const message =
            typeof payload === "object" && payload && "message" in payload
              ? Array.isArray(payload.message)
                ? payload.message.join(", ")
                : String(payload.message)
              : typeof payload === "object" && payload && "error" in payload
                ? String(payload.error)
              : `Request failed with status ${response.status}`;

          throw new ApiError(message, response.status);
        }

        const data = payload as RefreshResponse;
        if (!data?.accessToken) {
          throw new ApiError("Refresh succeeded but no access token was returned.", 500);
        }

        updateAccessToken(data.accessToken);
        if (data.refreshToken) {
          window.localStorage.setItem(REFRESH_TOKEN_KEY, data.refreshToken);
          setCookie(REFRESH_TOKEN_KEY, data.refreshToken, 60 * 60 * 24 * 7);
        }
        return data.accessToken;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          throw new ApiError("The refresh request timed out. Please sign in again.", 408);
        }

        throw error;
      } finally {
        window.clearTimeout(timeoutId);
      }
    })()
      .catch((error) => {
        clearAuthSession();
        throw error;
      })
      .finally(() => {
        refreshRequest = null;
      });
  }

  return refreshRequest;
}

export async function login(payload: {
  phoneNumber: string;
  password: string;
  type: string;
}) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function getCurrentUser(options?: { skipAuthRefresh?: boolean }) {
  return apiRequest<CurrentUserResponse>("/auth/get-user-info", {
    skipAuthRefresh: options?.skipAuthRefresh,
  });
}

export async function logout() {
  try {
    await apiRequest("/auth/logout", {
      method: "POST",
    });
  } finally {
    clearAuthSession();
  }
}
