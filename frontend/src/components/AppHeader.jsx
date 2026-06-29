import { Bell, Moon, Search, Settings, Sun } from "lucide-react";
import logo from "@/assets/images/logofi.png";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SidebarTrigger } from "@/components/ui/sidebar";

function AppHeader({ isDark, onToggleTheme }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1" />
      <img src={logo} alt="LOGO FI" className="size-8 object-contain shrink-0" />
      <span className="font-semibold shrink-0">admin</span>

      <div className="flex flex-1 items-center justify-center px-2 md:px-4">
        <div className="relative w-full max-w-xl">
          <Search className="absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Buscar aulas, docentes..."
            className="pl-8"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-1">
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
