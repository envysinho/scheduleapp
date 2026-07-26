import { useCallback, useEffect, useState } from "react";
import { Building2, CalendarDays, LayoutGrid, List } from "lucide-react";
import PageCard from "@/components/PageCard";
import SearchFilterBanner from "@/components/SearchFilterBanner";
import SpaceCard from "@/components/spaces/SpaceCard";
import SpaceCalendarView from "@/components/spaces/SpaceCalendarView";
import SpaceForm from "@/components/spaces/SpaceForm";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { useAuth } from "@/contexts/AuthContext";
import { useSemester } from "@/contexts/SemesterContext";
import {
  CYCLES,
  AVAILABILITY_FILTERS,
  CYCLE_FILTERS,
  SPACE_TYPE_FILTERS,
} from "@/lib/constants";
import {
  createSpace,
  deleteSpace,
  getSchedule,
  getScheduleSettings,
  getSpace,
  listPracticeHeads,
  listSpaces,
  updatePracticeHead,
  updateSpace,
} from "@/lib/api";
import { canManageAcademic, canViewPracticeHeads, isStudent } from "@/lib/permissions";
import { cn } from "@/lib/utils";

function buildPracticeHeadBySpaceId(practiceHeads) {
  const practiceHeadBySpaceId = new Map();

  for (const practiceHead of practiceHeads ?? []) {
    for (const assignment of practiceHead.labAssignments ?? []) {
      if (assignment?.spaceId != null && !practiceHeadBySpaceId.has(assignment.spaceId)) {
        practiceHeadBySpaceId.set(assignment.spaceId, practiceHead);
      }
    }
  }

  return practiceHeadBySpaceId;
}

function withAssignedPracticeHeads(spaces, practiceHeads) {
  const practiceHeadBySpaceId = buildPracticeHeadBySpaceId(practiceHeads);

  return spaces.map((space) => {
    const practiceHead = practiceHeadBySpaceId.get(space.id);

    return {
      ...space,
      practiceHeadId: practiceHead?.id ?? null,
      practiceHeadName: practiceHead?.fullName ?? null,
      practiceHeadPhone: practiceHead?.phone ?? null,
    };
  });
}

