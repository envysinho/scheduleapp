import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  BLOCK_STYLES,
  formatMinutesToTime,
  parseTimeToMinutes,
  snapMinutes,
  updateBlockTime,
} from "@/lib/scheduleTime";

function TimeField({ id, label, value, disabled, onCommit }) {
  const [localValue, setLocalValue] = useState(value);
  const isEditingRef = useRef(false);

  useEffect(() => {
    if (!isEditingRef.current) {
      setLocalValue(value);
    }
  }, [value]);

  const commit = (rawValue) => {
    const parsed = parseTimeToMinutes(rawValue);
    if (parsed == null) {
      setLocalValue(value);
      return;
    }
    const normalized = formatMinutesToTime(snapMinutes(parsed));
    setLocalValue(normalized);
    onCommit(normalized);
  };

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <Clock aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          type="text"
          inputMode="numeric"
          placeholder="HH:MM"
          maxLength={5}
          value={localValue}
          disabled={disabled}
          onFocus={() => {
            isEditingRef.current = true;
          }}
          onChange={(event) => {
            setLocalValue(event.target.value);
          }}
          onBlur={() => {
            isEditingRef.current = false;
            commit(localValue);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
        />
      </InputGroup>
    </div>
  );
}

function ScheduleBlockFields({ blocks, onChange, disabled = false }) {
  const handleCommit = (blockIndex, field) => (nextValue) => {
    onChange(updateBlockTime(blocks, blockIndex, field, nextValue));
  };

  return (
    <div className="grid gap-3">
      {blocks.map((block, index) => (
        <div
          key={block.id}
          className={cn(
            "grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,1fr))]",
            BLOCK_STYLES[block.id]
          )}
        >
          <div className="flex items-center">
            <span className="text-sm font-medium">{block.label}</span>
          </div>

          <TimeField
            id={`${block.id}-start`}
            label="Inicio"
            value={block.start}
            disabled={disabled}
            onCommit={handleCommit(index, "start")}
          />

          <TimeField
            id={`${block.id}-end`}
            label="Fin"
            value={block.end}
            disabled={disabled}
            onCommit={handleCommit(index, "end")}
          />
        </div>
      ))}
    </div>
  );
}

export default ScheduleBlockFields;
