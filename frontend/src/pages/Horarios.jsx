import { useCallback, useEffect, useMemo, useState } from "react";
import PageCard from "@/components/PageCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useSemester } from "@/contexts/SemesterContext";
import { CYCLES, getSubShiftLabel, getTeacherShiftLabel } from "@/lib/constants";
import { getSchedule, getScheduleSettings } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  BLOCK_STYLES,
  DEFAULT_BLOCK_STYLE,
  buildHourMarks,
  getBlockPosition,
  getDayBounds,
  parseTimeToMinutes,
} from "@/lib/scheduleTime";

const WEEKDAYS = [
  { value: "MONDAY", label: "Lun" },
  { value: "TUESDAY", label: "Mar" },
  { value: "WEDNESDAY", label: "Mié" },
  { value: "THURSDAY", label: "Jue" },
  { value: "FRIDAY", label: "Vie" },
];

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
  const [viewMode, setViewMode] = useState("matrix");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const cycleLabel =
    CYCLES.find((item) => item.id === cycle)?.label ?? `Ciclo ${cycle}`;

  const loadSchedule = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await getScheduleSettings({ semester }, logout);
      setBlocks(settings.blocks ?? []);
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
            {schedule?.warnings?.length ? (
              <Badge variant="outline">{schedule.warnings.length} advertencias</Badge>
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

        {schedule?.warnings?.length ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-100">
            {schedule.warnings.map((warning) => (
              <p key={warning}>{warning}</p>
            ))}
          </div>
        ) : null}

        {loading ? (
          <p className="text-sm text-muted-foreground">Cargando horario...</p>
        ) : viewMode === "color" ? (
          <ColorScheduleView blocks={blocks} slotsByDay={slotsByDay} />
        ) : (
          <MatrixScheduleView slotsByDay={slotsByDay} />
        )}
      </div>
    </PageCard>
  );
}

function MatrixScheduleView({ slotsByDay }) {
  return (
    <div className="grid gap-3 lg:grid-cols-5">
      {WEEKDAYS.map((day) => (
        <section key={day.value} className="min-w-0 rounded-md border">
          <div className="border-b px-3 py-2 text-sm font-semibold">{day.label}</div>
          <div className="flex flex-col gap-2 p-2">
            {slotsByDay[day.value].length ? (
              slotsByDay[day.value].map((slot, index) => (
                <article
                  key={slot.id ?? `${slot.weekday}-${slot.startTime}-${slot.courseId}-${index}`}
                  className="rounded-md bg-muted/50 p-2 text-sm"
                >
                  <div className="font-medium">{formatTimeRange(slot)}</div>
                  <div className="mt-1 leading-snug">{slot.courseCode} · {slot.courseName}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {slot.teacherName}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 text-xs text-muted-foreground">
                    <span>{slotSubtitle(slot)}</span>
                    {slot.spaceName && <span>· {slot.spaceName}</span>}
                  </div>
                </article>
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

function ColorScheduleView({ blocks, slotsByDay }) {
  const bounds = getDayBounds(blocks);
  const hourMarks = buildHourMarks(bounds.start, bounds.end);

  return (
    <div className="overflow-x-auto overflow-y-hidden">
      <div className="flex min-w-[820px] gap-3 pb-2">
        <div className="flex w-11 shrink-0 flex-col gap-2">
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
          <section key={day.value} className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="text-center text-xs font-medium text-muted-foreground">{day.label}</div>
            <div className="relative min-h-[548px] rounded-lg border bg-muted/20 py-1.5">
              {blocks.map((block) => {
                const position = getBlockPosition(block, bounds.start, bounds.end);
                return (
                  <div
                    key={`${day.value}-${block.id}`}
                    className={cn(
                      "absolute inset-x-1 rounded-md border px-1 text-center text-[10px] font-medium leading-tight opacity-60",
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

              {slotsByDay[day.value].map((slot, index) => {
                const top = positionForTime(slot.startTime, bounds);
                const bottom = positionForTime(slot.endTime, bounds);
                return (
                  <article
                    key={slot.id ?? `${slot.weekday}-${slot.startTime}-${slot.courseId}-${index}`}
                    className={cn(
                      "absolute inset-x-2 z-10 overflow-hidden rounded-md border px-2 py-1 text-[11px] leading-tight shadow-sm",
                      SLOT_STYLES[slot.shift]
                    )}
                    style={{
                      top: `${top}%`,
                      height: `${Math.max(bottom - top, 5)}%`,
                    }}
                  >
                    <div className="font-semibold">{slot.startTime} {slot.courseCode}</div>
                    <div className="truncate">{slot.courseName}</div>
                    <div className="truncate opacity-85">{slotSubtitle(slot)}</div>
                  </article>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function positionForTime(value, bounds) {
  const minutes = parseTimeToMinutes(value);
  const span = Math.max(bounds.end - bounds.start, 1);
  return ((minutes - bounds.start) / span) * 100;
}

export default Horarios;
