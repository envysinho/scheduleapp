import { useCallback, useEffect, useState } from "react";
import { Ban, CheckCircle2, Pencil, Trash2, UserPlus } from "lucide-react";
import PageCard from "@/components/PageCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import {
  createUser,
  deleteUser,
  listUsers,
  toggleUserStatus,
  updateUser,
} from "@/lib/api";

const ROLE_OPTIONS = [
  { value: "USER", label: "USER" },
  { value: "ADMIN", label: "ADMIN" },
];

const EMPTY_FORM = {
  username: "",
  password: "",
  role: "USER",
  enabled: true,
};

function Users() {
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnauthorized = useCallback(() => {
    logout();
  }, [logout]);

  const loadUsers = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const data = await listUsers(handleUnauthorized);
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar usuarios");
    } finally {
      setIsLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setSuccessMessage(null);
  };

  const clearFormFields = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const isEditing = Boolean(editingId);
      if (isEditing) {
        const payload = {
          username: form.username.trim(),
          role: form.role,
          enabled: form.enabled,
        };
        if (form.password.trim()) {
          payload.password = form.password;
        }
        await updateUser(editingId, payload, handleUnauthorized);
      } else {
        await createUser(
          {
            username: form.username.trim(),
            password: form.password,
            role: form.role,
          },
          handleUnauthorized
        );
      }
      clearFormFields();
      setSuccessMessage(isEditing ? "Usuario actualizado." : "Usuario creado.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al guardar usuario");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (user) => {
    setEditingId(user.id);
    setError(null);
    setSuccessMessage(null);
    setForm({
      username: user.username,
      password: "",
      role: user.role,
      enabled: user.enabled,
    });
  };

  const handleToggleStatus = async (user) => {
    setError(null);
    setSuccessMessage(null);
    try {
      await toggleUserStatus(user.id, !user.enabled, handleUnauthorized);
      if (editingId === user.id) {
        setForm((current) => ({ ...current, enabled: !user.enabled }));
      }
      setSuccessMessage(user.enabled ? "Usuario desactivado." : "Usuario activado.");
      await loadUsers();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al cambiar el estado del usuario"
      );
    }
  };

  const handleDelete = async (user) => {
    const confirmed = window.confirm(
      `¿Eliminar permanentemente a "${user.username}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    setSuccessMessage(null);
    try {
      await deleteUser(user.id, handleUnauthorized);
      if (editingId === user.id) {
        clearFormFields();
      }
      setSuccessMessage("Usuario eliminado.");
      await loadUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar usuario");
    }
  };

  return (
    <PageCard
      title="Usuarios"
      description="Administración de cuentas de acceso al sistema."
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/40">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Usuario</th>
                <th className="px-4 py-3 text-left font-medium">Rol</th>
                <th className="px-4 py-3 text-left font-medium">Estado</th>
                <th className="px-4 py-3 text-right font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                    No hay usuarios registrados.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">{user.username}</td>
                    <td className="px-4 py-3">{user.role}</td>
                    <td className="px-4 py-3">
                      {user.enabled ? "Activo" : "Inactivo"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleEdit(user)}
                          aria-label={`Editar ${user.username}`}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleToggleStatus(user)}
                          aria-label={
                            user.enabled
                              ? `Desactivar ${user.username}`
                              : `Activar ${user.username}`
                          }
                          title={user.enabled ? "Desactivar" : "Activar"}
                        >
                          {user.enabled ? (
                            <Ban className="size-4" />
                          ) : (
                            <CheckCircle2 className="size-4" />
                          )}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleDelete(user)}
                          aria-label={`Eliminar ${user.username}`}
                          title="Eliminar"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <form className="flex flex-col gap-4 rounded-md border p-4" onSubmit={handleSubmit}>
          <div className="flex items-center gap-2">
            <UserPlus className="size-4" />
            <h3 className="font-medium">
              {editingId ? "Editar usuario" : "Nuevo usuario"}
            </h3>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-username">Usuario</Label>
            <Input
              id="user-username"
              value={form.username}
              onChange={(event) =>
                setForm((current) => ({ ...current, username: event.target.value }))
              }
              required
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-password">
              Contraseña{editingId ? " (opcional)" : ""}
            </Label>
            <Input
              id="user-password"
              type="password"
              value={form.password}
              onChange={(event) =>
                setForm((current) => ({ ...current, password: event.target.value }))
              }
              required={!editingId}
              disabled={isSubmitting}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="user-role">Rol</Label>
            <Select
              items={ROLE_OPTIONS}
              value={form.role}
              onValueChange={(value) =>
                setForm((current) => ({ ...current, role: value }))
              }
              disabled={isSubmitting}
            >
              <SelectTrigger id="user-role" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger>
                <SelectGroup>
                  {ROLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {editingId && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(event) =>
                  setForm((current) => ({ ...current, enabled: event.target.checked }))
                }
                disabled={isSubmitting}
              />
              Usuario activo
            </label>
          )}

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {successMessage && (
            <p className="text-sm text-green-600 dark:text-green-400" role="status">
              {successMessage}
            </p>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Guardando..." : editingId ? "Actualizar" : "Crear"}
            </Button>
            {editingId && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </div>
    </PageCard>
  );
}

export default Users;
