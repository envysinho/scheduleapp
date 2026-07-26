import { useEffect, useMemo, useState } from "react";
import { CalendarClock, ChevronDown, Clock3, MapPin, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { Label } from "@/components/ui/label";
import {
  buildHourMarks,
  formatMinutesToTime,
  getDayBounds,
  parseTimeToMinutes,
} from "@/lib/scheduleTime";
import {
  WEEKDAYS,
  getCycleLabel,
  getSpaceTypeLabel,
  getSubShiftLabel,
  getTeacherShiftLabel,
  getWeekdayLabel,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const JS_DAY_TO_WEEKDAY = {
  1: "MONDAY",
  2: "TUESDAY",
  3: "WEDNESDAY",
  4: "THURSDAY",
  5: "FRIDAY",
};

function normalizeTime(value) {
  if (!value) {
    return null;
  }
  return value.slice(0, 5);
}

function buildSlotKey(slot) {
  return [
    slot.courseName?.trim().toLowerCase() ?? "",
    slot.cycle ?? "",
    slot.shift ?? "",
    slot.subShift ?? "",
  ].join("|");
}

function buildAssignmentKey(assignment) {
  return [
    assignment.courseName?.trim().toLowerCase() ?? "",
    assignment.cycle ?? "",
    assignment.shift ?? "",
    assignment.subShift ?? "",
  ].join("|");
}

function formatAssignmentMeta(assignment) {
  return [
    assignment.cycle != null ? getCycleLabel(assignment.cycle) : null,
    assignment.shift ? getTeacherShiftLabel(assignment.shift) : null,
    assignment.subShift ? getSubShiftLabel(assignment.subShift) : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

function getAllSpacesLabel(spaceType) {
  if (spaceType === "AULA") {
    return "Todas las aulas";
  }
  if (spaceType === "LABORATORIO") {
    return "Todos los laboratorios";
  }
  return "Todos";
}

function formatDuration(totalMinutes) {
  if (totalMinutes <= 0) {
    return "0 min";
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours > 0 && minutes > 0) {
    return `${hours} h ${minutes} min`;
  }
  if (hours > 0) {
    return `${hours} h`;
  }
  return `${minutes} min`;
}

function getCurrentWeekdayValue(date) {
  return JS_DAY_TO_WEEKDAY[date.getDay()] ?? null;
}

function getInitialSelectedDay() {
  const today = getCurrentWeekdayValue(new Date());
  return today ?? WEEKDAYS[0].value;
}

function buildCalendarData(selectedSpaces, scheduleSlots) {
  const spaces = selectedSpaces ?? [];
  const selectedSpaceIds = new Set(spaces.map((space) => space.id));
  const slotsByDay = Object.fromEntries(WEEKDAYS.map((day) => [day.value, []]));
  const warnings = [];
  const normalizedSlots = (scheduleSlots ?? [])
    .map((slot) => ({
      ...slot,
      startTime: normalizeTime(slot.startTime),
      endTime: normalizeTime(slot.endTime),
    }))
    .filter((slot) => slot.weekday && slot.startTime && slot.endTime);

  const spaceSlots = normalizedSlots.filter((slot) => selectedSpaceIds.has(slot.spaceId));

  for (const slot of spaceSlots) {
    slotsByDay[slot.weekday]?.push(slot);
  }

  for (const day of WEEKDAYS) {
    const daySlots = (slotsByDay[day.value] ?? []).sort((left, right) => {
      const startDiff =
        parseTimeToMinutes(left.startTime) - parseTimeToMinutes(right.startTime);
      if (startDiff !== 0) {
        return startDiff;
      }
      return (left.courseName ?? "").localeCompare(right.courseName ?? "");
    });

    for (let index = 0; index < daySlots.length - 1; index += 1) {
      const current = daySlots[index];
      const next = daySlots[index + 1];
      const currentEnd = parseTimeToMinutes(current.endTime);
      const nextStart = parseTimeToMinutes(next.startTime);

      if (currentEnd != null && nextStart != null && currentEnd > nextStart) {
        warnings.push(
          `${getWeekdayLabel(day.value, true)}: ${current.courseName} se cruza con ${next.courseName}.`
        );
      }
    }
  }

  const slotCounts = new Map();
  for (const slot of spaceSlots) {
    const key = buildSlotKey(slot);
    slotCounts.set(key, (slotCounts.get(key) ?? 0) + 1);
  }

  const slotsByKey = new Map();
  for (const slot of normalizedSlots) {
    const key = buildSlotKey(slot);
    const items = slotsByKey.get(key) ?? [];
    items.push(slot);
    slotsByKey.set(key, items);
  }

  const unscheduledAssignments = [];
  for (const space of spaces) {
    for (const assignment of space?.assignments ?? []) {
      const key = buildAssignmentKey(assignment);
      const currentCount = slotCounts.get(key) ?? 0;

      if (currentCount > 0) {
        slotCounts.set(key, currentCount - 1);
        continue;
      }

      const matchingSlots = slotsByKey.get(key) ?? [];
      const otherSpaces = matchingSlots
        .filter((slot) => slot.spaceId !== space?.id)
        .map((slot) => slot.spaceName)
        .filter(Boolean);
      const uniqueOtherSpaces = [...new Set(otherSpaces)];

      unscheduledAssignments.push({
        ...assignment,
        sourceSpaceName: space.name,
        diagnostic:
          uniqueOtherSpaces.length > 0
            ? `Tiene bloque en Horarios, pero quedó asignado a ${uniqueOtherSpaces.join(", ")}.`
            : "No tiene bloque generado en Horarios para esta combinación.",
      });
    }
  }

  return { slotsByDay, spaceSlots, unscheduledAssignments, warnings };
}

function buildMergedSegments(slots) {
  const ordered = [...slots]
    .map((slot) => ({
      ...slot,
      startMinutes: parseTimeToMinutes(slot.startTime),
      endMinutes: parseTimeToMinutes(slot.endTime),
    }))
    .filter((slot) => slot.startMinutes != null && slot.endMinutes != null)
    .sort((left, right) => left.startMinutes - right.startMinutes);

  const segments = [];
  for (const slot of ordered) {
    const last = segments[segments.length - 1];
    if (!last || slot.startMinutes > last.endMinutes) {
      segments.push({
        startMinutes: slot.startMinutes,
        endMinutes: slot.endMinutes,
        slots: [slot],
      });
      continue;
    }

    last.endMinutes = Math.max(last.endMinutes, slot.endMinutes);
    last.slots.push(slot);
  }

  return segments;
}

function getStatusTone(status) {
  if (status === "MANTENIMIENTO") {
    return "border-red-300 bg-red-50 text-red-800";
  }
  if (status === "OCUPADO") {
    return "border-amber-300 bg-amber-50 text-amber-800";
  }
  return "border-emerald-300 bg-emerald-50 text-emerald-800";
}

function getTimelineSegmentClass(status) {
  if (status === "MANTENIMIENTO") {
    return "border-red-400 bg-red-500/80 text-white";
  }
  if (status === "OCUPADO") {
    return "border-amber-400 bg-amber-500/90 text-white";
  }
  return "border-emerald-300 bg-emerald-100 text-emerald-900";
}

function getSpaceCurrentState(space, slots, nowWeekday, nowMinutes) {
  if (space.availability === "EN_MANTENIMIENTO") {
    return {
      status: "MANTENIMIENTO",
      label: "Mantenimiento",
      detail: "No disponible",
      activeSlot: null,
    };
  }

  if (nowWeekday == null || nowMinutes == null) {
    return {
      status: "LIBRE",
      label: "Libre ahora",
      detail: "Sin monitoreo horario hoy",
      activeSlot: null,
    };
  }

  const activeSlot = slots.find((slot) => {
    if (slot.weekday !== nowWeekday) {
      return false;
    }
    const start = parseTimeToMinutes(slot.startTime);
    const end = parseTimeToMinutes(slot.endTime);
    return start != null && end != null && nowMinutes >= start && nowMinutes < end;
  }) ?? null;

  if (activeSlot) {
    return {
      status: "OCUPADO",
      label: "Ocupado ahora",
      detail: `${activeSlot.startTime} - ${activeSlot.endTime}`,
      activeSlot,
    };
  }

  return {
    status: "LIBRE",
    label: "Libre ahora",
    detail: "Disponible",
    activeSlot: null,
  };
}

function getNextChangeLabel(space, slots, nowWeekday, nowMinutes) {
  if (space.availability === "EN_MANTENIMIENTO") {
    return "En mantenimiento";
  }

  if (nowWeekday == null || nowMinutes == null) {
    return "Sin cambios programados hoy";
  }

  const daySlots = slots
    .filter((slot) => slot.weekday === nowWeekday)
    .sort((left, right) => parseTimeToMinutes(left.startTime) - parseTimeToMinutes(right.startTime));

  const activeSlot = daySlots.find((slot) => {
    const start = parseTimeToMinutes(slot.startTime);
    const end = parseTimeToMinutes(slot.endTime);
    return start != null && end != null && nowMinutes >= start && nowMinutes < end;
  });

  if (activeSlot) {
    return `Se libera a las ${activeSlot.endTime}`;
  }

  const upcomingSlot = daySlots.find((slot) => {
    const start = parseTimeToMinutes(slot.startTime);
    return start != null && start > nowMinutes;
  });

  if (upcomingSlot) {
    return `Se ocupa a las ${upcomingSlot.startTime}`;
  }

  return "Sin más cambios hoy";
}

function getTimelinePosition(minutes, bounds) {
  const span = Math.max(bounds.end - bounds.start, 1);
  return ((minutes - bounds.start) / span) * 100;
}

function buildTimelineSegments(space, daySlots, bounds) {
  if (space.availability === "EN_MANTENIMIENTO") {
    return [
      {
        status: "MANTENIMIENTO",
        label: "Mantenimiento",
        left: 0,
        width: 100,
        slots: [],
      },
    ];
  }

  const occupiedSegments = buildMergedSegments(daySlots);
  const segments = [];
  let cursor = bounds.start;

  for (const segment of occupiedSegments) {
    const start = Math.max(segment.startMinutes, bounds.start);
    const end = Math.min(segment.endMinutes, bounds.end);

    if (start > cursor) {
      segments.push({
        status: "LIBRE",
        label: "Libre",
        left: getTimelinePosition(cursor, bounds),
        width: getTimelinePosition(start, bounds) - getTimelinePosition(cursor, bounds),
        slots: [],
      });
    }

    segments.push({
      status: "OCUPADO",
      label: "Ocupado",
      left: getTimelinePosition(start, bounds),
      width: getTimelinePosition(end, bounds) - getTimelinePosition(start, bounds),
      slots: segment.slots,
    });

    cursor = Math.max(cursor, end);
  }

  if (cursor < bounds.end) {
    segments.push({
      status: "LIBRE",
      label: "Libre",
      left: getTimelinePosition(cursor, bounds),
      width: getTimelinePosition(bounds.end, bounds) - getTimelinePosition(cursor, bounds),
      slots: [],
    });
  }

  return segments.filter((segment) => segment.width > 0);
}

function buildSpaceRows(spaces, spaceSlots, selectedDay, bounds, nowWeekday, nowMinutes) {
  return spaces.map((space) => {
    const slots = spaceSlots.filter((slot) => slot.spaceId === space.id);
    const daySlots = slots.filter((slot) => slot.weekday === selectedDay);
    const occupiedMinutes = buildMergedSegments(daySlots).reduce(
      (total, segment) => total + (segment.endMinutes - segment.startMinutes),
      0
    );
    const timelineSegments = buildTimelineSegments(space, daySlots, bounds);
    const currentState = getSpaceCurrentState(space, slots, nowWeekday, nowMinutes);

    return {
      space,
      slots,
      daySlots,
      occupiedMinutes,
      timelineSegments,
      currentState,
      nextChangeLabel: getNextChangeLabel(space, slots, nowWeekday, nowMinutes),
    };
  });
}

function SpaceCalendarView({ spaces, scheduleSlots, blocks, isLoading }) {
  const spaceTypeAnchor = useComboboxAnchor();
  const spaceAnchor = useComboboxAnchor();
  const [selectedSpaceType, setSelectedSpaceType] = useState(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);
  const [selectedDay, setSelectedDay] = useState(getInitialSelectedDay);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => window.clearInterval(intervalId);
  }, []);

  const availableSpaceTypes = useMemo(
    () => [...new Set(spaces.map((space) => space.spaceType).filter(Boolean))],
    [spaces]
  );

  const spacesBySelectedType = useMemo(
    () => spaces.filter((space) => space.spaceType === selectedSpaceType),
    [spaces, selectedSpaceType]
  );

  useEffect(() => {
    if (!spaces.length) {
      setSelectedSpaceType(null);
      setSelectedSpaceId(null);
      return;
    }

    if (!availableSpaceTypes.includes(selectedSpaceType)) {
      setSelectedSpaceType(availableSpaceTypes[0] ?? null);
    }
  }, [availableSpaceTypes, selectedSpaceType, spaces]);

  useEffect(() => {
    if (!spacesBySelectedType.length) {
      setSelectedSpaceId(null);
      return;
    }

    if (
      selectedSpaceId != null
      && !spacesBySelectedType.some((space) => space.id === selectedSpaceId)
    ) {
      setSelectedSpaceId(null);
    }
  }, [selectedSpaceId, spacesBySelectedType]);

  const selectedSpace =
    spacesBySelectedType.find((space) => space.id === selectedSpaceId) ?? null;
  const selectedSpaces = selectedSpace != null ? [selectedSpace] : spacesBySelectedType;

  const { spaceSlots, unscheduledAssignments, warnings } = useMemo(
    () => buildCalendarData(selectedSpaces, scheduleSlots),
    [scheduleSlots, selectedSpaces]
  );

  const bounds = useMemo(() => getDayBounds(blocks), [blocks]);
  const hourMarks = useMemo(() => buildHourMarks(bounds.start, bounds.end, 60), [bounds]);
  const selectedSpaceTypeLabel = selectedSpaceType ? getSpaceTypeLabel(selectedSpaceType) : null;
  const allSpacesLabel = getAllSpacesLabel(selectedSpaceType);
  const nowMinutes = useMemo(
    () => parseTimeToMinutes(`${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`),
    [now]
  );
  const nowWeekday = useMemo(() => getCurrentWeekdayValue(now), [now]);
  const nowLabel = useMemo(
    () => formatMinutesToTime(now.getHours() * 60 + now.getMinutes()),
    [now]
  );
  const nowLineTop = nowMinutes == null ? null : getTimelinePosition(nowMinutes, bounds);

  const spaceRows = useMemo(
    () => buildSpaceRows(selectedSpaces, spaceSlots, selectedDay, bounds, nowWeekday, nowMinutes),
    [selectedSpaces, spaceSlots, selectedDay, bounds, nowWeekday, nowMinutes]
  );

  const occupiedNowCount = spaceRows.filter((row) => row.currentState.status === "OCUPADO").length;
  const maintenanceCount = spaceRows.filter(
    (row) => row.currentState.status === "MANTENIMIENTO"
  ).length;
  const freeNowCount = spaceRows.filter((row) => row.currentState.status === "LIBRE").length;
  const selectedDayLabel = getWeekdayLabel(selectedDay, true);
  const selectedRow = selectedSpace
    ? spaceRows.find((row) => row.space.id === selectedSpace.id) ?? null
    : null;

  if (!spaces.length && !isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay ambientes para mostrar en la vista de disponibilidad.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,16rem)_minmax(0,18rem)_1fr]">
          <div className="min-w-[220px]">
            <Label htmlFor="space-calendar-type-select">Tipo</Label>
            <div ref={spaceTypeAnchor} className="mt-2 w-full">
              <Combobox
                items={availableSpaceTypes.map((type) => getSpaceTypeLabel(type))}
                value={selectedSpaceTypeLabel ?? ""}
                onValueChange={(label) => {
                  const nextType = availableSpaceTypes.find(
                    (type) => getSpaceTypeLabel(type) === label
                  );
                  setSelectedSpaceType(nextType ?? null);
                  setSelectedSpaceId(null);
                }}
                disabled={isLoading || availableSpaceTypes.length === 0}
              >
                <ComboboxInput
                  id="space-calendar-type-select"
                  placeholder="Seleccionar tipo"
                  readOnly
                />
                <ComboboxContent anchor={spaceTypeAnchor}>
                  <ComboboxEmpty>Sin tipos.</ComboboxEmpty>
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

          <div className="min-w-[220px]">
            <Label htmlFor="space-calendar-select">Ambiente</Label>
            <div ref={spaceAnchor} className="mt-2 w-full">
              <Combobox
                items={[allSpacesLabel, ...spacesBySelectedType.map((space) => space.name)]}
                value={selectedSpace?.name ?? allSpacesLabel}
                onValueChange={(label) => {
                  const nextSpace = spacesBySelectedType.find((space) => space.name === label);
                  setSelectedSpaceId(nextSpace?.id ?? null);
                }}
                disabled={isLoading || spacesBySelectedType.length === 0}
              >
                <ComboboxInput
                  id="space-calendar-select"
                  placeholder="Todos"
                  readOnly
                />
                <ComboboxContent anchor={spaceAnchor}>
                  <ComboboxEmpty>Sin ambientes.</ComboboxEmpty>
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

          <div>
            <Label>Día</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <button
                  key={day.value}
                  type="button"
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-sm transition-colors",
                    selectedDay === day.value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  )}
                  onClick={() => setSelectedDay(day.value)}
                >
                  {day.longLabel}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="gap-1">
            <Clock3 className="size-3.5" />
            Ahora: {nowLabel}
          </Badge>
          <Badge variant="outline" className="gap-1">
            <MapPin className="size-3.5" />
            {freeNowCount} libres
          </Badge>
          <Badge variant="outline" className="gap-1">
            <CalendarClock className="size-3.5" />
            {occupiedNowCount} ocupados
          </Badge>
          <Badge variant="outline" className="gap-1">
            <TriangleAlert className="size-3.5" />
            {maintenanceCount} en mantenimiento
          </Badge>
          {warnings.length > 0 && (
            <Badge variant="outline" className="gap-1 border-amber-400 text-amber-700">
              {warnings.length} cruces detectados
            </Badge>
          )}
        </div>
      </div>

      {selectedRow && (
        <section className="grid gap-3 lg:grid-cols-[minmax(0,18rem)_1fr]">
          <article className="rounded-2xl border bg-background p-4">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">
              Estado actual
            </p>
            <h3 className="mt-1 text-lg font-semibold">{selectedRow.space.name}</h3>
            <Badge className={cn("mt-3 border", getStatusTone(selectedRow.currentState.status))}>
              {selectedRow.currentState.label}
            </Badge>
            <p className="mt-3 text-sm text-muted-foreground">{selectedRow.nextChangeLabel}</p>
            <div className="mt-4 grid gap-2 text-sm">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Tiempo ocupado en {selectedDayLabel}</p>
                <p className="font-semibold">{formatDuration(selectedRow.occupiedMinutes)}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs text-muted-foreground">Estado en este momento</p>
                <p className="font-semibold">{selectedRow.currentState.detail}</p>
              </div>
            </div>
          </article>

          {selectedRow.currentState.activeSlot && (
            <article className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="text-xs font-medium uppercase tracking-[0.12em]">Detalle del bloqueo actual</p>
              <p className="mt-2 text-base font-semibold">
                {selectedRow.currentState.activeSlot.courseName}
              </p>
              <p className="mt-1">
                {selectedRow.currentState.activeSlot.startTime}
                {" - "}
                {selectedRow.currentState.activeSlot.endTime}
              </p>
              <p className="mt-1 text-xs">
                {formatAssignmentMeta(selectedRow.currentState.activeSlot) || "Sin turno definido"}
              </p>
              {selectedRow.currentState.activeSlot.teacherName && (
                <p className="mt-1 text-xs">{selectedRow.currentState.activeSlot.teacherName}</p>
              )}
            </article>
          )}
        </section>
      )}

      {selectedSpaces.length > 0 && (
        <section className="rounded-2xl border bg-background p-4">
          <div className="flex flex-col gap-1 pb-4">
            <h3 className="text-sm font-semibold">Disponibilidad de {selectedDayLabel}</h3>
            <p className="text-xs text-muted-foreground">
              Verde = libre, ámbar = ocupado, rojo = mantenimiento.
            </p>
          </div>

          <div className="hidden border-b pb-3 md:block">
            <div className="grid grid-cols-[minmax(0,14rem)_1fr] gap-4">
              <div />
              <div className="relative h-6">
                {hourMarks.map((mark) => (
                  <span
                    key={mark.label}
                    className="absolute -translate-x-1/2 text-[10px] text-muted-foreground"
                    style={{ left: `${mark.top}%` }}
                  >
                    {mark.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-4">
            {spaceRows.map((row) => (
              <article
                key={row.space.id}
                className="grid gap-3 rounded-2xl border bg-muted/10 p-3 md:grid-cols-[minmax(0,14rem)_1fr]"
              >
                <div className="min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{row.space.name}</p>
                      <p className="text-xs text-muted-foreground">{row.nextChangeLabel}</p>
                    </div>
                    <Badge className={cn("shrink-0 border", getStatusTone(row.currentState.status))}>
                      {row.currentState.status === "LIBRE"
                        ? "Libre"
                        : row.currentState.status === "OCUPADO"
                          ? "Ocupado"
                          : "Mantenimiento"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="relative h-16 overflow-hidden rounded-2xl border bg-emerald-50">
                    {hourMarks.map((mark) => (
                      <div
                        key={`${row.space.id}-${mark.label}`}
                        className="absolute inset-y-0 border-l border-foreground/8"
                        style={{ left: `${mark.top}%` }}
                      />
                    ))}

                    {row.timelineSegments.map((segment, index) => (
                      <div
                        key={`${row.space.id}-${segment.status}-${index}`}
                        className={cn(
                          "absolute inset-y-0 flex items-center justify-center overflow-hidden border text-[11px] font-medium",
                          getTimelineSegmentClass(segment.status)
                        )}
                        style={{
                          left: `${segment.left}%`,
                          width: `${segment.width}%`,
                        }}
                        title={
                          segment.status === "OCUPADO" && segment.slots[0]
                            ? `${segment.slots[0].startTime} - ${segment.slots[segment.slots.length - 1].endTime}`
                            : segment.label
                        }
                      >
                        {segment.width >= 12 && (
                          <span className="truncate px-2">{segment.label}</span>
                        )}
                      </div>
                    ))}

                    {selectedDay === nowWeekday
                      && nowLineTop != null
                      && nowLineTop >= 0
                      && nowLineTop <= 100 && (
                        <>
                          <div
                            className="absolute inset-y-0 z-20 w-0.5 bg-foreground"
                            style={{ left: `${nowLineTop}%` }}
                          />
                          <div
                            className="absolute top-1 z-20 -translate-x-1/2 rounded-full bg-foreground px-1.5 py-0.5 text-[10px] text-background"
                            style={{ left: `${nowLineTop}%` }}
                          >
                            Ahora
                          </div>
                        </>
                      )}
                  </div>

                  {row.currentState.activeSlot ? (
                    <p className="text-xs text-muted-foreground">
                      Ocupado por {row.currentState.activeSlot.courseName}
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Libre en este momento
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {unscheduledAssignments.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <h3 className="font-semibold">Asignaciones sin horario</h3>
          <p className="mt-1 text-xs">
            Estas asignaciones no afectan la vista de disponibilidad porque todavía no tienen bloque real en Horarios.
          </p>
          <div className="mt-3 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {unscheduledAssignments.map((assignment) => (
              <article
                key={assignment.id ?? `${assignment.courseName}-${assignment.shift ?? "sin-turno"}`}
                className="rounded-xl bg-white/60 p-3"
              >
                <p className="font-medium">{assignment.courseName}</p>
                <p className="text-xs">{formatAssignmentMeta(assignment) || "Sin turno definido"}</p>
                {assignment.sourceSpaceName && (
                  <p className="mt-1 text-xs font-medium">{assignment.sourceSpaceName}</p>
                )}
                <p className="mt-1 text-xs">{assignment.diagnostic}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      {selectedRow && (
        <Collapsible className="rounded-2xl border">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold">
            <span>Detalle del ambiente</span>
            <ChevronDown className="size-4 transition-transform data-[popup-open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3 border-t px-4 py-3 text-sm">
              <div>
                <p className="font-medium">Ambiente</p>
                <p className="text-muted-foreground">{selectedRow.space.name}</p>
              </div>
              <div>
                <p className="font-medium">Bloques ocupados en {selectedDayLabel}</p>
                {selectedRow.daySlots.length > 0 ? (
                  <div className="mt-2 space-y-1">
                    {selectedRow.daySlots.map((slot) => (
                      <p key={slot.id ?? `${slot.courseName}-${slot.startTime}`}>
                        {slot.startTime}-{slot.endTime} · {slot.courseName}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-muted-foreground">No tiene bloques ocupados.</p>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

export default SpaceCalendarView;
