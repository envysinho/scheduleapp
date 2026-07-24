import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import PageCard from "@/components/PageCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { useAuth } from "@/contexts/AuthContext";
import { useSemester } from "@/contexts/SemesterContext";
import {
  CYCLES,
  WEEKDAYS,
  getSubShiftLabel,
  getTeacherShiftLabel,
  getWeekdayLabel,
} from "@/lib/constants";
import {
  getSchedule,
  getScheduleSettings,
  listCourses,
  updateAssignmentSchedule,
  updateAssignmentWeekday,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  BLOCK_STYLES,
  DEFAULT_BLOCK_STYLE,
  buildHourMarks,
  formatMinutesToTime,
  getBlockPosition,
  getDayBounds,
  parseTimeToMinutes,
  snapMinutes,
} from "@/lib/scheduleTime";

const COURSE_COLOR_STYLES = [
  "bg-sky-600 text-white border-sky-700",
  "bg-emerald-600 text-white border-emerald-700",
  "bg-amber-500 text-slate-950 border-amber-600",
  "bg-rose-600 text-white border-rose-700",
  "bg-indigo-600 text-white border-indigo-700",
  "bg-teal-600 text-white border-teal-700",
  "bg-orange-600 text-white border-orange-700",
  "bg-fuchsia-600 text-white border-fuchsia-700",
  "bg-lime-500 text-slate-950 border-lime-600",
  "bg-cyan-600 text-white border-cyan-700",
];

const DRAG_STEP_MINUTES = 15;

function formatTimeRange(slot) {
  return `${slot.startTime} - ${slot.endTime}`;
}

function slotSubtitle(slot) {
  const shift = getTeacherShiftLabel(slot.shift);
  const subShift = slot.subShift ? ` ${getSubShiftLabel(slot.subShift)}` : "";
  return `${shift}${subShift}`;
}

function getCourseColorStyle(slot) {
  const key = String(slot.courseId ?? slot.courseCode ?? "");
  let hash = 0;
  for (let index = 0; index < key.length; index += 1) {
    hash = (hash * 31 + key.charCodeAt(index)) >>> 0;
  }
  return COURSE_COLOR_STYLES[hash % COURSE_COLOR_STYLES.length];
}

function findSlotByAssignmentId(schedule, assignmentId) {
  return schedule?.slots?.find((slot) => slot.assignmentId === assignmentId) ?? null;
}

