/**
 * Centralized API client for Multi-Tenant SaaS
 * Automatically prefixes API_BASE_URL in production (pointing to the live VPS backend)
 * or falls back to relative `/api` for local Vite proxy development.
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const apiFetch = (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  return fetch(url, options);
};

export default apiFetch;
