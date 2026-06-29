const AUTH_STORAGE_KEY = "schedule.auth";

export function getStoredSession() {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export async function login({ username, password }) {
  const trimmedUsername = username.trim();
  const trimmedPassword = password.trim();

  if (!trimmedUsername || !trimmedPassword) {
    throw new Error("Usuario y contraseña son obligatorios");
  }

  // TODO: conectar con POST /api/auth/login
  // const res = await fetch("/api/auth/login", {
  //   method: "POST",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify({ username: trimmedUsername, password: trimmedPassword }),
  // });
  // if (!res.ok) throw new Error("Credenciales inválidas");
  // const data = await res.json();
  // saveSession(data);
  // return data;

  const session = {
    user: { username: trimmedUsername },
    token: "mock-token",
  };

  saveSession(session);
  return session;
}

export function logout() {
  clearSession();
}