function Horarios({ cycle = 1 }) {
  const { logout } = useAuth();
  const { semester } = useSemester();
  const [schedule, setSchedule] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [courses, setCourses] = useState([]);
  const [viewMode, setViewMode] = useState("matrix");
  const [loading, setLoading] = useState(true);
  const [savingAssignmentId, setSavingAssignmentId] = useState(null);
  const [error, setError] = useState(null);
  const cycleLabel =
    CYCLES.find((item) => item.id === cycle)?.label ?? `Ciclo ${cycle}`;

  const loadSchedule = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const settings = await getScheduleSettings({ semester }, logout);
      setBlocks(settings.blocks ?? []);
      const courseData = await listCourses({ semester, cycle }, logout);
      setCourses(courseData);
      const data = await getSchedule({ semester, cycle }, logout);
      setSchedule(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar horario");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [cycle, logout, semester]);

  useEffect(() => {
    loadSchedule();
  }, [loadSchedule]);

  const slotsByDay = useMemo(() => {
    const groups = Object.fromEntries(WEEKDAYS.map((day) => [day.value, []]));
    for (const slot of schedule?.slots ?? []) {
      groups[slot.weekday]?.push(slot);
    }
    return groups;
  }, [schedule]);

  const assignments = useMemo(() => {
    return courses
      .flatMap((course) =>
        (course.teacherAssignments ?? []).map((assignment) => ({
          ...assignment,
          requiredSpaceType: course.requiredSpaceType,
        }))
      )
      .sort((left, right) => {
        const codeDiff = left.courseCode.localeCompare(right.courseCode);
        if (codeDiff !== 0) {
          return codeDiff;
        }
        const shiftDiff = left.shift.localeCompare(right.shift);
        if (shiftDiff !== 0) {
          return shiftDiff;
        }
        return (left.subShift ?? "").localeCompare(right.subShift ?? "");
      });
  }, [courses]);

  const dayConflicts = useMemo(() => findManualDayConflicts(assignments), [assignments]);
  const allWarnings = useMemo(
    () => [...(schedule?.warnings ?? []), ...dayConflicts],
    [schedule?.warnings, dayConflicts]
  );

  const handleAssignmentScheduleChange = async (assignmentId, nextSchedule) => {
    setSavingAssignmentId(assignmentId);
    setError(null);
    const normalizedWeekday = nextSchedule.weekday || null;
    const normalizedStartTime = normalizedWeekday ? nextSchedule.startTime ?? null : null;
    const normalizedEndTime = normalizedWeekday ? nextSchedule.endTime ?? null : null;
    const previousSchedule = schedule;
    const previousCourses = courses;

    setSchedule((current) =>
      current
        ? {
            ...current,
            slots: (current.slots ?? []).map((slot) =>
              slot.assignmentId === assignmentId
                ? {
                    ...slot,
                    weekday: normalizedWeekday,
                    automaticWeekday: normalizedWeekday == null,
                    startTime: normalizedStartTime ?? slot.startTime,
                    endTime: normalizedEndTime ?? slot.endTime,
                  }
                : slot
            ),
          }
        : current
    );
    setCourses((current) =>
      current.map((course) => ({
        ...course,
        teacherAssignments: (course.teacherAssignments ?? []).map((assignment) =>
          assignment.id === assignmentId
            ? {
                ...assignment,
                weekday: normalizedWeekday,
                manualStartTime: normalizedStartTime,
                manualEndTime: normalizedEndTime,
              }
            : assignment
        ),
      }))
    );

    try {
      if (normalizedWeekday && normalizedStartTime && normalizedEndTime) {
        await updateAssignmentSchedule(
          assignmentId,
          {
            weekday: normalizedWeekday,
            startTime: normalizedStartTime,
            endTime: normalizedEndTime,
          },
          logout
        );
      } else {
        await updateAssignmentWeekday(assignmentId, normalizedWeekday, logout);
      }
      await loadSchedule({ silent: true });
    } catch (err) {
      setSchedule(previousSchedule);
      setCourses(previousCourses);
      setError(err instanceof Error ? err.message : "Error al actualizar horario");
    } finally {
      setSavingAssignmentId(null);
    }
  };

  const handleWeekdayChange = async (assignmentId, weekday) => {
    const currentSlot = findSlotByAssignmentId(schedule, assignmentId);
    await handleAssignmentScheduleChange(assignmentId, {
      weekday,
      startTime: weekday ? currentSlot?.startTime ?? null : null,
      endTime: weekday ? currentSlot?.endTime ?? null : null,
    });
  };

  return (
    <PageCard
      title={`Horarios — ${cycleLabel}`}
      description={`Semestre ${semester}`}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {schedule?.generated ? (
              <Badge variant="outline">Con clases</Badge>
            ) : (
              <Badge variant="secondary">Vacío</Badge>
            )}
            {allWarnings.length ? (
              <Badge variant="outline">{allWarnings.length} advertencias</Badge>
            ) : null}
          </div>

          <div className="flex rounded-md border p-0.5">
            <Button
              type="button"
              variant={viewMode === "matrix" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("matrix")}
            >
              Matriz
            </Button>
            <Button
              type="button"
              variant={viewMode === "color" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setViewMode("color")}
            >
              Color
            </Button>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando horario...</p>
        ) : viewMode === "color" ? (
          <ColorScheduleView
            blocks={blocks}
            slotsByDay={slotsByDay}
            savingAssignmentId={savingAssignmentId}
            onUpdateSlot={handleAssignmentScheduleChange}
          />
        ) : (
          <MatrixScheduleView slotsByDay={slotsByDay} />
        )}

        <AssignmentDayPlanner
          assignments={assignments}
          savingAssignmentId={savingAssignmentId}
          onWeekdayChange={handleWeekdayChange}
        />

        <WarningsPanel warnings={allWarnings} />
      </div>
    </PageCard>
  );
}

