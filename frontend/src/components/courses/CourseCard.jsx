import { memo } from "react";
import { BookOpen, Building2, Pencil, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  COURSE_LECTIVO_LABEL,
  getCourseAvailabilityLabel,
  getCourseTypeLabel,
  getCycleLabel,
  getSpaceTypeLabel,
  getSubShiftLabel,
  getTeacherShiftLabel,
  isCourseLectivo,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

function getAvailabilityClassName(availability) {
  switch (availability) {
    case "LLENO":
      return "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-400";
    case "INCOMPLETO":
      return "border-yellow-500/30 bg-yellow-500/15 text-yellow-800 dark:text-yellow-400";
    case "LIBRE":
      return "border-green-500/30 bg-green-500/15 text-green-700 dark:text-green-400";
    default:
      return "";
  }
}

const SHIFT_ORDER = { MANANA: 0, TARDE: 1, NOCHE: 2 };

function compareShifts(a, b) {
  const orderA = SHIFT_ORDER[a.shift] ?? 99;
  const orderB = SHIFT_ORDER[b.shift] ?? 99;
  if (orderA !== orderB) {
    return orderA - orderB;
  }
  return (a.subShift ?? "").localeCompare(b.subShift ?? "");
}

function groupTeacherAssignments(assignments) {
  if (!assignments?.length) {
    return [];
  }

  const grouped = new Map();

  for (const assignment of assignments) {
    if (!assignment.teacherId) {
      continue;
    }

    if (!grouped.has(assignment.teacherId)) {
      grouped.set(assignment.teacherId, {
        id: assignment.teacherId,
        name: assignment.teacherName,
        shifts: [],
      });
    }

    const entry = grouped.get(assignment.teacherId);
    const shiftLabel = getTeacherShiftLabel(assignment.shift);
    const subShiftLabel = assignment.subShift ? getSubShiftLabel(assignment.subShift) : null;
    entry.shifts.push({
      shift: assignment.shift,
      subShift: assignment.subShift,
      text: subShiftLabel ? `${shiftLabel} ${subShiftLabel}` : shiftLabel,
    });
  }

  return Array.from(grouped.values())
    .sort((a, b) => a.name.localeCompare(b.name))
    .map((entry) => ({
      ...entry,
      shiftsText: entry.shifts
        .sort(compareShifts)
        .map(({ text }) => text)
        .join(" · "),
    }));
}

function CourseBadges({ course, compact = false }) {
  const lectivo = isCourseLectivo(course);
  const typeLabel =
    course.type === "LECTIVOS" ? getCourseTypeLabel("DE_CARRERA") : getCourseTypeLabel(course.type);

  return (
    <div
      className={cn(
        "mt-1 flex gap-1",
        compact ? "w-max flex-nowrap" : "flex-wrap"
      )}
    >
      {course.cycle != null && (
        <Badge variant="outline">{getCycleLabel(course.cycle)}</Badge>
      )}
      <Badge variant="secondary">{typeLabel}</Badge>
      {course.requiredSpaceType && (
        <Badge variant="outline">{getSpaceTypeLabel(course.requiredSpaceType)}</Badge>
      )}
      {lectivo && <Badge variant="outline">{COURSE_LECTIVO_LABEL}</Badge>}
      <Badge className={getAvailabilityClassName(course.availability)}>
        {getCourseAvailabilityLabel(course.availability)}
      </Badge>
    </div>
  );
}

function CourseActions({ course, onEdit, onDelete }) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onEdit(course)}
        aria-label={`Editar ${course.name}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onDelete(course)}
        aria-label={`Eliminar ${course.name}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </>
  );
}

function CourseTeachers({ course, compact = false }) {
  const entries = groupTeacherAssignments(course.teacherAssignments);

  if (entries.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <p className="truncate text-xs text-muted-foreground">
        {entries.map(({ name, shiftsText }) => `${name} · ${shiftsText}`).join(" · ")}
      </p>
    );
  }

  return (
    <div className="shrink-0 space-y-1">
      {entries.map(({ id, name, shiftsText }) => (
        <p key={id} className="flex min-w-0 items-center gap-2 text-muted-foreground">
          <User className="size-3.5 shrink-0" />
          <span className="truncate">
            {name}
            {" · "}
            {shiftsText}
          </span>
        </p>
      ))}
    </div>
  );
}

function CourseSpaces({ spaceAssignments, compact = false }) {
  if (!spaceAssignments?.length) {
    return null;
  }

  if (compact) {
    return (
      <p className="truncate text-xs text-muted-foreground">
        {spaceAssignments.map((assignment) => assignment.spaceName).join(" · ")}
      </p>
    );
  }

  return (
    <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
      {spaceAssignments.map((assignment) => (
        <li
          key={assignment.id ?? assignment.spaceId}
          className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1 text-xs"
        >
          <Building2 className="size-3 shrink-0 text-muted-foreground" />
          <span className="font-medium">{assignment.spaceName}</span>
        </li>
      ))}
    </ul>
  );
}

function CourseCardGrid({ course, isAdmin, onEdit, onDelete }) {
  return (
    <Card className="flex h-72 flex-col overflow-hidden">
      <CardHeader className="grid shrink-0 auto-rows-min grid-cols-[auto_1fr] items-center gap-3 pb-2">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
          <BookOpen className="size-5 text-muted-foreground" />
        </div>
        <div className="min-w-0">
          <CardTitle className="truncate">{course.name}</CardTitle>
          <CourseBadges course={course} />
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden text-sm">
        <CourseTeachers course={course} />
        <CourseSpaces spaceAssignments={course.spaceAssignments} />
      </CardContent>

      {isAdmin && (
        <CardFooter className="flex shrink-0 items-center justify-between gap-2 border-t bg-muted/30">
          <div className="flex gap-2">
            <CourseActions course={course} onEdit={onEdit} onDelete={onDelete} />
          </div>
          <span className="text-sm font-normal text-muted-foreground">{course.code}</span>
        </CardFooter>
      )}
    </Card>
  );
}

function CourseCardList({ course, isAdmin, onEdit, onDelete }) {
  return (
    <Card className="flex h-24 items-center overflow-hidden py-0">
      <div className="grid h-full w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <BookOpen className="size-5 text-muted-foreground" />
          </div>
          <div>
            <p className="max-w-[14rem] truncate font-medium">
              <span className="mr-2 text-sm font-normal text-muted-foreground">
                {course.code}
              </span>
              {course.name}
            </p>
            <CourseBadges course={course} compact />
          </div>
        </div>

        <div className="min-w-0 space-y-1 text-sm">
          <CourseTeachers course={course} compact />
          <CourseSpaces spaceAssignments={course.spaceAssignments} compact />
        </div>

        {isAdmin && (
          <div className="flex shrink-0 items-center gap-2">
            <CourseActions course={course} onEdit={onEdit} onDelete={onDelete} />
          </div>
        )}
      </div>
    </Card>
  );
}

function CourseCard({ course, viewMode = "grid", isAdmin, onEdit, onDelete }) {
  if (viewMode === "list") {
    return (
      <CourseCardList
        course={course}
        isAdmin={isAdmin}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <CourseCardGrid
      course={course}
      isAdmin={isAdmin}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

export default memo(CourseCard);
