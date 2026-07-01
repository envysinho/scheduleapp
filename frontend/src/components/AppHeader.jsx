import { useState } from "react";
import { Bell, Moon, Settings, Sun } from "lucide-react";
import GlobalSearch from "@/components/GlobalSearch";
import logo from "@/assets/images/logofi.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import { SidebarTrigger } from "@/components/ui/sidebar";

const SEMESTER_OPTIONS = ["Semestre 26-I", "Semestre 26-II"];

function AppHeader({ isDark, onToggleTheme, onSearchSelect }) {
  const [semester, setSemester] = useState(SEMESTER_OPTIONS[0]);
  const semesterAnchor = useComboboxAnchor();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <span className="font-semibold shrink-0">Gestor de Horarios</span>

      <div className="flex flex-1 items-center justify-center px-2 md:px-4">
        <GlobalSearch onSelect={onSearchSelect} />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div ref={semesterAnchor} className="w-[170px]">
          <Combobox
            items={SEMESTER_OPTIONS}
            value={semester}
            onValueChange={setSemester}
          >
            <ComboboxInput
              id="header-semester"
              placeholder="Semestre"
              readOnly
              aria-label="Semestre"
            />
            <ComboboxContent anchor={semesterAnchor}>
              <ComboboxEmpty>Sin opciones.</ComboboxEmpty>
              <ComboboxList>
                {(label) => (
                  <ComboboxItem key={label} value={label}>
                    {label}
                  </ComboboxItem>
                )}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
        <Button variant="ghost" size="icon" className="relative">
          <Bell />
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 size-4 justify-center p-0 text-[10px]"
          >
            3
          </Badge>
          <span className="sr-only">Notificaciones</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          title={isDark ? "Modo claro" : "Modo oscuro"}
        >
          {isDark ? <Sun /> : <Moon />}
        </Button>
        <Button variant="ghost" size="icon">
          <Settings />
          <span className="sr-only">Configuración</span>
        </Button>
      </div>
    </header>
  );
}

export default AppHeader;
