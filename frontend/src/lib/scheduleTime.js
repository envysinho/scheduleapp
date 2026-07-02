export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie"];

export const MEAL_BLOCK_IDS = new Set(["DESAYUNO", "ALMUERZO", "CENA"]);

export const BLOCK_STYLES = {
  DESAYUNO: "bg-amber-500/20 border-amber-500/40 text-amber-950 dark:text-amber-100",
  MANANA: "bg-sky-500/20 border-sky-500/40 text-sky-950 dark:text-sky-100",
  ALMUERZO: "bg-orange-500/20 border-orange-500/40 text-orange-950 dark:text-orange-100",
  TARDE: "bg-indigo-500/20 border-indigo-500/40 text-indigo-950 dark:text-indigo-100",
  CENA: "bg-rose-500/20 border-rose-500/40 text-rose-950 dark:text-rose-100",
  NOCHE: "bg-violet-500/20 border-violet-500/40 text-violet-950 dark:text-violet-100",
};

export function parseTimeToMinutes(value) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }
  const [hours, minutes] = value.split(":").map(Number);
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return hours * 60 + minutes;
}

export function formatMinutesToTime(totalMinutes) {
  const normalized = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const minutes = normalized % 60;
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
}

export function snapMinutes(totalMinutes, step = 5) {
  return Math.round(totalMinutes / step) * step;
}

export function getDayBounds(blocks) {
  if (!blocks?.length) {
    return { start: 0, end: 24 * 60 };
  }
  return {
    start: parseTimeToMinutes(blocks[0].start),
    end: parseTimeToMinutes(blocks[blocks.length - 1].end),
  };
}

export function getBlockPosition(block, dayStart, dayEnd) {
  const start = parseTimeToMinutes(block.start);
  const end = parseTimeToMinutes(block.end);
  const span = Math.max(dayEnd - dayStart, 1);
  return {
    top: ((start - dayStart) / span) * 100,
    height: ((end - start) / span) * 100,
  };
}

export function validateScheduleBlocks(blocks) {
  if (!blocks?.length) {
    return "Debe existir al menos un bloque horario";
  }

  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const start = parseTimeToMinutes(block.start);
    const end = parseTimeToMinutes(block.end);

    if (start == null || end == null) {
      return `Hora inválida en ${block.label}`;
    }
    if (start >= end) {
      return `Inicio debe ser anterior al fin en ${block.label}`;
    }
    if (end - start < 15) {
      return `Duración mínima de 15 minutos en ${block.label}`;
    }
    if (index === 0 && start < 5 * 60) {
      return "El desayuno no puede empezar antes de las 05:00";
    }
    if (index === blocks.length - 1 && end > 23 * 60 + 59) {
      return "El turno noche no puede terminar después de las 23:59";
    }
    if (index > 0) {
      const previousEnd = parseTimeToMinutes(blocks[index - 1].end);
      if (previousEnd !== start) {
        return "Los bloques deben encadenarse sin huecos ni solapes";
      }
    }
  }

  return null;
}

export function updateBoundary(blocks, boundaryIndex, newMinutes) {
  if (boundaryIndex <= 0 || boundaryIndex >= blocks.length) {
    return blocks;
  }

  const snapped = snapMinutes(newMinutes);
  const next = blocks.map((block) => ({ ...block }));
  next[boundaryIndex - 1] = {
    ...next[boundaryIndex - 1],
    end: formatMinutesToTime(snapped),
  };
  next[boundaryIndex] = {
    ...next[boundaryIndex],
    start: formatMinutesToTime(snapped),
  };
  return next;
}

export function updateBlockTime(blocks, blockIndex, field, value) {
  const next = blocks.map((block) => ({ ...block }));
  next[blockIndex] = { ...next[blockIndex], [field]: value };

  if (field === "end" && blockIndex < next.length - 1) {
    next[blockIndex + 1] = { ...next[blockIndex + 1], start: value };
  }
  if (field === "start" && blockIndex > 0) {
    next[blockIndex - 1] = { ...next[blockIndex - 1], end: value };
  }

  return next;
}

export function buildHourMarks(dayStart, dayEnd) {
  const marks = [];
  const firstHour = Math.floor(dayStart / 60);
  const lastHour = Math.ceil(dayEnd / 60);
  for (let hour = firstHour; hour <= lastHour; hour += 1) {
    const minutes = hour * 60;
    if (minutes >= dayStart && minutes <= dayEnd) {
      marks.push({
        label: formatMinutesToTime(minutes),
        top: ((minutes - dayStart) / Math.max(dayEnd - dayStart, 1)) * 100,
      });
    }
  }
  return marks;
}