function Spaces({ searchFilter, onClearSearchFilter }) {
  const { logout, user } = useAuth();
  const { semester } = useSemester();
  const isAdmin = canManageAcademic(user);
  const canLoadPracticeHeads = canViewPracticeHeads(user);
  const forcedCycle = isStudent(user) ? user?.assignedCycle ?? null : null;

  const [spaces, setSpaces] = useState([]);
  const [practiceHeads, setPracticeHeads] = useState([]);
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [scheduleBlocks, setScheduleBlocks] = useState([]);
  const [viewMode, setViewMode] = useState("list");
  const [spaceType, setSpaceType] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [cycle, setCycle] = useState(null);

  const [pageView, setPageView] = useState("list");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingSpace, setEditingSpace] = useState(null);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const cycleAnchor = useComboboxAnchor();

  const handleUnauthorized = useCallback(() => {
    logout();
  }, [logout]);

  const isSearchActive =
    searchFilter?.type === "space" && searchFilter.id != null;

  const loadScheduleSlots = useCallback(async () => {
    if (viewMode !== "calendar") {
      return [];
    }

    const cyclesToLoad = forcedCycle != null
      ? [forcedCycle]
      : cycle != null
        ? [cycle]
        : CYCLES.map((item) => item.id);

    const schedules = await Promise.all(
      cyclesToLoad.map((cycleId) =>
        getSchedule({ semester, cycle: cycleId }, handleUnauthorized).catch((error) => {
          if (error instanceof Error && error.message.includes("Ciclo inválido")) {
            return { slots: [] };
          }
          throw error;
        })
      )
    );

    return schedules.flatMap((schedule) => schedule?.slots ?? []);
  }, [cycle, forcedCycle, handleUnauthorized, semester, viewMode]);

  const loadSpaces = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      if (isSearchActive) {
        const [data, practiceHeads, slots, settings] = await Promise.all([
          getSpace(searchFilter.id, { semester }, handleUnauthorized),
          canLoadPracticeHeads
            ? listPracticeHeads({ semester }, handleUnauthorized)
            : Promise.resolve([]),
          loadScheduleSlots(),
          viewMode === "calendar"
            ? getScheduleSettings({ semester }, handleUnauthorized)
            : Promise.resolve({ blocks: [] }),
        ]);
        setPracticeHeads(practiceHeads);
        setSpaces(withAssignedPracticeHeads([data], practiceHeads));
        setScheduleSlots(slots);
        setScheduleBlocks(settings?.blocks ?? []);
        return;
      }

      const [data, practiceHeads, slots, settings] = await Promise.all([
        listSpaces(
          { semester, spaceType, availability, cycle: forcedCycle ?? cycle },
          handleUnauthorized
        ),
        canLoadPracticeHeads
          ? listPracticeHeads({ semester }, handleUnauthorized)
          : Promise.resolve([]),
        loadScheduleSlots(),
        viewMode === "calendar"
          ? getScheduleSettings({ semester }, handleUnauthorized)
          : Promise.resolve({ blocks: [] }),
      ]);
      setPracticeHeads(practiceHeads);
      setSpaces(withAssignedPracticeHeads(data, practiceHeads));
      setScheduleSlots(slots);
      setScheduleBlocks(settings?.blocks ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar ambientes");
      setPracticeHeads([]);
      setScheduleSlots([]);
      setScheduleBlocks([]);
      if (isSearchActive) {
        setSpaces([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, [
    spaceType,
    availability,
    cycle,
    forcedCycle,
    canLoadPracticeHeads,
    semester,
    isSearchActive,
    searchFilter?.id,
    handleUnauthorized,
    loadScheduleSlots,
    viewMode,
  ]);

  useEffect(() => {
    if (pageView !== "form") {
      loadSpaces();
    }
  }, [loadSpaces, pageView]);

  useEffect(() => {
    if (forcedCycle != null) {
      setCycle(forcedCycle);
    }
  }, [forcedCycle]);

  useEffect(() => {
    if (searchFilter?.type !== "space" || !searchFilter.id) {
      return;
    }

    setPageView("list");
    setEditingSpace(null);
    setFormError(null);
    setSpaceType(null);
    setAvailability(null);
    setCycle(forcedCycle);
  }, [searchFilter, forcedCycle]);

  const closeForm = () => {
    setPageView("list");
    setEditingSpace(null);
    setFormError(null);
  };

  const openCreateForm = () => {
    setEditingSpace(null);
    setFormError(null);
    setPageView("form");
  };

  const openEditForm = (space) => {
    setEditingSpace(space);
    setFormError(null);
    setPageView("form");
  };

  const handleFormSubmit = async (payload) => {
    setFormError(null);
    setIsSubmitting(true);
    try {
      const spacePayload = {
        ...payload,
        semester,
      };
      const savedSpace = editingSpace?.id
        ? await updateSpace(editingSpace.id, spacePayload, handleUnauthorized)
        : await createSpace(spacePayload, handleUnauthorized);
      await syncPracticeHeadAssignment(savedSpace, payload.practiceHeadId);
      closeForm();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Error al guardar ambiente");
    } finally {
      setIsSubmitting(false);
    }
  };

  const syncPracticeHeadAssignment = async (space, nextPracticeHeadId) => {
    if (!canLoadPracticeHeads || !space?.id) {
      return;
    }

    const currentPracticeHead = practiceHeads.find((practiceHead) =>
      practiceHead.labAssignments?.some((assignment) => assignment.spaceId === space.id)
    );
    const shouldManagePracticeHead = space.spaceType === "LABORATORIO";
    const targetPracticeHeadId = shouldManagePracticeHead ? nextPracticeHeadId : null;

    if (currentPracticeHead && currentPracticeHead.id !== targetPracticeHeadId) {
      await updatePracticeHead(
        currentPracticeHead.id,
        {
          firstName: currentPracticeHead.firstName,
          lastName: currentPracticeHead.lastName,
          semester: currentPracticeHead.semester ?? semester,
          email: currentPracticeHead.email,
          phone: currentPracticeHead.phone,
          labAssignments: (currentPracticeHead.labAssignments ?? [])
            .filter((assignment) => assignment.spaceId !== space.id)
            .map((assignment) => ({ spaceId: assignment.spaceId })),
        },
        handleUnauthorized
      );
    }

    if (!targetPracticeHeadId || currentPracticeHead?.id === targetPracticeHeadId) {
      return;
    }

    const targetPracticeHead = practiceHeads.find((practiceHead) => practiceHead.id === targetPracticeHeadId);
    if (!targetPracticeHead) {
      throw new Error("Jefe de práctica no encontrado");
    }

    await updatePracticeHead(
      targetPracticeHead.id,
      {
        firstName: targetPracticeHead.firstName,
        lastName: targetPracticeHead.lastName,
        semester: targetPracticeHead.semester ?? semester,
        email: targetPracticeHead.email,
        phone: targetPracticeHead.phone,
        labAssignments: [
          ...(targetPracticeHead.labAssignments ?? [])
            .filter((assignment) => assignment.spaceId !== space.id)
            .map((assignment) => ({ spaceId: assignment.spaceId })),
          { spaceId: space.id },
        ],
      },
      handleUnauthorized
    );
  };

  const handleDelete = async (space) => {
    const confirmed = window.confirm(
      `¿Eliminar "${space.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      await deleteSpace(space.id, handleUnauthorized);
      if (editingSpace?.id === space.id) {
        closeForm();
      }
      await loadSpaces();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar ambiente");
    }
  };

  const handleSpaceTypeFilter = (value) => {
    setSpaceType(value);
    if (pageView === "form") {
      closeForm();
    }
  };

  const handleAvailabilityFilter = (value) => {
    setAvailability(value);
    if (pageView === "form") {
      closeForm();
    }
  };

  const selectedCycle =
    CYCLE_FILTERS.find((item) => item.value === cycle) ?? CYCLE_FILTERS[0];

  const isFormView = pageView === "form";
  const pageTitle = isFormView
    ? editingSpace
      ? "Editar ambiente"
      : "Añadir ambiente"
    : "Ambientes";

  const pageDescription = isFormView
    ? "Complete los datos del ambiente y sus cursos asignados."
    : "Gestión y consulta de ambientes por tipo, disponibilidad y ciclo.";

  return (
    <PageCard title={pageTitle} description={pageDescription}>
      {isFormView ? (
        <SpaceForm
          space={editingSpace}
          practiceHeads={practiceHeads}
          onSubmit={handleFormSubmit}
          onCancel={closeForm}
          isSubmitting={isSubmitting}
          error={formError}
        />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-2">
              <Label>Tipo de ambiente</Label>
              <div className="flex flex-wrap gap-1">
                {SPACE_TYPE_FILTERS.map((item) => (
                  <Button
                    key={item.label}
                    type="button"
                    variant={spaceType === item.value ? "default" : "outline"}
                    onClick={() => handleSpaceTypeFilter(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label>Disponibilidad</Label>
              <div className="flex flex-wrap gap-1">
                {AVAILABILITY_FILTERS.map((item) => (
                  <Button
                    key={item.label}
                    type="button"
                    variant={availability === item.value ? "default" : "outline"}
                    onClick={() => handleAvailabilityFilter(item.value)}
                  >
                    {item.label}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex min-w-[160px] flex-col gap-2">
              <Label htmlFor="filter-cycle">Ciclo</Label>
              <div ref={cycleAnchor} className="w-full">
                <Combobox
                  items={CYCLE_FILTERS.map((item) => item.label)}
                  value={selectedCycle.label}
                  onValueChange={(label) => {
                    const item = CYCLE_FILTERS.find((option) => option.label === label);
                    setCycle(item?.value ?? null);
                  }}
                >
                  <ComboboxInput
                    id="filter-cycle"
                    placeholder="Todos"
                    readOnly
                  />
                  <ComboboxContent anchor={cycleAnchor}>
                    <ComboboxEmpty>Sin opciones.</ComboboxEmpty>
                    <ComboboxList>
                      {(label) => (
                        <ComboboxItem key={label} value={label}>
                          {label}
                        </ComboboxItem>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <div className="flex items-center gap-1">
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
                <Button
                  type="button"
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("calendar")}
                  aria-label="Vista calendario"
                  title="Vista calendario"
                >
                  <CalendarDays className="size-4" />
                </Button>
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
              </div>

              {isAdmin && (
                <Button type="button" onClick={openCreateForm}>
                  <Building2 className="size-4" />
                  Añadir ambiente
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
            <p className="text-sm text-muted-foreground">Cargando ambientes...</p>
          ) : spaces.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {isSearchActive
                ? "No se encontró el ambiente seleccionado."
                : "No hay ambientes que coincidan con los filtros seleccionados."}
            </p>
          ) : viewMode === "calendar" ? (
            <SpaceCalendarView
              spaces={spaces}
              scheduleSlots={scheduleSlots}
              blocks={scheduleBlocks}
              isLoading={isLoading}
            />
          ) : (
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid gap-4 pb-6 sm:grid-cols-2 xl:grid-cols-4"
                  : "flex flex-col gap-3 pb-6"
              )}
            >
              {spaces.map((space) => (
                <SpaceCard
                  key={space.id}
                  space={space}
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

export default Spaces;
