import { useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BLOCK_STYLES,
  WEEKDAY_LABELS,
  buildHourMarks,
  formatMinutesToTime,
  getBlockPosition,
  getDayBounds,
  parseTimeToMinutes,
  snapMinutes,
  updateBoundary,
} from "@/lib/scheduleTime";

function TimelineColumn({ blocks, dayStart, dayEnd, onBoundaryChange }) {
  const columnRef = useRef(null);

  const handlePointerDown = useCallback(
    (boundaryIndex) => (event) => {
      event.preventDefault();
      const column = columnRef.current;
      if (!column) {
        return;
      }

      const rect = column.getBoundingClientRect();
      const span = Math.max(dayEnd - dayStart, 1);

      const handleMove = (moveEvent) => {
        const offsetY = moveEvent.clientY - rect.top;
        const ratio = Math.min(Math.max(offsetY / rect.height, 0), 1);
        const rawMinutes = dayStart + ratio * span;
        const previousStart = parseTimeToMinutes(blocks[boundaryIndex - 1].start);
        const nextEnd = parseTimeToMinutes(blocks[boundaryIndex].end);
        const minBoundary = previousStart + 15;
        const maxBoundary = nextEnd - 15;
        const clamped = Math.min(Math.max(snapMinutes(rawMinutes), minBoundary), maxBoundary);
        onBoundaryChange(boundaryIndex, clamped);
      };

      const handleUp = () => {
        window.removeEventListener("pointermove", handleMove);
        window.removeEventListener("pointerup", handleUp);
      };

      window.addEventListener("pointermove", handleMove);
      window.addEventListener("pointerup", handleUp);
    },
    [blocks, dayEnd, dayStart, onBoundaryChange]
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <div
        ref={columnRef}
        className="relative min-h-[520px] rounded-lg border border-border bg-muted/20"
      >
        {blocks.map((block) => {
          const position = getBlockPosition(block, dayStart, dayEnd);
          return (
            <div
              key={block.id}
              className={cn(
                "absolute inset-x-1 flex items-center justify-center rounded-md border px-1 text-center text-[11px] font-medium leading-tight",
                BLOCK_STYLES[block.id]
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

        {blocks.slice(1).map((block, index) => {
          const boundaryIndex = index + 1;
          const minutes = parseTimeToMinutes(block.start);
          const top = ((minutes - dayStart) / Math.max(dayEnd - dayStart, 1)) * 100;
          return (
            <button
              key={`handle-${block.id}`}
              type="button"
              aria-label={`Ajustar límite antes de ${block.label}`}
              className="absolute inset-x-0 z-10 h-2 -translate-y-1/2 cursor-ns-resize touch-none border-y border-primary/40 bg-primary/10 hover:bg-primary/20"
              style={{ top: `${top}%` }}
              onPointerDown={handlePointerDown(boundaryIndex)}
            />
          );
        })}
      </div>
    </div>
  );
}

function DayScheduleTimeline({ blocks, onChange }) {
  const { start: dayStart, end: dayEnd } = getDayBounds(blocks);
  const hourMarks = buildHourMarks(dayStart, dayEnd);

  const handleBoundaryChange = useCallback(
    (boundaryIndex, newMinutes) => {
      onChange(updateBoundary(blocks, boundaryIndex, newMinutes));
    },
    [blocks, onChange]
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">Lunes a viernes</Badge>
        <span className="text-sm text-muted-foreground">
          Arrastra los bordes entre bloques o usa los campos de hora.
        </span>
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-[720px] gap-3">
          <div className="relative w-12 shrink-0">
            <div className="relative min-h-[520px]">
              {hourMarks.map((mark) => (
                <span
                  key={mark.label}
                  className="absolute right-0 -translate-y-1/2 text-[10px] text-muted-foreground"
                  style={{ top: `${mark.top}%` }}
                >
                  {mark.label}
                </span>
              ))}
            </div>
          </div>

          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="text-center text-xs font-medium text-muted-foreground">{label}</div>
              <TimelineColumn
                blocks={blocks}
                dayStart={dayStart}
                dayEnd={dayEnd}
                onBoundaryChange={handleBoundaryChange}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {blocks.map((block) => (
          <Badge key={block.id} variant="secondary" className={cn("font-normal", BLOCK_STYLES[block.id])}>
            {block.label}: {block.start} – {block.end}
          </Badge>
        ))}
      </div>
    </div>
  );
}

export default DayScheduleTimeline;
