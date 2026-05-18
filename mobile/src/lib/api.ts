import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Resolve the backend base URL.
 *
 * Native: bundled `EXPO_PUBLIC_BACKEND_URL` env var (set at build time).
 * Web (deployed at same host as backend, e.g. emergent.host): use same-origin
 *   so the bundle automatically targets whichever host serves it.
 * Web (Expo dev tunnel — `expo.preview` subdomain): backend lives on a
 *   different subdomain, so fall back to the bundled env var.
 */
export function resolveBackendUrl(): string {
  if (typeof window === 'undefined' || !window.location) {
    return (process.env.EXPO_PUBLIC_BACKEND_URL || '').replace(/\/$/, '');
  }
  const origin = window.location.origin;
  if (origin.includes('.expo.preview.') || origin.includes('localhost')) {
    return (process.env.EXPO_PUBLIC_BACKEND_URL || origin).replace(/\/$/, '');
  }
  return origin.replace(/\/$/, '');
}

const BACKEND_URL = resolveBackendUrl();
export const API_BASE = `${BACKEND_URL}/api`;
export const TOKEN_KEY = 'dhl_auth_token';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — auto-logout on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error?.response?.status === 401) {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
    return Promise.reject(error);
  },
);

export default api;
