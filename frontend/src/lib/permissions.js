export const ROLE_LABELS = {
  OWNER: "Owner",
  ADMIN: "Admin",
  DOCENTE: "Docente",
  ESTUDIANTE: "Estudiante",
};

export function isOwner(user) {
  return user?.role === "OWNER";
}

export function isAdmin(user) {
  return user?.role === "ADMIN";
}

export function canManageAcademic(user) {
  return isOwner(user) || isAdmin(user);
}

export function canManageUsers(user) {
  return isOwner(user) || isAdmin(user);
}

export function canViewPracticeHeads(user) {
  return user?.role !== "ESTUDIANTE";
}

export function isStudent(user) {
  return user?.role === "ESTUDIANTE";
}
