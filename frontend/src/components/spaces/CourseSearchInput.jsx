import { useEffect, useMemo, useRef, useState } from "react";
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
import { matchesSearchQuery } from "@/lib/search";

const MIN_QUERY_LENGTH = 1;

function CourseSearchInput({ value, onChange, disabled, courses = [] }) {
  const anchor = useComboboxAnchor();
  const [query, setQuery] = useState(value ?? "");
  const [open, setOpen] = useState(false);
  const selectedByUserRef = useRef(false);

  useEffect(() => {
    if (!selectedByUserRef.current) {
      setQuery(value ?? "");
    }
    selectedByUserRef.current = false;
  }, [value]);

  const filteredCourses = useMemo(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LENGTH) {
      return [];
    }
    return courses.filter((course) => matchesSearchQuery(course.name, trimmed));
  }, [courses, query]);

  const handleInputValueChange = (nextValue) => {
    setQuery(nextValue);
    onChange(nextValue);
    setOpen(nextValue.trim().length >= MIN_QUERY_LENGTH);
  };

  const handleValueChange = (course) => {
    if (!course) {
      return;
    }
    selectedByUserRef.current = true;
    setQuery(course.name);
    onChange(course.name);
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
    label: course.name,
  }));

  return (
    <div ref={anchor} className="relative w-full">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Combobox
        items={courseItems}
        value={null}
        inputValue={query}
        open={open}
        onOpenChange={setOpen}
        onValueChange={handleValueChange}
        onInputValueChange={handleInputValueChange}
        itemToStringValue={(item) => item.label}
        filter={null}
      >
        <ComboboxInput
          id={`course-search-${value}`}
          type="search"
          placeholder="Buscar curso…"
          className="pl-8"
          showTrigger={false}
          disabled={disabled}
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
                <span className="text-sm font-medium">{item.name}</span>
                <span className="text-xs text-muted-foreground">{item.code}</span>
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export default CourseSearchInput;
