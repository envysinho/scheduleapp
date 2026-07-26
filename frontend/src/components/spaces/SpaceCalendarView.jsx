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
  BLOCK_STYLES,
  DEFAULT_BLOCK_STYLE,
  buildHourMarks,
  getBlockPosition,
  getDayBounds,
  parseTimeToMinutes,
} from "@/lib/scheduleTime";
import {
  WEEKDAYS,
  getCycleLabel,
  getSubShiftLabel,
  getTeacherShiftLabel,
  getWeekdayLabel,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

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

function buildCalendarData(space, scheduleSlots) {
  const slotsByDay = Object.fromEntries(WEEKDAYS.map((day) => [day.value, []]));
  const warnings = [];
  const normalizedSlots = (scheduleSlots ?? [])
    .map((slot) => ({
      ...slot,
      startTime: normalizeTime(slot.startTime),
      endTime: normalizeTime(slot.endTime),
    }))
    .filter((slot) => slot.weekday && slot.startTime && slot.endTime);

  const spaceSlots = normalizedSlots.filter((slot) => slot.spaceId === space?.id);

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
      diagnostic:
        uniqueOtherSpaces.length > 0
          ? `Tiene bloque en Horarios, pero quedó asignado a ${uniqueOtherSpaces.join(", ")}.`
          : "No tiene bloque generado en Horarios para esta combinación.",
    });
  }

  return { slotsByDay, unscheduledAssignments, warnings };
}

