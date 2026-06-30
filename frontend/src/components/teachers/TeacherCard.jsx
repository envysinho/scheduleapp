import { memo } from "react";
import { Mail, Pencil, Phone, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  getCycleLabel,
  getEmploymentTypeLabel,
  getTeacherShiftLabel,
} from "@/lib/constants";

function getInitials(firstName, lastName) {
  const first = firstName?.charAt(0) ?? "";
  const last = lastName?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

function formatShiftsLabel(shifts) {
  if (!shifts?.length) {
    return "";
  }
  return shifts.map(getTeacherShiftLabel).join(", ");
}

function formatAssignment(assignment, shifts) {
  const parts = [assignment.courseName, getCycleLabel(assignment.cycle)];
  const shiftsLabel = formatShiftsLabel(shifts);
  if (shiftsLabel) {
    parts.push(shiftsLabel);
  }
  return parts.join(" · ");
}

function getTeacherShifts(teacher) {
  if (teacher.shifts?.length) {
    return teacher.shifts;
  }
  if (teacher.shift) {
    return [teacher.shift];
  }
  return [];
}

function TeacherBadges({ teacher }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      <Badge variant="secondary">
        {getEmploymentTypeLabel(teacher.employmentType)}
      </Badge>
    </div>
  );
}

function TeacherActions({ teacher, onEdit, onDelete }) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onEdit(teacher)}
        aria-label={`Editar ${teacher.fullName}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onDelete(teacher)}
        aria-label={`Eliminar ${teacher.fullName}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </>
  );
}

function TeacherContact({ teacher, compact = false }) {
  if (!teacher.email && !teacher.phone) {
    return null;
  }

  return (
    <div className={compact ? "flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1" : "shrink-0 space-y-1"}>
      {teacher.email && (
        <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
          <Mail className="size-3.5 shrink-0" />
          <span className="truncate">{teacher.email}</span>
        </p>
      )}
      {teacher.phone && (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Phone className="size-3.5 shrink-0" />
          <span className={compact ? "truncate" : undefined}>{teacher.phone}</span>
        </p>
      )}
    </div>
  );
}

function TeacherAssignments({ assignments, shifts = [], compact = false }) {
  if (!assignments?.length) {
    return null;
  }

  if (compact) {
    return (
      <p className="truncate text-xs text-muted-foreground">
        {assignments.map((assignment) => formatAssignment(assignment, shifts)).join(" · ")}
      </p>
    );
  }

  return (
    <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
      {assignments.map((assignment) => (
        <li
          key={assignment.id ?? `${assignment.courseName}-${assignment.cycle}`}
          className="rounded-md bg-muted/50 px-2 py-1 text-xs"
        >
          {formatAssignment(assignment, shifts)}
        </li>
      ))}
    </ul>
  );
}

function TeacherCardGrid({ teacher, isAdmin, onEdit, onDelete }) {
  return (
    <Card className="flex h-72 flex-col overflow-hidden">
      <CardHeader className="grid shrink-0 auto-rows-min grid-cols-[auto_1fr] items-center gap-3 pb-2">
        <Avatar>
          <AvatarFallback>{getInitials(teacher.firstName, teacher.lastName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <CardTitle className="truncate">{teacher.fullName}</CardTitle>
          <TeacherBadges teacher={teacher} />
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden text-sm">
        <TeacherContact teacher={teacher} />
        <TeacherAssignments
          assignments={teacher.assignments}
          shifts={getTeacherShifts(teacher)}
        />
      </CardContent>

      {isAdmin && (
        <CardFooter className="shrink-0 gap-2 border-t bg-muted/30">
          <TeacherActions teacher={teacher} onEdit={onEdit} onDelete={onDelete} />
        </CardFooter>
      )}
    </Card>
  );
}

function TeacherCardList({ teacher, isAdmin, onEdit, onDelete }) {
  return (
    <Card className="flex h-24 items-center overflow-hidden py-0">
      <div className="grid h-full w-full grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg" className="shrink-0">
            <AvatarFallback>{getInitials(teacher.firstName, teacher.lastName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{teacher.fullName}</p>
            <TeacherBadges teacher={teacher} />
          </div>
        </div>

        <div className="min-w-0 space-y-1 text-sm">
          <TeacherContact teacher={teacher} compact />
          <TeacherAssignments
            assignments={teacher.assignments}
            shifts={getTeacherShifts(teacher)}
            compact
          />
        </div>

        {isAdmin && (
          <div className="flex shrink-0 items-center gap-2">
            <TeacherActions teacher={teacher} onEdit={onEdit} onDelete={onDelete} />
          </div>
        )}
      </div>
    </Card>
  );
}

function TeacherCard({ teacher, viewMode = "grid", isAdmin, onEdit, onDelete }) {
  if (viewMode === "list") {
    return (
      <TeacherCardList
        teacher={teacher}
        isAdmin={isAdmin}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <TeacherCardGrid
      teacher={teacher}
      isAdmin={isAdmin}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

export default memo(TeacherCard);
