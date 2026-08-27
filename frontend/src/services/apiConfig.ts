/**
 * Centralized API configuration for the frontend application.
 *
 * During local development (or when VITE_API_BASE_URL is not set):
 * - API_BASE defaults to '/api' which is forwarded to http://localhost:8081 by Vite dev proxy.
 *
 * In production deployment:
 * - Set VITE_API_BASE_URL to your deployed backend URL (e.g. https://klu-tracker-api.onrender.com).
 * - API_BASE will resolve to https://klu-tracker-api.onrender.com/api.
 */
const rawBase = import.meta.env.VITE_API_BASE_URL;

export const API_BASE: string = rawBase
  ? `${rawBase.replace(/\/+$/, '')}/api`
  : '/api';

export const NOTIFICATIONS_API_BASE: string = `${API_BASE}/notifications`;
