import { memo } from "react";
import { BookOpen, Building2, Pencil, Phone, Trash2, User } from "lucide-react";
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
  getTeacherShiftLabel,
  isCourseLectivo,
  isNightOnlyCycle,
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

function hasSameTeacher(course) {
  const morning = course.morningTeacher;
  const afternoon = course.afternoonTeacher;
  if (!morning || !afternoon) {
    return false;
  }
  return morning.id === afternoon.id;
}

function getTeacherEntries(course) {
  const morning = course.morningTeacher;
  const afternoon = course.afternoonTeacher;
  const night = course.nightTeacher;

  if (isNightOnlyCycle(course.cycle)) {
    if (!night) {
      return [];
    }
    return [{ label: null, teacher: night, shiftLabel: getTeacherShiftLabel("NOCHE") }];
  }

  if (!morning && !afternoon) {
    if (night) {
      return [{ label: null, teacher: night, shiftLabel: getTeacherShiftLabel("NOCHE") }];
    }
    return [];
  }

  if (hasSameTeacher(course)) {
    return [{ label: null, teacher: morning, shiftLabel: "Mañana y tarde" }];
  }

  const entries = [];
  if (morning) {
    entries.push({
      label: entries.length === 0 && afternoon ? "Docente 1" : morning ? "Docente 1" : null,
      teacher: morning,
      shiftLabel: getTeacherShiftLabel("MANANA"),
    });
  }
  if (afternoon) {
    entries.push({
      label: morning ? "Docente 2" : "Docente 1",
      teacher: afternoon,
      shiftLabel: getTeacherShiftLabel("TARDE"),
    });
  }
  if (night) {
    entries.push({
      label: null,
      teacher: night,
      shiftLabel: getTeacherShiftLabel("NOCHE"),
    });
  }
  return entries;
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
  const entries = getTeacherEntries(course);

  if (entries.length === 0) {
    return null;
  }

  if (compact) {
    return (
      <p className="truncate text-xs text-muted-foreground">
        {entries
          .map(({ label, teacher, shiftLabel }) =>
            label
              ? `${label}: ${teacher.fullName} (${shiftLabel})`
              : `${teacher.fullName} (${shiftLabel})`
          )
          .join(" · ")}
      </p>
    );
  }

  return (
    <div className="shrink-0 space-y-1">
      {entries.map(({ label, teacher, shiftLabel }) => (
        <div key={`${teacher.id}-${shiftLabel}`} className="space-y-1">
          {label && (
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
          )}
          <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
            <User className="size-3.5 shrink-0" />
            <span className="truncate">
              {teacher.fullName}
              {" · "}
              {shiftLabel}
            </span>
          </p>
          {teacher.phone && (
            <p className="flex items-center gap-2 text-muted-foreground">
              <Phone className="size-3.5 shrink-0" />
              <span>{teacher.phone}</span>
            </p>
          )}
        </div>
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
        <CardFooter className="shrink-0 gap-2 border-t bg-muted/30">
          <CourseActions course={course} onEdit={onEdit} onDelete={onDelete} />
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
            <p className="max-w-[14rem] truncate font-medium">{course.name}</p>
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
