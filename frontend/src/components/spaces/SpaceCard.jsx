import { memo } from "react";
import { FlaskConical, Pencil, Phone, School, Trash2, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAvailabilityLabel, getCycleLabel } from "@/lib/constants";

function formatAssignment(assignment) {
  return `${assignment.courseName} · ${getCycleLabel(assignment.cycle)}`;
}

function getAvailabilityClassName(availability) {
  switch (availability) {
    case "DISPONIBLE":
      return "border-green-500/30 bg-green-500/15 text-green-700 dark:text-green-400";
    case "OCUPADO":
      return "border-yellow-500/30 bg-yellow-500/15 text-yellow-800 dark:text-yellow-400";
    case "EN_MANTENIMIENTO":
      return "border-red-500/30 bg-red-500/15 text-red-700 dark:text-red-400";
    default:
      return "";
  }
}

function SpaceTypeIcon({ spaceType }) {
  const Icon = spaceType === "LABORATORIO" ? FlaskConical : School;

  return (
    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted">
      <Icon className="size-5 text-muted-foreground" />
    </div>
  );
}

function SpaceBadges({ space }) {
  return (
    <div className="mt-1 flex flex-wrap gap-1">
      <Badge className={getAvailabilityClassName(space.availability)}>
        {getAvailabilityLabel(space.availability)}
      </Badge>
    </div>
  );
}

function SpaceActions({ space, onEdit, onDelete }) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onEdit(space)}
        aria-label={`Editar ${space.name}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onDelete(space)}
        aria-label={`Eliminar ${space.name}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </>
  );
}

function SpaceManager({ space, compact = false }) {
  if (!space.managerName && !space.managerPhone) {
    return null;
  }

  return (
    <div className={compact ? "flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1" : "shrink-0 space-y-1"}>
      {space.managerName && (
        <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
          <User className="size-3.5 shrink-0" />
          <span className="truncate">{space.managerName}</span>
        </p>
      )}
      {space.managerPhone && (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Phone className="size-3.5 shrink-0" />
          <span className={compact ? "truncate" : undefined}>{space.managerPhone}</span>
        </p>
      )}
    </div>
  );
}

function SpaceAssignments({ assignments, compact = false }) {
  if (!assignments?.length) {
    return null;
  }

  if (compact) {
    return (
      <p className="truncate text-xs text-muted-foreground">
        {assignments.map(formatAssignment).join(" · ")}
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
          <span className="font-medium">{assignment.courseName}</span>
          {" · "}
          {getCycleLabel(assignment.cycle)}
        </li>
      ))}
    </ul>
  );
}

function SpaceCardGrid({ space, isAdmin, onEdit, onDelete }) {
  return (
    <Card className="flex h-72 flex-col overflow-hidden">
      <CardHeader className="grid shrink-0 auto-rows-min grid-cols-[auto_1fr] items-center gap-3 pb-2">
        <SpaceTypeIcon spaceType={space.spaceType} />
        <div className="min-w-0">
          <CardTitle className="truncate">{space.name}</CardTitle>
          <SpaceBadges space={space} />
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden text-sm">
        <SpaceManager space={space} />
        <SpaceAssignments assignments={space.assignments} />
      </CardContent>

      {isAdmin && (
        <CardFooter className="shrink-0 gap-2 border-t bg-muted/30">
          <SpaceActions space={space} onEdit={onEdit} onDelete={onDelete} />
        </CardFooter>
      )}
    </Card>
  );
}

function SpaceCardList({ space, isAdmin, onEdit, onDelete }) {
  return (
    <Card className="flex h-24 items-center overflow-hidden py-0">
      <div className="grid h-full w-full grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <SpaceTypeIcon spaceType={space.spaceType} />
          <div className="min-w-0">
            <p className="truncate font-medium">{space.name}</p>
            <SpaceBadges space={space} />
          </div>
        </div>

        <div className="min-w-0 space-y-1 text-sm">
          <SpaceManager space={space} compact />
          <SpaceAssignments assignments={space.assignments} compact />
        </div>

        {isAdmin && (
          <div className="flex shrink-0 items-center gap-2">
            <SpaceActions space={space} onEdit={onEdit} onDelete={onDelete} />
          </div>
        )}
      </div>
    </Card>
  );
}

function SpaceCard({ space, viewMode = "grid", isAdmin, onEdit, onDelete }) {
  if (viewMode === "list") {
    return (
      <SpaceCardList
        space={space}
        isAdmin={isAdmin}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <SpaceCardGrid
      space={space}
      isAdmin={isAdmin}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

export default memo(SpaceCard);
