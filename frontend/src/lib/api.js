import { clearSession, getStoredSession } from "@/lib/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8081";

async function parseJsonResponse(res) {
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      payload && typeof payload.message === "string"
        ? payload.message
        : "Error en la petición";
    throw new Error(message);
  }
  return payload;
}

export async function apiFetch(path, options = {}, onUnauthorized) {
  const session = getStoredSession();
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearSession();
    onUnauthorized?.();
    throw new Error("Sesión expirada");
  }

  if (res.status === 204) {
    return null;
  }

  return parseJsonResponse(res);
}

export async function listUsers(onUnauthorized) {
  return apiFetch("/api/users", {}, onUnauthorized);
}

export async function createUser(data, onUnauthorized) {
  return apiFetch(
    "/api/users",
    { method: "POST", body: JSON.stringify(data) },
    onUnauthorized
  );
}

export async function updateUser(id, data, onUnauthorized) {
  return apiFetch(
    `/api/users/${id}`,
    { method: "PUT", body: JSON.stringify(data) },
    onUnauthorized
  );
}

export async function toggleUserStatus(id, enabled, onUnauthorized) {
  return apiFetch(
    `/api/users/${id}/status`,
    { method: "PATCH", body: JSON.stringify({ enabled }) },
    onUnauthorized
  );
}

export async function deleteUser(id, onUnauthorized) {
  return apiFetch(
    `/api/users/${id}`,
    { method: "DELETE" },
    onUnauthorized
  );
}
