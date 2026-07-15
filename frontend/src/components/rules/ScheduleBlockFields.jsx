import { useEffect, useRef, useState } from "react";
import { Clock, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  BLOCK_STYLES,
  DEFAULT_BLOCK_STYLE,
  formatMinutesToTime,
  parseTimeToMinutes,
  snapMinutes,
  updateBlockTime,
} from "@/lib/scheduleTime";

const REQUIRED_BLOCK_IDS = new Set(["MANANA", "TARDE", "NOCHE"]);

function buildBlockId() {
  return `BLOQUE_${Date.now()}`;
}

function canAddAfter(blocks, blockIndex) {
  const currentEnd = parseTimeToMinutes(blocks[blockIndex]?.end);
  const nextEnd = parseTimeToMinutes(blocks[blockIndex + 1]?.end);
  if (currentEnd == null) {
    return false;
  }
  if (nextEnd == null) {
    return currentEnd <= 23 * 60 + 44;
  }
  return nextEnd - currentEnd >= 30;
}

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

  const handleLabelChange = (blockIndex, label) => {
    onChange(
      blocks.map((block, index) =>
        index === blockIndex ? { ...block, label } : block
      )
    );
  };

  const handleAddBlock = (afterIndex = blocks.length - 1) => {
    if (!canAddAfter(blocks, afterIndex)) {
      return;
    }

    const currentBlock = blocks[afterIndex];
    const nextBlock = blocks[afterIndex + 1];
    const start = currentBlock?.end ?? "17:00";
    const startMinutes = parseTimeToMinutes(start) ?? 17 * 60;
    const nextEndMinutes = parseTimeToMinutes(nextBlock?.end);
    const maxEnd = nextEndMinutes == null ? 23 * 60 + 59 : nextEndMinutes - 15;
    const end = formatMinutesToTime(Math.min(startMinutes + 30, maxEnd));
    const newBlock = {
      id: buildBlockId(),
      label: "Nuevo bloque",
      start,
      end,
    };
    const next = [
      ...blocks.slice(0, afterIndex + 1),
      newBlock,
      ...blocks.slice(afterIndex + 1),
    ];

    if (nextBlock) {
      next[afterIndex + 2] = { ...nextBlock, start: end };
    }
    onChange(next);
  };

  const handleRemoveBlock = (blockIndex) => {
    const block = blocks[blockIndex];
    if (REQUIRED_BLOCK_IDS.has(block.id) || blocks.length <= 1) {
      return;
    }

    const next = blocks.filter((_, index) => index !== blockIndex);
    if (blockIndex > 0 && blockIndex < blocks.length - 1) {
      next[blockIndex - 1] = { ...next[blockIndex - 1], end: blocks[blockIndex + 1].start };
    }
    onChange(next);
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3">
        {blocks.map((block, index) => (
          <div
            key={block.id}
            className={cn(
              "grid gap-3 rounded-lg border p-3 sm:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,1fr))_auto]",
              BLOCK_STYLES[block.id] ?? DEFAULT_BLOCK_STYLE
            )}
          >
            <div className="space-y-1.5">
              <Label htmlFor={`${block.id}-label`}>Bloque</Label>
              <Input
                id={`${block.id}-label`}
                value={block.label}
                disabled={disabled}
                onChange={(event) => handleLabelChange(index, event.target.value)}
              />
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

            <div className="flex items-end justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Agregar bloque después de ${block.label}`}
                disabled={disabled || !canAddAfter(blocks, index)}
                onClick={() => handleAddBlock(index)}
              >
                <Plus />
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                aria-label={`Quitar ${block.label}`}
                disabled={disabled || REQUIRED_BLOCK_IDS.has(block.id) || blocks.length <= 1}
                onClick={() => handleRemoveBlock(index)}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => handleAddBlock()}
        disabled={disabled || !canAddAfter(blocks, blocks.length - 1)}
      >
        <Plus />
        Agregar bloque
      </Button>
    </div>
  );
}

export default ScheduleBlockFields;
