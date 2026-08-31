import axios from "axios";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== "undefined"
    ? `${window.location.origin.replace(/:3000$/, ":5000")}`
    : "http://localhost:5000");

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  withCredentials: true,
  timeout: 15_000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token from localStorage if available
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      // Don't redirect for public storefront pages
      const isPublicRoute = window.location.pathname === "/" || 
        window.location.pathname.startsWith("/product") ||
        window.location.pathname.startsWith("/category");
      
      if (!isPublicRoute) {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export { api, API_BASE };
