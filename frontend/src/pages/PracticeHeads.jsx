import { useCallback, useEffect, useState } from "react";
import { LayoutGrid, List, UserPlus } from "lucide-react";
import PageCard from "@/components/PageCard";
import SearchFilterBanner from "@/components/SearchFilterBanner";
import PracticeHeadCard from "@/components/practice-heads/PracticeHeadCard";
import PracticeHeadForm from "@/components/practice-heads/PracticeHeadForm";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSemester } from "@/contexts/SemesterContext";
import {
  createPracticeHead,
  deletePracticeHead,
  getPracticeHead,
  listPracticeHeads,
  updatePracticeHead,
} from "@/lib/api";
import { cn } from "@/lib/utils";

function PracticeHeads({ searchFilter, onClearSearchFilter }) {
  const { logout, user } = useAuth();
  const { semester } = useSemester();
  const isAdmin = user?.role === "ADMIN";

  const [practiceHeads, setPracticeHeads] = useState([]);
  const [viewMode, setViewMode] = useState("grid");
  const [pageView, setPageView] = useState("list");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPracticeHead, setEditingPracticeHead] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleUnauthorized = useCallback(() => {
    logout();
  }, [logout]);

  const isSearchActive =
    searchFilter?.type === "practiceHead" && searchFilter.id != null;

  const loadPracticeHeads = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (isSearchActive) {
        const data = await getPracticeHead(searchFilter.id, handleUnauthorized);
        setPracticeHeads([data]);
        return;
      }

      const data = await listPracticeHeads({ semester }, handleUnauthorized);
      setPracticeHeads(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar jefes de práctica");
      if (isSearchActive) {
        setPracticeHeads([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSearchActive, searchFilter?.id, semester, handleUnauthorized]);

  useEffect(() => {
    if (pageView === "list") {
      loadPracticeHeads();
    }
  }, [loadPracticeHeads, pageView]);

  useEffect(() => {
    if (searchFilter?.type !== "practiceHead" || !searchFilter.id) {
      return;
    }

    setPageView("list");
    setEditingPracticeHead(null);
    setFormError(null);
  }, [searchFilter]);

  const closeForm = () => {
    setPageView("list");
    setEditingPracticeHead(null);
    setFormError(null);
  };

  const openCreateForm = () => {
    setEditingPracticeHead(null);
    setFormError(null);
    setPageView("form");
  };

  const openEditForm = (practiceHead) => {
    setEditingPracticeHead(practiceHead);
    setFormError(null);
    setPageView("form");
  };

  const handleFormSubmit = async (payload) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      if (editingPracticeHead?.id) {
        await updatePracticeHead(editingPracticeHead.id, { ...payload, semester }, handleUnauthorized);
      } else {
        await createPracticeHead({ ...payload, semester }, handleUnauthorized);
      }
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar jefe de práctica");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (practiceHead) => {
    const confirmed = window.confirm(
      `¿Eliminar a "${practiceHead.fullName}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      await deletePracticeHead(practiceHead.id, handleUnauthorized);
      if (editingPracticeHead?.id === practiceHead.id) {
        closeForm();
      }
      await loadPracticeHeads();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar jefe de práctica");
    }
  };

  const isFormView = pageView === "form";
  const pageTitle = isFormView
      ? editingPracticeHead
      ? "Editar jefe de práctica"
      : "Añadir jefe de práctica"
    : "Jefes de Práctica";

  const pageDescription = isFormView
    ? "Complete los datos del jefe de práctica y sus laboratorios asignados."
    : "Gestión y consulta de jefes de práctica por laboratorio.";

  return (
    <PageCard title={pageTitle} description={pageDescription}>
      {isFormView ? (
        <PracticeHeadForm
          practiceHead={editingPracticeHead}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
          error={formError}
          onUnauthorized={handleUnauthorized}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                  aria-label="Vista en cuadrícula"
                  title="Vista en cuadrícula"
                >
                  <LayoutGrid className="size-4" />
                </Button>
                <Button
                  type="button"
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                  aria-label="Vista en lista"
                  title="Vista en lista"
                >
                  <List className="size-4" />
                </Button>
              </div>

              {isAdmin && (
                <Button type="button" onClick={openCreateForm}>
                  <UserPlus className="size-4" />
                  Añadir personal
                </Button>
              )}
            </div>
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          {isSearchActive && (
            <SearchFilterBanner
              label={searchFilter.label}
              onClear={onClearSearchFilter}
            />
          )}

          {isLoading ? (
            <p className="text-sm text-muted-foreground">Cargando jefes de práctica...</p>
          ) : practiceHeads.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isSearchActive
                ? "No se encontró el jefe de práctica seleccionado."
                : "No hay jefes de práctica registrados."}
            </p>
          ) : (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid gap-4 pb-6 sm:grid-cols-2 xl:grid-cols-4"
                  : "flex flex-col gap-3 pb-6"
              )}
            >
              {practiceHeads.map((practiceHead) => (
                <PracticeHeadCard
                  key={practiceHead.id}
                  practiceHead={practiceHead}
                  viewMode={viewMode}
                  isAdmin={isAdmin}
                  onEdit={openEditForm}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </PageCard>
  );
}

export default PracticeHeads;
