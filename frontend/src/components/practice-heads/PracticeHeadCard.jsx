import { memo } from "react";
import { FlaskConical, Mail, Pencil, Phone, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function getInitials(firstName, lastName) {
  const first = firstName?.charAt(0) ?? "";
  const last = lastName?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

function PracticeHeadActions({ practiceHead, onEdit, onDelete }) {
  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onEdit(practiceHead)}
        aria-label={`Editar ${practiceHead.fullName}`}
      >
        <Pencil className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        onClick={() => onDelete(practiceHead)}
        aria-label={`Eliminar ${practiceHead.fullName}`}
      >
        <Trash2 className="size-4" />
      </Button>
    </>
  );
}

function PracticeHeadContact({ practiceHead, compact = false }) {
  if (!practiceHead.email && !practiceHead.phone) {
    return null;
  }

  return (
    <div className={compact ? "flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1" : "shrink-0 space-y-1"}>
      {practiceHead.email && (
        <p className="flex min-w-0 items-center gap-2 text-muted-foreground">
          <Mail className="size-3.5 shrink-0" />
          <span className="truncate">{practiceHead.email}</span>
        </p>
      )}
      {practiceHead.phone && (
        <p className="flex items-center gap-2 text-muted-foreground">
          <Phone className="size-3.5 shrink-0" />
          <span className={compact ? "truncate" : undefined}>{practiceHead.phone}</span>
        </p>
      )}
    </div>
  );
}

function LabAssignments({ assignments, compact = false }) {
  if (!assignments?.length) {
    return null;
  }

  if (compact) {
    return (
      <p className="truncate text-xs text-muted-foreground">
        {assignments.map((assignment) => assignment.spaceName).join(" · ")}
      </p>
    );
  }

  return (
    <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
      {assignments.map((assignment) => (
        <li
          key={assignment.id ?? assignment.spaceId}
          className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1 text-xs"
        >
          <FlaskConical className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{assignment.spaceName}</span>
        </li>
      ))}
    </ul>
  );
}

function PracticeHeadCardGrid({ practiceHead, isAdmin, onEdit, onDelete }) {
  return (
    <Card className="flex h-72 flex-col overflow-hidden">
      <CardHeader className="grid shrink-0 auto-rows-min grid-cols-[auto_1fr] items-center gap-3 pb-2">
        <Avatar>
          <AvatarFallback>{getInitials(practiceHead.firstName, practiceHead.lastName)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <CardTitle className="truncate">{practiceHead.fullName}</CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden text-sm">
        <PracticeHeadContact practiceHead={practiceHead} />
        <LabAssignments assignments={practiceHead.labAssignments} />
      </CardContent>

      {isAdmin && (
        <CardFooter className="shrink-0 gap-2 border-t bg-muted/30">
          <PracticeHeadActions practiceHead={practiceHead} onEdit={onEdit} onDelete={onDelete} />
        </CardFooter>
      )}
    </Card>
  );
}

function PracticeHeadCardList({ practiceHead, isAdmin, onEdit, onDelete }) {
  return (
    <Card className="flex h-24 items-center overflow-hidden py-0">
      <div className="grid h-full w-full grid-cols-[minmax(0,220px)_minmax(0,1fr)_auto] items-center gap-4 px-4 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar size="lg" className="shrink-0">
            <AvatarFallback>{getInitials(practiceHead.firstName, practiceHead.lastName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate font-medium">{practiceHead.fullName}</p>
          </div>
        </div>

        <div className="min-w-0 space-y-1 text-sm">
          <PracticeHeadContact practiceHead={practiceHead} compact />
          <LabAssignments assignments={practiceHead.labAssignments} compact />
        </div>

        {isAdmin && (
          <div className="flex shrink-0 items-center gap-2">
            <PracticeHeadActions practiceHead={practiceHead} onEdit={onEdit} onDelete={onDelete} />
          </div>
        )}
      </div>
    </Card>
  );
}

function PracticeHeadCard({ practiceHead, viewMode = "grid", isAdmin, onEdit, onDelete }) {
  if (viewMode === "list") {
    return (
      <PracticeHeadCardList
        practiceHead={practiceHead}
        isAdmin={isAdmin}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );
  }

  return (
    <PracticeHeadCardGrid
      practiceHead={practiceHead}
      isAdmin={isAdmin}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
}

export default memo(PracticeHeadCard);
