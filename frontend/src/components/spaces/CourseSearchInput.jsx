import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { cn } from "@/lib/utils";
import { matchesSearchQuery } from "@/lib/search";

const MIN_QUERY_LENGTH = 1;

function CourseSearchInput({
  value,
  onSelect,
  disabled,
  courses = [],
  placeholder = "Buscar curso…",
  getLabel = (course) => course.name,
  getSecondary = (course) => course.code,
  inputId,
}) {
  const anchor = useComboboxAnchor();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filteredCourses = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return [];
    }
    return courses.filter((course) => matchesSearchQuery(getLabel(course), trimmed));
  }, [courses, query, getLabel]);

  const isValid = useMemo(() => {
    if (!value) {
      return true;
    }
    return courses.some((course) => getLabel(course) === getLabel(value));
  }, [courses, value, getLabel]);

  const showInvalid = !isValid;

  const handleInputValueChange = (nextValue) => {
    setQuery(nextValue);
    setOpen(nextValue.trim().length >= MIN_QUERY_LENGTH);
  };

  const handleValueChange = (course) => {
    if (!course) {
      return;
    }
    onSelect(course);
    setOpen(false);
  };

  const emptyMessage = (() => {
    if (query.trim().length < MIN_QUERY_LENGTH) {
      return "Escribe para buscar un curso…";
    }
    return "Sin resultados.";
  })();

  const courseItems = filteredCourses.map((course) => ({
    ...course,
    value: String(course.id),
    label: getLabel(course),
  }));

  return (
    <div className="flex flex-col gap-1.5">
      <div ref={anchor} className="relative w-full">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
        <Combobox
          items={courseItems}
          value={value}
          open={open}
          onOpenChange={setOpen}
          onValueChange={handleValueChange}
          onInputValueChange={handleInputValueChange}
          itemToStringLabel={getLabel}
          itemToStringValue={(item) => String(item.id)}
          filter={null}
        >
          <ComboboxInput
            id={inputId}
            type="search"
            placeholder={placeholder}
            className={cn("pl-8", showInvalid && "border-destructive focus-visible:ring-destructive/30")}
            showTrigger={false}
            disabled={disabled}
            aria-invalid={showInvalid || undefined}
          />
          <ComboboxContent anchor={anchor}>
            <ComboboxEmpty className="text-muted-foreground">
              {emptyMessage}
            </ComboboxEmpty>
            <ComboboxList>
              {(item) => (
                <ComboboxItem
                  key={item.value}
                  value={item}
                  className="flex flex-col items-start gap-0.5 py-2"
                >
                  <span className="text-sm font-medium">{getLabel(item)}</span>
                  <span className="text-xs text-muted-foreground">{getSecondary(item)}</span>
                </ComboboxItem>
              )}
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
      </div>
      {showInvalid && (
        <p className="text-xs text-destructive" role="alert">
          El curso no existe. Selecciona uno de la lista.
        </p>
      )}
    </div>
  );
}

export default CourseSearchInput;
