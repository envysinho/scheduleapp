import { useCallback, useEffect, useMemo, useState } from "react";
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
  updateAssignmentWeekday,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  BLOCK_STYLES,
  DEFAULT_BLOCK_STYLE,
  buildHourMarks,
  getBlockPosition,
  getDayBounds,
  parseTimeToMinutes,
} from "@/lib/scheduleTime";

const SLOT_STYLES = {
  MANANA: "bg-sky-600 text-white border-sky-700",
  TARDE: "bg-indigo-600 text-white border-indigo-700",
  NOCHE: "bg-violet-600 text-white border-violet-700",
};

function formatTimeRange(slot) {
  return `${slot.startTime} - ${slot.endTime}`;
}

function slotSubtitle(slot) {
  const shift = getTeacherShiftLabel(slot.shift);
  const subShift = slot.subShift ? ` ${getSubShiftLabel(slot.subShift)}` : "";
  return `${shift}${subShift}`;
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

  const loadSchedule = useCallback(async () => {
    setLoading(true);
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
      setLoading(false);
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

  const handleWeekdayChange = async (assignmentId, weekday) => {
    setSavingAssignmentId(assignmentId);
    setError(null);
    try {
      await updateAssignmentWeekday(assignmentId, weekday || null, logout);
      await loadSchedule();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al actualizar día");
    } finally {
      setSavingAssignmentId(null);
    }
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
          <ColorScheduleView blocks={blocks} slotsByDay={slotsByDay} />
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
      conflicts.push(
        `${getWeekdayLabel(left.weekday, true)} ocupado: ${left.courseCode} y ${right.courseCode} comparten ciclo y turno.`
      );
    }
  }
  return conflicts;
}

function ColorScheduleView({ blocks, slotsByDay }) {
  const bounds = getDayBounds(blocks);
  const hourMarks = buildHourMarks(bounds.start, bounds.end);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[2.75rem_repeat(5,minmax(0,1fr))]">
      <div className="hidden xl:flex xl:w-11 xl:flex-col xl:gap-2">
        <div className="text-center text-xs font-medium text-muted-foreground opacity-0 select-none">
          Hora
        </div>
        <div className="relative min-h-[548px] py-1.5">
          {hourMarks.map((mark) => (
            <span
              key={`${mark.label}-${mark.top}`}
              className="absolute right-0 w-full -translate-y-1/2 text-right font-mono text-[10px] tabular-nums leading-none text-muted-foreground"
              style={{ top: `${mark.top}%` }}
            >
              {mark.label}
            </span>
          ))}
        </div>
      </div>

      {WEEKDAYS.map((day) => (
        <section key={day.value} className="flex min-w-0 flex-col gap-2">
          <div className="text-center text-xs font-medium text-muted-foreground">{day.label}</div>
          <div className="relative min-h-[420px] rounded-lg border bg-muted/20 py-1.5 pl-9 xl:min-h-[548px] xl:pl-0">
            {hourMarks.map((mark) => (
              <span
                key={`${day.value}-${mark.label}-${mark.top}`}
                className="absolute left-1 w-7 -translate-y-1/2 text-left font-mono text-[9px] tabular-nums leading-none text-muted-foreground xl:hidden"
                style={{ top: `${mark.top}%` }}
              >
                {mark.label}
              </span>
            ))}

            <div className="absolute inset-y-1.5 left-9 right-1 xl:left-1">
              {blocks.map((block) => {
                const position = getBlockPosition(block, bounds.start, bounds.end);
                return (
                  <div
                    key={`${day.value}-${block.id}`}
                    className={cn(
                      "absolute inset-x-0 rounded-md border px-1 text-center text-[10px] font-medium leading-tight opacity-60",
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

              {layoutOverlappingSlots(slotsByDay[day.value]).map(({ slot, column, columns }, index) => {
                const top = positionForTime(slot.startTime, bounds);
                const bottom = positionForTime(slot.endTime, bounds);
                const totalGapPx = Math.max(columns - 1, 0) * 4;
                const columnWidth = `calc((100% - ${totalGapPx}px) / ${columns})`;
                const columnLeft = `calc(${column} * (${columnWidth} + 4px))`;

                return (
                  <article
                    key={slot.id ?? `${slot.weekday}-${slot.startTime}-${slot.courseId}-${index}`}
                    className={cn(
                      "absolute z-10 box-border overflow-hidden rounded-md border px-2 py-1 text-[11px] leading-tight shadow-sm",
                      SLOT_STYLES[slot.shift],
                      slot.automaticWeekday && "border-dashed opacity-60"
                    )}
                    style={{
                      top: `${top}%`,
                      height: `${Math.max(bottom - top, 5)}%`,
                      left: columnLeft,
                      width: columnWidth,
                    }}
                  >
                    <div className="font-semibold">{slot.startTime} {slot.courseCode}</div>
                    <div className="truncate">{slot.courseName}</div>
                    <div className="truncate opacity-85">{slotSubtitle(slot)}</div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
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
