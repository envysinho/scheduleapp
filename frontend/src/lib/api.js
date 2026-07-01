import { clearSession, getStoredSession } from "@/lib/auth";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8081";

async function parseJsonResponse(res) {
  const payload = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      payload && typeof payload.message === "string"
        ? payload.message
        : payload && typeof payload.error === "string"
          ? payload.error
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

function buildTeachersQuery(filters = {}) {
  const params = new URLSearchParams();
  if (filters.employmentType) {
    params.set("employmentType", filters.employmentType);
  }
  if (filters.shift) {
    params.set("shift", filters.shift);
  }
  if (filters.cycle) {
    params.set("cycle", String(filters.cycle));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listTeachers(filters, onUnauthorized) {
  return apiFetch(`/api/teachers${buildTeachersQuery(filters)}`, {}, onUnauthorized);
}

export async function getTeacher(id, onUnauthorized) {
  return apiFetch(`/api/teachers/${id}`, {}, onUnauthorized);
}

export async function createTeacher(data, onUnauthorized) {
  return apiFetch(
    "/api/teachers",
    { method: "POST", body: JSON.stringify(data) },
    onUnauthorized
  );
}

export async function updateTeacher(id, data, onUnauthorized) {
  return apiFetch(
    `/api/teachers/${id}`,
    { method: "PUT", body: JSON.stringify(data) },
    onUnauthorized
  );
}

export async function deleteTeacher(id, onUnauthorized) {
  return apiFetch(
    `/api/teachers/${id}`,
    { method: "DELETE" },
    onUnauthorized
  );
}

function buildSpacesQuery(filters = {}) {
  const params = new URLSearchParams();
  if (filters.spaceType) {
    params.set("spaceType", filters.spaceType);
  }
  if (filters.availability) {
    params.set("availability", filters.availability);
  }
  if (filters.cycle) {
    params.set("cycle", String(filters.cycle));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listSpaces(filters, onUnauthorized) {
  return apiFetch(`/api/spaces${buildSpacesQuery(filters)}`, {}, onUnauthorized);
}

export async function getSpace(id, onUnauthorized) {
  return apiFetch(`/api/spaces/${id}`, {}, onUnauthorized);
}

export async function createSpace(data, onUnauthorized) {
  return apiFetch(
    "/api/spaces",
    { method: "POST", body: JSON.stringify(data) },
    onUnauthorized
  );
}

export async function updateSpace(id, data, onUnauthorized) {
  return apiFetch(
    `/api/spaces/${id}`,
    { method: "PUT", body: JSON.stringify(data) },
    onUnauthorized
  );
}

export async function deleteSpace(id, onUnauthorized) {
  return apiFetch(
    `/api/spaces/${id}`,
    { method: "DELETE" },
    onUnauthorized
  );
}

function buildCoursesQuery(filters = {}) {
  const params = new URLSearchParams();
  if (filters.type) {
    params.set("type", filters.type);
  }
  if (filters.availability) {
    params.set("availability", filters.availability);
  }
  if (filters.shift) {
    params.set("shift", filters.shift);
  }
  if (filters.cycle) {
    params.set("cycle", String(filters.cycle));
  }
  const query = params.toString();
  return query ? `?${query}` : "";
}

export async function listCourses(filters, onUnauthorized) {
  return apiFetch(`/api/courses${buildCoursesQuery(filters)}`, {}, onUnauthorized);
}

export async function getCourse(id, onUnauthorized) {
  return apiFetch(`/api/courses/${id}`, {}, onUnauthorized);
}

export async function createCourse(data, onUnauthorized) {
  return apiFetch(
    "/api/courses",
    { method: "POST", body: JSON.stringify(data) },
    onUnauthorized
  );
}

export async function updateCourse(id, data, onUnauthorized) {
  return apiFetch(
    `/api/courses/${id}`,
    { method: "PUT", body: JSON.stringify(data) },
    onUnauthorized
  );
}

export async function deleteCourse(id, onUnauthorized) {
  return apiFetch(
    `/api/courses/${id}`,
    { method: "DELETE" },
    onUnauthorized
  );
}
