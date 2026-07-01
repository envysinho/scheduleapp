import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxInput,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { useAuth } from "@/contexts/AuthContext";
import { listCourses, listSpaces, listTeachers } from "@/lib/api";
import { filterSearchItems } from "@/lib/search";

const SEARCH_GROUPS = ["Docentes", "Ambientes", "Cursos"];
const MIN_QUERY_LENGTH = 3;
const DEBOUNCE_MS = 250;

function buildSearchItems(teachers, spaces, courses) {
  const teacherItems = teachers.map((teacher) => ({
    value: `teacher:${teacher.id}`,
    type: "teacher",
    id: teacher.id,
    label: teacher.fullName,
    group: "Docentes",
  }));

  const spaceItems = spaces.map((space) => ({
    value: `space:${space.id}`,
    type: "space",
    id: space.id,
    label: space.name,
    group: "Ambientes",
  }));

  const courseItems = courses.map((course) => ({
    value: `course:${course.id}`,
    type: "course",
    id: course.id,
    label: course.name,
    group: "Cursos",
  }));

  return [...teacherItems, ...spaceItems, ...courseItems];
}

function GlobalSearch({ onSelect }) {
  const { logout } = useAuth();
  const anchor = useComboboxAnchor();
  const cacheRef = useRef(null);
  const debounceRef = useRef(null);
  const firstMatchRef = useRef(null);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleUnauthorized = useCallback(() => {
    logout();
  }, [logout]);

  const loadItems = useCallback(async () => {
    if (cacheRef.current) {
      setItems(cacheRef.current);
      return;
    }

    setIsLoading(true);

    try {
      const [teachers, spaces, courses] = await Promise.all([
        listTeachers({}, handleUnauthorized),
        listSpaces({}, handleUnauthorized),
        listCourses({}, handleUnauthorized),
      ]);
      const built = buildSearchItems(teachers, spaces, courses);
      cacheRef.current = built;
      setItems(built);
    } catch {
      cacheRef.current = null;
    } finally {
      setIsLoading(false);
    }
  }, [handleUnauthorized]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const trimmedQuery = query.trim();
  const showSuggestions = trimmedQuery.length >= MIN_QUERY_LENGTH;

  const filteredItems = useMemo(() => {
    if (!showSuggestions) {
      return [];
    }
    return filterSearchItems(items, trimmedQuery);
  }, [items, trimmedQuery, showSuggestions]);

  firstMatchRef.current = filteredItems[0] ?? null;

  const groupedItems = useMemo(
    () =>
      SEARCH_GROUPS.map((group) => ({
        label: group,
        items: filteredItems.filter((item) => item.group === group),
      })).filter((group) => group.items.length > 0),
    [filteredItems]
  );

  const handleInputValueChange = (value) => {
    setQuery(value);
    const nextTrimmed = value.trim();

    if (nextTrimmed.length < MIN_QUERY_LENGTH) {
      setOpen(false);
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      return;
    }

    setOpen(true);

    if (cacheRef.current) {
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      loadItems();
    }, DEBOUNCE_MS);
  };

  const selectItem = (item) => {
    if (!item) {
      return;
    }

    onSelect({
      type: item.type,
      id: item.id,
      label: item.label,
    });
    setQuery("");
    setOpen(false);
    setResetKey((current) => current + 1);
  };

  const handleValueChange = (item) => {
    selectItem(item);
  };

  const handleInputKeyDown = (event) => {
    if (event.key !== "Enter" || event.defaultPrevented) {
      return;
    }

    const match = firstMatchRef.current;
    if (!match) {
      return;
    }

    event.preventDefault();
    selectItem(match);
  };

  const emptyMessage = (() => {
    if (trimmedQuery.length < MIN_QUERY_LENGTH) {
      return `Escribe al menos ${MIN_QUERY_LENGTH} caracteres…`;
    }
    if (isLoading) {
      return "Buscando…";
    }
    return "Sin resultados.";
  })();

  return (
    <div ref={anchor} className="relative w-full max-w-xl">
      <Search className="pointer-events-none absolute top-1/2 left-2.5 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
      <Combobox
        key={resetKey}
        items={filteredItems}
        value={null}
        open={open && showSuggestions}
        onOpenChange={setOpen}
        onValueChange={handleValueChange}
        onInputValueChange={handleInputValueChange}
        itemToStringValue={(item) => item.label}
        filter={null}
      >
        <ComboboxInput
          id="global-search"
          type="search"
          placeholder="Buscar docentes, ambientes, cursos…"
          aria-label="Búsqueda global"
          className="pl-8"
          showTrigger={false}
          onKeyDown={handleInputKeyDown}
        />
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty className="text-muted-foreground">
            {emptyMessage}
          </ComboboxEmpty>
          <ComboboxList>
            {groupedItems.map((group) => (
              <ComboboxGroup key={group.label} items={group.items}>
                <ComboboxLabel>{group.label}</ComboboxLabel>
                <ComboboxCollection>
                  {(item) => (
                    <ComboboxItem
                      key={item.value}
                      value={item}
                      className="text-muted-foreground data-highlighted:text-accent-foreground"
                    >
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
              </ComboboxGroup>
            ))}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  );
}

export default GlobalSearch;
