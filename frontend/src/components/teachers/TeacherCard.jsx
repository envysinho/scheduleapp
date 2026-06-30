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
  getCourseCategoryLabel,
  getCycleLabel,
  getEmploymentTypeLabel,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

function getInitials(firstName, lastName) {
  const first = firstName?.charAt(0) ?? "";
  const last = lastName?.charAt(0) ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

function TeacherCard({ teacher, viewMode = "grid", isAdmin, onEdit, onDelete }) {
  const isList = viewMode === "list";

  return (
    <Card
      className={cn(
        "overflow-hidden",
        isList && "flex flex-row items-stretch"
      )}
    >
      <CardHeader
        className={cn(
          "pb-2",
          isList && "flex flex-row items-center gap-4 border-r pb-0"
        )}
      >
        <Avatar size={isList ? "lg" : "default"}>
          <AvatarFallback>{getInitials(teacher.firstName, teacher.lastName)}</AvatarFallback>
        </Avatar>
        <div className={cn("min-w-0", isList && "flex-1")}>
          <CardTitle className="truncate">{teacher.fullName}</CardTitle>
          <Badge variant="secondary" className="mt-1">
            {getEmploymentTypeLabel(teacher.employmentType)}
          </Badge>
        </div>
      </CardHeader>

      <CardContent
        className={cn(
          "flex flex-col gap-2 text-sm",
          isList && "flex-1 justify-center py-4"
        )}
      >
        {teacher.email && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Mail className="size-3.5 shrink-0" />
            <span className="truncate">{teacher.email}</span>
          </p>
        )}
        {teacher.phone && (
          <p className="flex items-center gap-2 text-muted-foreground">
            <Phone className="size-3.5 shrink-0" />
            <span>{teacher.phone}</span>
          </p>
        )}
        {teacher.assignments?.length > 0 && (
          <ul className="mt-1 space-y-1">
            {teacher.assignments.map((assignment) => (
              <li
                key={assignment.id ?? `${assignment.courseName}-${assignment.cycle}`}
                className="rounded-md bg-muted/50 px-2 py-1 text-xs"
              >
                <span className="font-medium">{assignment.courseName}</span>
                {" · "}
                {getCourseCategoryLabel(assignment.courseCategory)}
                {" · "}
                {getCycleLabel(assignment.cycle)}
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      {isAdmin && (
        <CardFooter
          className={cn(
            "gap-2 border-t bg-muted/30",
            isList && "flex-col justify-center border-t-0 border-l px-4"
          )}
        >
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
        </CardFooter>
      )}
    </Card>
  );
}

export default TeacherCard;
