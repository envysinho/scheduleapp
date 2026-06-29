import { useState } from "react";
import logo from "@/assets/images/logofi.png";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  School,
  CalendarDays,
  LogOut,
  ChevronDown,
  Users,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { CYCLES } from "@/pages/Horarios";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "teachers", icon: GraduationCap, label: "Docentes" },
  { id: "courses", icon: BookOpen, label: "Cursos" },
  { id: "classrooms", icon: School, label: "Aulas" },
];

function AppSidebar({ currentPage, onNavigate }) {
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const { isMobile, setOpenMobile } = useSidebar();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const handleNavigation = (page) => {
    onNavigate(page);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="overflow-hidden border-b border-sidebar-border">
        <div className="flex h-12 items-center gap-3 overflow-hidden px-2">
          <img src={logo} alt="Logo FI" className="size-10 shrink-0 object-contain" />
          <div className="min-w-0 overflow-hidden transition-[max-width] duration-200 ease-linear max-w-xs group-data-[collapsible=icon]:max-w-0">
            <div className="flex flex-col leading-tight transition-opacity duration-200 ease-linear opacity-100 group-data-[collapsible=icon]:opacity-0 group-data-[collapsible=icon]:delay-0 group-data-[state=expanded]:delay-200">
              <span className="whitespace-nowrap text-[10.3px] text-sidebar-foreground/70 tracking-normal">Universidad Nacional de Cañete</span>
              <strong className="whitespace-nowrap text-sm font-semibold">Facultad de Ingeniería</strong>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-y-0.5">
              {NAV_ITEMS.map(({ id, icon: Icon, label }) => (
                <SidebarMenuItem key={id}>
                  <SidebarMenuButton
                    isActive={currentPage === id}
                    tooltip={label}
                    onClick={() => handleNavigation(id)}
                  >
                    <Icon />
                    <span>{label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <Collapsible
                open={scheduleOpen}
                onOpenChange={setScheduleOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger render={<SidebarMenuButton tooltip="Horarios" />}>
                    <CalendarDays />
                    <span>Horarios</span>
                    <ChevronDown className="ml-auto transition-transform duration-200 group-data-[open]/collapsible:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {CYCLES.map(({ id, label }) => (
                        <SidebarMenuSubItem key={id}>
                          <SidebarMenuSubButton
                            render={<button type="button" />}
                            isActive={currentPage === `cycle${id}`}
                            onClick={() => handleNavigation(`cycle${id}`)}
                          >
                            {label}
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      ))}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {isAdmin && (
          <>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPage === "users"}
                  tooltip="Usuarios"
                  onClick={() => handleNavigation("users")}
                >
                  <Users />
                  <span>Usuarios</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <SidebarSeparator />
          </>
        )}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Cerrar sesión"
              className="text-red-400 hover:text-red-400 active:text-red-400"
              onClick={logout}
            >
              <LogOut />
              <span>Cerrar sesión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
