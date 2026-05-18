import axios from "axios";

// Resolve backend base URL with a safe fallback:
//   1) Build-time env (CRA bakes `process.env.REACT_APP_BACKEND_URL`).
//   2) Same-origin: Emergent ingress routes `/api/*` to the backend at any
//      production host, so when the env var is missing or undefined we point
//      to wherever the page itself is served from.
//   3) Last resort: localhost (only relevant for SSR / build / unit-test
//      contexts where `window` is undefined).
const ENV_URL = (typeof process !== "undefined" && process.env && process.env.REACT_APP_BACKEND_URL) || "";
const ORIGIN_URL = (typeof window !== "undefined" && window.location && window.location.origin) || "";
const BACKEND_URL = ENV_URL || ORIGIN_URL || "http://localhost:8001";
export const API_BASE = `${BACKEND_URL}/api`;
export const TOKEN_KEY = "dhl_auth_token";

const api = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach JWT
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
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
  (error) => {
    if (error?.response?.status === 401) {
      const path = window.location.pathname;
      // only force redirect when we're on a protected route
      if (path.startsWith("/dashboard")) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  },
);

export default api;