function getSlotColorClass(slot) {
  if (slot.shift === "MANANA") {
    return "border-sky-600 bg-sky-600 text-white";
  }
  if (slot.shift === "TARDE") {
    return "border-indigo-600 bg-indigo-600 text-white";
  }
  if (slot.shift === "NOCHE") {
    return "border-violet-600 bg-violet-600 text-white";
  }
  return "border-emerald-600 bg-emerald-600 text-white";
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

function positionForTime(time, bounds) {
  const minutes = parseTimeToMinutes(time);
  if (minutes == null) {
    return 0;
  }
  const span = Math.max(bounds.end - bounds.start, 1);
  return ((minutes - bounds.start) / span) * 100;
}

function layoutOverlappingSlots(slots) {
  const sorted = [...slots].sort((left, right) => {
    const startDiff =
      parseTimeToMinutes(left.startTime) - parseTimeToMinutes(right.startTime);
    if (startDiff !== 0) {
      return startDiff;
    }
    return parseTimeToMinutes(left.endTime) - parseTimeToMinutes(right.endTime);
  });

  const active = [];
  const layout = [];
  let clusterMaxColumns = 1;
  let clusterIndices = [];

  const finalizeCluster = () => {
    for (const index of clusterIndices) {
      layout[index].columns = clusterMaxColumns;
    }
    clusterIndices = [];
    clusterMaxColumns = 1;
  };

  for (const slot of sorted) {
    const start = parseTimeToMinutes(slot.startTime);
    const end = parseTimeToMinutes(slot.endTime);

    for (let index = active.length - 1; index >= 0; index -= 1) {
      if (active[index].end <= start) {
        active.splice(index, 1);
      }
    }

    if (active.length === 0 && clusterIndices.length > 0) {
      finalizeCluster();
    }

    let column = 0;
    while (active.some((item) => item.column === column)) {
      column += 1;
    }

    active.push({ end, column });
    clusterMaxColumns = Math.max(clusterMaxColumns, active.length);
    clusterIndices.push(layout.length);
    layout.push({ slot, column, columns: 1 });
  }

  if (clusterIndices.length > 0) {
    finalizeCluster();
  }

  return layout;
}

function SpaceCalendarView({ spaces, scheduleSlots, blocks, isLoading }) {
  const spaceAnchor = useComboboxAnchor();
  const [selectedSpaceId, setSelectedSpaceId] = useState(null);

  useEffect(() => {
    if (!spaces.length) {
      setSelectedSpaceId(null);
      return;
    }

    if (!spaces.some((space) => space.id === selectedSpaceId)) {
      setSelectedSpaceId(spaces[0].id);
    }
  }, [spaces, selectedSpaceId]);

  const selectedSpace =
    spaces.find((space) => space.id === selectedSpaceId) ?? spaces[0] ?? null;

  const { slotsByDay, unscheduledAssignments, warnings } = useMemo(
    () => buildCalendarData(selectedSpace, scheduleSlots),
    [selectedSpace, scheduleSlots]
  );

  const bounds = useMemo(() => getDayBounds(blocks), [blocks]);
  const hourMarks = useMemo(() => buildHourMarks(bounds.start, bounds.end), [bounds]);
  const scheduledCount = useMemo(
    () => Object.values(slotsByDay).reduce((total, items) => total + items.length, 0),
    [slotsByDay]
  );

  if (!spaces.length && !isLoading) {
    return (
      <p className="text-sm text-muted-foreground">
        No hay ambientes para mostrar en la vista calendario.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border bg-muted/20 p-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-[220px] flex-1">
          <Label htmlFor="space-calendar-select">Ambiente</Label>
          <div ref={spaceAnchor} className="mt-2 w-full max-w-md">
            <Combobox
              items={spaces.map((space) => space.name)}
              value={selectedSpace?.name ?? ""}
              onValueChange={(label) => {
                const nextSpace = spaces.find((space) => space.name === label);
                setSelectedSpaceId(nextSpace?.id ?? null);
              }}
              disabled={isLoading || spaces.length === 0}
            >
              <ComboboxInput
                id="space-calendar-select"
                placeholder="Seleccionar ambiente"
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

        <div className="flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="gap-1">
            <CalendarClock className="size-3.5" />
            {scheduledCount} bloques sincronizados
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Clock3 className="size-3.5" />
            {unscheduledAssignments.length} sin horario
          </Badge>
          {warnings.length > 0 && (
            <Badge variant="outline" className="gap-1 border-amber-400 text-amber-700">
              <TriangleAlert className="size-3.5" />
              {warnings.length} cruces
            </Badge>
          )}
        </div>
      </div>

      {selectedSpace && (
        <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" />
            {selectedSpace.name}
          </span>
          <span>{selectedSpace.spaceType}</span>
        </div>
      )}

      {selectedSpace && unscheduledAssignments.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <h3 className="font-semibold">
            {unscheduledAssignments.length === 1
              ? "Hay 1 asignación del ambiente que no entró al calendario"
              : `Hay ${unscheduledAssignments.length} asignaciones del ambiente que no entraron al calendario`}
          </h3>
          <div className="mt-2 space-y-2">
            {unscheduledAssignments.slice(0, 3).map((assignment) => (
              <div
                key={assignment.id ?? `${assignment.courseName}-${assignment.shift ?? "sin-turno"}`}
                className="rounded-xl bg-white/60 px-3 py-2"
              >
                <p className="font-medium">{assignment.courseName}</p>
                <p className="text-xs">
                  {formatAssignmentMeta(assignment) || "Sin turno definido"}
                </p>
                <p className="mt-1 text-xs">{assignment.diagnostic}</p>
              </div>
            ))}
            {unscheduledAssignments.length > 3 && (
              <p className="text-xs">
                Revisa la sección "Asignaciones sin horario en Horarios" para ver el resto.
              </p>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[3.5rem_repeat(5,minmax(0,1fr))]">
        <div className="hidden xl:flex xl:w-14 xl:flex-col xl:gap-3">
          <div className="text-center text-xs font-medium text-muted-foreground opacity-0 select-none">
            Hora
          </div>
          <div className="relative min-h-[560px] py-3">
            {hourMarks.map((mark) => (
              <span
                key={`${mark.label}-${mark.top}`}
                className="absolute right-0 w-full -translate-y-1/2 pr-2 text-right font-mono text-[10px] tabular-nums leading-none text-muted-foreground/80"
                style={{ top: `${mark.top}%` }}
              >
                {mark.label}
              </span>
            ))}
          </div>
        </div>

        {WEEKDAYS.map((day) => (
          <section key={day.value} className="flex min-w-0 flex-col gap-2 rounded-2xl">
            <div className="px-1 text-center text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              {day.label}
            </div>
            <div className="relative min-h-[440px] rounded-2xl border border-border/70 bg-gradient-to-b from-background to-muted/20 py-3 pl-10 shadow-sm xl:min-h-[560px] xl:pl-0">
              {hourMarks.map((mark) => (
                <div key={`${day.value}-${mark.label}-${mark.top}`}>
                  <span
                    className="absolute left-1 w-8 -translate-y-1/2 text-left font-mono text-[9px] tabular-nums leading-none text-muted-foreground/80 xl:hidden"
                    style={{ top: `${mark.top}%` }}
                  >
                    {mark.label}
                  </span>
                  <div
                    className="absolute left-9 right-2 border-t border-border/40 xl:left-2"
                    style={{ top: `${mark.top}%` }}
                  />
                </div>
              ))}

              <div className="absolute inset-y-3 left-9 right-2 xl:left-2">
                {blocks.map((block) => {
                  const position = getBlockPosition(block, bounds.start, bounds.end);
                  return (
                    <div
                      key={`${day.value}-${block.id}`}
                      className={cn(
                        "absolute inset-x-0 rounded-xl border px-1.5 text-center text-[10px] font-medium leading-tight opacity-35",
                        BLOCK_STYLES[block.id] ?? DEFAULT_BLOCK_STYLE
                      )}
                      style={{
                        top: `${position.top}%`,
                        height: `${Math.max(position.height, 4)}%`,
                      }}
                    >
                      {block.label}
                    </div>
                  );
                })}

                {layoutOverlappingSlots(slotsByDay[day.value] ?? []).map(
                  ({ slot, column, columns }, index) => {
                    const top = positionForTime(slot.startTime, bounds);
                    const bottom = positionForTime(slot.endTime, bounds);
                    const totalGapPx = Math.max(columns - 1, 0) * 8;
                    const columnWidth = `calc((100% - ${totalGapPx}px) / ${columns})`;
                    const columnLeft = `calc(${column} * (${columnWidth} + 8px))`;

                    return (
                      <article
                        key={slot.id ?? `${slot.weekday}-${slot.startTime}-${slot.courseName}-${index}`}
                        className={cn(
                          "absolute z-10 overflow-hidden rounded-xl border px-2.5 py-2 text-[11px] leading-tight shadow-md",
                          getSlotColorClass(slot)
                        )}
                        style={{
                          top: `${top}%`,
                          height: `${Math.max(bottom - top, 5)}%`,
                          left: columnLeft,
                          width: columnWidth,
                        }}
                      >
                        <div className="font-semibold">
                          {slot.startTime} - {slot.endTime}
                        </div>
                        <div className="truncate font-medium opacity-95">
                          {slot.courseName}
                        </div>
                        <div className="mt-0.5 truncate text-[10px] opacity-90">
                          {formatAssignmentMeta(slot)}
                        </div>
                        {slot.teacherName && (
                          <div className="truncate text-[10px] opacity-80">
                            {slot.teacherName}
                          </div>
                        )}
                      </article>
                    );
                  }
                )}
              </div>
            </div>
          </section>
        ))}
      </div>

      {unscheduledAssignments.length > 0 && (
        <section className="rounded-2xl border p-4">
          <div className="mb-3">
            <h3 className="text-sm font-semibold">Asignaciones sin horario en Horarios</h3>
            <p className="text-xs text-muted-foreground">
              Estos cursos siguen ligados al ambiente, pero todavía no aparecen ubicados en la vista de horarios.
            </p>
          </div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {unscheduledAssignments.map((assignment) => (
              <article
                key={assignment.id ?? `${assignment.courseName}-${assignment.shift ?? "sin-turno"}`}
                className="rounded-xl bg-muted/40 p-3 text-sm"
              >
                <p className="font-medium">{assignment.courseName}</p>
                <p className="text-xs text-muted-foreground">
                  {formatAssignmentMeta(assignment) || "Sin turno definido"}
                </p>
                <p className="mt-1 text-xs text-amber-700">
                  {assignment.diagnostic}
                </p>
              </article>
            ))}
          </div>
        </section>
      )}

      {selectedSpace && (
        <Collapsible className="rounded-2xl border">
          <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold">
            <span>Diagnóstico de sincronización</span>
            <ChevronDown className="size-4 transition-transform data-[popup-open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-3 border-t px-4 py-3 text-sm">
              <div>
                <p className="font-medium">Ambiente seleccionado</p>
                <p className="text-muted-foreground">{selectedSpace.name}</p>
              </div>
              <div>
                <p className="font-medium">Asignaciones del ambiente</p>
                {selectedSpace.assignments?.length ? (
                  <div className="mt-2 space-y-1">
                    {selectedSpace.assignments.map((assignment) => (
                      <p key={assignment.id ?? `${assignment.courseName}-${assignment.shift ?? ""}`}>
                        {assignment.courseName} · {formatAssignmentMeta(assignment) || "Sin turno"}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-muted-foreground">Sin asignaciones.</p>
                )}
              </div>
              <div>
                <p className="font-medium">Bloques detectados en Horarios para este ambiente</p>
                {scheduledCount > 0 ? (
                  <div className="mt-2 space-y-1">
                    {Object.values(slotsByDay)
                      .flat()
                      .sort((left, right) => {
                        const dayDiff = WEEKDAYS.findIndex((day) => day.value === left.weekday)
                          - WEEKDAYS.findIndex((day) => day.value === right.weekday);
                        if (dayDiff !== 0) {
                          return dayDiff;
                        }
                        return parseTimeToMinutes(left.startTime) - parseTimeToMinutes(right.startTime);
                      })
                      .map((slot) => (
                        <p key={slot.id ?? `${slot.courseName}-${slot.weekday}-${slot.startTime}`}>
                          {getWeekdayLabel(slot.weekday, true)} {slot.startTime}-{slot.endTime} · {slot.courseName} · {formatAssignmentMeta(slot)}
                        </p>
                      ))}
                  </div>
                ) : (
                  <p className="mt-1 text-muted-foreground">No hay bloques sincronizados.</p>
                )}
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {warnings.length > 0 && (
        <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <h3 className="font-semibold">Cruces detectados</h3>
          <div className="mt-2 space-y-1">
            {warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default SpaceCalendarView;