function MatrixScheduleView({ slotsByDay }) {
  return (
    <div className="grid gap-3 xl:grid-cols-5">
      {WEEKDAYS.map((day) => (
        <section key={day.value} className="min-w-0 rounded-md border">
          <div className="border-b px-3 py-2 text-sm font-semibold">{day.label}</div>
          <div className="flex flex-col gap-2 p-2">
            {slotsByDay[day.value].length ? (
              groupMatrixSlots(slotsByDay[day.value]).map((group) => (
                <div
                  key={group.key}
                  className="grid gap-1"
                  style={{ gridTemplateColumns: `repeat(${group.slots.length}, minmax(0, 1fr))` }}
                >
                  {group.slots.map((slot, index) => (
                    <article
                      key={slot.id ?? `${slot.weekday}-${slot.startTime}-${slot.courseId}-${index}`}
                      className={cn(
                        "min-w-0 rounded-md bg-muted/50 p-2 text-sm",
                        group.slots.length > 1 && "ring-1 ring-primary/30"
                      )}
                    >
                      <div className="font-medium">{formatTimeRange(slot)}</div>
                      <div
                        className="mt-1 truncate leading-snug"
                        title={`${slot.courseCode} · ${slot.courseName}`}
                      >
                        {slot.courseCode} · {slot.courseName}
                      </div>
                      <div className="mt-1 truncate text-xs text-muted-foreground" title={slot.teacherName}>
                        {slot.teacherName}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted-foreground">
                        <span>{slotSubtitle(slot)}</span>
                        {slot.spaceName && (
                          <span className="truncate" title={slot.spaceName}>
                            · {slot.spaceName}
                          </span>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ))
            ) : (
              <p className="px-1 py-2 text-sm text-muted-foreground">Sin clases.</p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}

function AssignmentDayPlanner({ assignments, savingAssignmentId, onWeekdayChange }) {
  if (!assignments.length) {
    return null;
  }

  return (
    <section className="rounded-md border">
      <div className="border-b px-3 py-2">
        <h3 className="text-sm font-semibold">Días asignados</h3>
        <p className="text-xs text-muted-foreground">
          Sin día se ubica automáticamente y se muestra opaco en la vista Color.
        </p>
      </div>
      <div className="grid gap-2 p-3 md:grid-cols-2">
        {assignments.map((assignment) => (
          <div
            key={assignment.id}
            className="grid gap-2 rounded-md bg-muted/40 p-2 text-sm sm:grid-cols-[minmax(0,1fr)_9rem]"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">
                {assignment.courseCode} · {assignment.courseName}
              </span>
              <span className="text-xs text-muted-foreground">
                {assignment.teacherName} · {slotSubtitle(assignment)}
              </span>
            </span>
            <WeekdayCombobox
              value={assignment.weekday}
              disabled={savingAssignmentId === assignment.id}
              onChange={(weekday) => onWeekdayChange(assignment.id, weekday)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function WarningsPanel({ warnings }) {
  if (!warnings.length) {
    return null;
  }

  return (
    <Collapsible className="rounded-md border border-amber-300 bg-amber-50 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-left font-medium">
        <span>Advertencias ({warnings.length})</span>
        <ChevronDown className="size-4 transition-transform data-[popup-open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-1 border-t border-amber-300 px-3 py-2 dark:border-amber-900">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function WeekdayCombobox({ value, disabled, onChange }) {
  const anchor = useComboboxAnchor();
  const selectedLabel = value ? getWeekdayLabel(value, true) : "Sin día";
  const options = ["Sin día", ...WEEKDAYS.map((day) => day.longLabel)];

  return (
    <div ref={anchor} className="w-full">
      <Combobox
        items={options}
        value={selectedLabel}
        onValueChange={(label) => {
          const weekday = WEEKDAYS.find((day) => day.longLabel === label);
          onChange(weekday?.value ?? null);
        }}
        disabled={disabled}
      >
        <ComboboxInput placeholder="Día" readOnly />
        <ComboboxContent anchor={anchor}>
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
  );
}

function findManualDayConflicts(assignments) {
  const conflicts = [];
  for (let leftIndex = 0; leftIndex < assignments.length; leftIndex += 1) {
    const left = assignments[leftIndex];
    if (!left.weekday) {
      continue;
    }
    for (let rightIndex = leftIndex + 1; rightIndex < assignments.length; rightIndex += 1) {
      const right = assignments[rightIndex];
      if (
        !right.weekday ||
        left.weekday !== right.weekday ||
        left.shift !== right.shift ||
        left.cycle !== right.cycle ||
        left.courseId === right.courseId
      ) {
        continue;
      }
      if (
        left.manualStartTime &&
        left.manualEndTime &&
        right.manualStartTime &&
        right.manualEndTime
      ) {
        const leftStart = parseTimeToMinutes(left.manualStartTime.slice(0, 5));
        const leftEnd = parseTimeToMinutes(left.manualEndTime.slice(0, 5));
        const rightStart = parseTimeToMinutes(right.manualStartTime.slice(0, 5));
        const rightEnd = parseTimeToMinutes(right.manualEndTime.slice(0, 5));
        if (leftStart >= rightEnd || rightStart >= leftEnd) {
          continue;
        }
      }
      conflicts.push(
        `${getWeekdayLabel(left.weekday, true)} ocupado: ${left.courseCode} y ${right.courseCode} comparten ciclo y turno.`
      );
    }
  }
  return conflicts;
}

function ColorScheduleView({ blocks, slotsByDay, savingAssignmentId, onUpdateSlot }) {
  const bounds = getDayBounds(blocks);
  const hourMarks = buildHourMarks(bounds.start, bounds.end);
  const dayRefs = useRef(new Map());
  const [interaction, setInteraction] = useState(null);

  const setDayRef = (weekday, node) => {
    if (node) {
      dayRefs.current.set(weekday, node);
      return;
    }
    dayRefs.current.delete(weekday);
  };

  useEffect(() => {
    if (!interaction) {
      return undefined;
    }

    const handlePointerMove = (event) => {
      event.preventDefault();
      setInteraction((current) => {
        if (!current) {
          return current;
        }

        const nextWeekday =
          current.type === "resize"
            ? current.previewWeekday
            : pickWeekdayFromPointer(dayRefs.current, event.clientX, current.previewWeekday);

        const shiftBounds = getShiftBounds(blocks, current.slot.shift, bounds);
        if (!shiftBounds) {
          return { ...current, x: event.clientX, y: event.clientY };
        }

        if (current.type === "move") {
          const pointerMinutes = minutesFromPointer(dayRefs.current, nextWeekday, event.clientY, bounds);
          const nextDuration = current.durationMinutes;
          const rawStart = snapMinutes(pointerMinutes - current.pointerOffsetMinutes, DRAG_STEP_MINUTES);
          const startMinutes = clampMinutes(
            rawStart,
            shiftBounds.start,
            shiftBounds.end - nextDuration
          );

          return {
            ...current,
            x: event.clientX,
            y: event.clientY,
            previewWeekday: nextWeekday,
            previewStartTime: formatMinutesToTime(startMinutes),
            previewEndTime: formatMinutesToTime(startMinutes + nextDuration),
          };
        }

        const pointerMinutes = minutesFromPointer(
          dayRefs.current,
          current.previewWeekday,
          event.clientY,
          bounds
        );
        const endMinutes = clampMinutes(
          snapMinutes(pointerMinutes, DRAG_STEP_MINUTES),
          current.startMinutes + DRAG_STEP_MINUTES,
          shiftBounds.end
        );

        return {
          ...current,
          x: event.clientX,
          y: event.clientY,
          previewEndTime: formatMinutesToTime(endMinutes),
        };
      });
    };

    const handlePointerUp = async () => {
      const current = interaction;
      setInteraction(null);
      if (!current || savingAssignmentId != null) {
        return;
      }

      const changed =
        current.previewWeekday !== current.slot.weekday ||
        current.previewStartTime !== current.slot.startTime ||
        current.previewEndTime !== current.slot.endTime;

      if (!changed) {
        return;
      }

      await onUpdateSlot(current.assignmentId, {
        weekday: current.previewWeekday,
        startTime: current.previewStartTime,
        endTime: current.previewEndTime,
      });
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [interaction, bounds, blocks, onUpdateSlot, savingAssignmentId]);

  const startMoveInteraction = (event, slot) => {
    if (!slot.assignmentId || savingAssignmentId != null) {
      return;
    }
    event.preventDefault();

    const pointerMinutes = minutesFromPointer(dayRefs.current, slot.weekday, event.clientY, bounds);
    const startMinutes = parseTimeToMinutes(slot.startTime);
    const endMinutes = parseTimeToMinutes(slot.endTime);
    if (pointerMinutes == null || startMinutes == null || endMinutes == null) {
      return;
    }

    setInteraction({
      type: "move",
      assignmentId: slot.assignmentId,
      slot,
      x: event.clientX,
      y: event.clientY,
      durationMinutes: endMinutes - startMinutes,
      pointerOffsetMinutes: pointerMinutes - startMinutes,
      previewWeekday: slot.weekday,
      previewStartTime: slot.startTime,
      previewEndTime: slot.endTime,
    });
  };

  const startResizeInteraction = (event, slot) => {
    if (!slot.assignmentId || savingAssignmentId != null) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();

    const startMinutes = parseTimeToMinutes(slot.startTime);
    if (startMinutes == null) {
      return;
    }

    setInteraction({
      type: "resize",
      assignmentId: slot.assignmentId,
      slot,
      x: event.clientX,
      y: event.clientY,
      startMinutes,
      previewWeekday: slot.weekday,
      previewStartTime: slot.startTime,
      previewEndTime: slot.endTime,
    });
  };

  return (
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
        <section
          key={day.value}
          className={cn(
            "flex min-w-0 flex-col gap-2 rounded-2xl transition-colors",
            interaction?.previewWeekday === day.value && "bg-primary/5"
          )}
        >
          <div className="px-1 text-center text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            {day.label}
          </div>
          <div
            className={cn(
              "relative min-h-[440px] rounded-2xl border border-border/70 bg-gradient-to-b from-background to-muted/20 py-3 pl-10 shadow-sm xl:min-h-[560px] xl:pl-0",
              interaction?.previewWeekday === day.value &&
                "border-primary/70 bg-primary/5 ring-2 ring-primary/20 shadow-lg"
            )}
          >
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

            <div
              ref={(node) => setDayRef(day.value, node)}
              className="absolute inset-y-3 left-9 right-2 xl:left-2"
            >
              {blocks.map((block) => {
                const position = getBlockPosition(block, bounds.start, bounds.end);
                return (
                  <div
                    key={`${day.value}-${block.id}`}
                    className={cn(
                      "absolute inset-x-0 rounded-xl border px-1.5 text-center text-[10px] font-medium leading-tight opacity-40",
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

              {interaction?.previewWeekday === day.value && (
                <DropPreviewSlot
                  slot={{
                    ...interaction.slot,
                    weekday: interaction.previewWeekday,
                    startTime: interaction.previewStartTime,
                    endTime: interaction.previewEndTime,
                  }}
                  bounds={bounds}
                  isResize={interaction.type === "resize"}
                />
              )}

              {layoutOverlappingSlots(slotsByDay[day.value]).map(({ slot, column, columns }, index) => {
                const top = positionForTime(slot.startTime, bounds);
                const bottom = positionForTime(slot.endTime, bounds);
                const totalGapPx = Math.max(columns - 1, 0) * 8;
                const columnWidth = `calc((100% - ${totalGapPx}px) / ${columns})`;
                const columnLeft = `calc(${column} * (${columnWidth} + 8px))`;

                return (
                  <article
                    key={slot.id ?? `${slot.weekday}-${slot.startTime}-${slot.courseId}-${index}`}
                    className={cn(
                      "absolute z-10 box-border overflow-hidden rounded-xl border px-2.5 py-2 text-[11px] leading-tight shadow-md transition-all duration-150",
                      getCourseColorStyle(slot),
                      slot.automaticWeekday && "border-dashed opacity-60",
                      slot.assignmentId && savingAssignmentId == null && "cursor-grab hover:-translate-y-0.5 hover:shadow-lg",
                      slot.assignmentId && savingAssignmentId == null && "active:cursor-grabbing touch-none",
                      interaction?.assignmentId === slot.assignmentId &&
                        "scale-[1.02] -rotate-1 opacity-25 ring-2 ring-white/85 shadow-2xl"
                    )}
                    onPointerDown={(event) => startMoveInteraction(event, slot)}
                    style={{
                      top: `${top}%`,
                      height: `${Math.max(bottom - top, 5)}%`,
                      left: columnLeft,
                      width: columnWidth,
                    }}
                    title={`Arrastra para mover en pasos de 15 minutos. ${slot.courseCode} · ${slot.courseName}`}
                  >
                    {interaction?.assignmentId === slot.assignmentId && (
                      <div className="absolute inset-0 rounded-xl border-2 border-dashed border-white/90 bg-white/10" />
                    )}
                    <div className="font-semibold">{slot.startTime} {slot.courseCode}</div>
                    <div className="truncate font-medium opacity-95">{slot.courseName}</div>
                    <div className="mt-0.5 truncate text-[10px] opacity-80">{slotSubtitle(slot)}</div>
                    {slot.assignmentId && savingAssignmentId == null && (
                      <button
                        type="button"
                        className="absolute bottom-0 left-2 right-2 h-2 cursor-ns-resize rounded-full bg-white/70 opacity-75 transition-opacity hover:opacity-100"
                        onPointerDown={(event) => startResizeInteraction(event, slot)}
                        aria-label={`Extender ${slot.courseCode}`}
                      />
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ))}

      {interaction && (
        <div
          className="pointer-events-none fixed left-0 top-0 z-50"
          style={{
            transform: `translate(${interaction.x + 18}px, ${interaction.y + 18}px) rotate(-2deg)`,
          }}
        >
          <article
            className={cn(
              "w-56 overflow-hidden rounded-xl border px-3 py-2 text-[11px] leading-tight shadow-2xl ring-1 ring-black/10 backdrop-blur-sm",
              getCourseColorStyle(interaction.slot)
            )}
          >
            <div className="text-[10px] font-medium opacity-80">
              {interaction.previewStartTime} - {interaction.previewEndTime}
            </div>
            <div className="font-semibold">{interaction.slot.courseCode}</div>
            <div className="truncate font-medium opacity-95">{interaction.slot.courseName}</div>
            <div className="truncate opacity-85">{slotSubtitle(interaction.slot)}</div>
            {interaction.previewWeekday && (
              <div className="mt-1 text-[10px] font-medium opacity-90">
                {interaction.type === "resize" ? "Extender en " : "Mover a "}
                {getWeekdayLabel(interaction.previewWeekday, true)}
              </div>
            )}
          </article>
        </div>
      )}
    </div>
  );
}

function DropPreviewSlot({ slot, bounds, isResize = false }) {
  const top = positionForTime(slot.startTime, bounds);
  const bottom = positionForTime(slot.endTime, bounds);

  return (
    <article
      className="absolute inset-x-0 z-20 overflow-hidden rounded-xl border-2 border-dashed border-primary/70 bg-primary/10 px-2.5 py-2 text-[11px] leading-tight shadow-sm"
      style={{
        top: `${top}%`,
        height: `${Math.max(bottom - top, 5)}%`,
      }}
    >
      <div className="text-[10px] font-medium text-primary/80">{formatTimeRange(slot)}</div>
      <div className="font-semibold text-primary">{slot.courseCode}</div>
      <div className="truncate font-medium text-primary/90">{slot.courseName}</div>
      <div className="truncate text-[10px] text-primary/75">{slotSubtitle(slot)}</div>
      {isResize && <div className="mt-1 text-[10px] font-medium text-primary/80">Duracion manual</div>}
    </article>
  );
}

function clampMinutes(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getShiftBounds(blocks, shift, bounds) {
  const blockId =
    shift === "MANANA" ? "MANANA" : shift === "TARDE" ? "TARDE" : "NOCHE";
  const block = blocks.find((item) => item.id === blockId);
  if (!block) {
    return bounds;
  }
  return {
    start: parseTimeToMinutes(block.start),
    end: parseTimeToMinutes(block.end),
  };
}

function pickWeekdayFromPointer(dayRefs, clientX, fallbackWeekday) {
  for (const [weekday, node] of dayRefs.entries()) {
    const rect = node.getBoundingClientRect();
    if (clientX >= rect.left && clientX <= rect.right) {
      return weekday;
    }
  }
  return fallbackWeekday;
}

function minutesFromPointer(dayRefs, weekday, clientY, bounds) {
  const node = dayRefs.get(weekday);
  if (!node) {
    return bounds.start;
  }
  const rect = node.getBoundingClientRect();
  const ratio = clampMinutes((clientY - rect.top) / rect.height, 0, 1);
  const minutes = bounds.start + (bounds.end - bounds.start) * ratio;
  return snapMinutes(minutes, DRAG_STEP_MINUTES);
}

function layoutOverlappingSlots(slots) {
  const sortedSlots = [...slots].sort((left, right) => {
    const startDiff = parseTimeToMinutes(left.startTime) - parseTimeToMinutes(right.startTime);
    if (startDiff !== 0) {
      return startDiff;
    }
    return parseTimeToMinutes(left.endTime) - parseTimeToMinutes(right.endTime);
  });

  const layouts = [];
  const activeColumns = [];

  for (const slot of sortedSlots) {
    const start = parseTimeToMinutes(slot.startTime);
    const end = parseTimeToMinutes(slot.endTime);

    for (let index = activeColumns.length - 1; index >= 0; index -= 1) {
      if (activeColumns[index].end <= start) {
        activeColumns.splice(index, 1);
      }
    }

    let column = 0;
    while (activeColumns.some((active) => active.column === column)) {
      column += 1;
    }

    activeColumns.push({ column, end });
    const columns = Math.max(activeColumns.length, column + 1);
    for (const layout of layouts) {
      if (layout.end > start) {
        layout.columns = Math.max(layout.columns, columns);
      }
    }
    layouts.push({ slot, column, columns, end });
  }

  return layouts.map(({ slot, column, columns }) => ({ slot, column, columns }));
}

function groupMatrixSlots(slots) {
  const groups = new Map();
  for (const slot of slots) {
    const key = [
      slot.weekday,
      slot.startTime,
      slot.endTime,
      slot.courseId,
      slot.shift,
    ].join("-");
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key).push(slot);
  }

  return [...groups.entries()]
    .map(([key, groupSlots]) => ({
      key,
      slots: groupSlots.sort((left, right) =>
        (left.subShift ?? "").localeCompare(right.subShift ?? "")
      ),
    }))
    .sort((left, right) => {
      const leftSlot = left.slots[0];
      const rightSlot = right.slots[0];
      const startDiff = parseTimeToMinutes(leftSlot.startTime) - parseTimeToMinutes(rightSlot.startTime);
      if (startDiff !== 0) {
        return startDiff;
      }
      return leftSlot.courseCode.localeCompare(rightSlot.courseCode);
    });
}

function positionForTime(value, bounds) {
  const minutes = parseTimeToMinutes(value);
  const span = Math.max(bounds.end - bounds.start, 1);
  return ((minutes - bounds.start) / span) * 100;
}

export default Horarios;
