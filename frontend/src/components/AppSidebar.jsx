import { useState } from "react";
import logo from "@/assets/images/logofi.png";
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  School,
  CalendarDays,
  ChevronDown,
  ScrollText,
  Users,
} from "lucide-react";
import NavUser from "@/components/NavUser";
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
import { CYCLES } from "@/lib/constants";
import { useAuth } from "@/contexts/AuthContext";

const NAV_ITEMS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { id: "teachers", icon: GraduationCap, label: "Docentes" },
  { id: "courses", icon: BookOpen, label: "Cursos" },
  { id: "spaces", icon: School, label: "Ambientes" },
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

  const handleLogout = () => {
    logout();
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="overflow-hidden border-b border-sidebar-border">
        <div className="flex h-12 min-w-0 items-center gap-3 overflow-hidden px-2">
          <img src={logo} alt="Logo FI" className="size-10 shrink-0 object-contain" />
          <div className="min-w-0 flex-1 overflow-hidden transition-[opacity,max-width] duration-200 ease-linear group-data-[collapsible=icon]:max-w-0 group-data-[collapsible=icon]:opacity-0">
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[10.3px] text-sidebar-foreground/70 tracking-normal">
                Universidad Nacional de Cañete
              </span>
              <strong className="truncate text-sm font-semibold">Facultad de Ingeniería</strong>
            </div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="gap-2">
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
          <SidebarSeparator className="mx-0 !w-full" />
        </SidebarGroup>

        <SidebarGroup className="pt-0">
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
                  isActive={currentPage === "rules"}
                  tooltip="Reglas"
                  onClick={() => handleNavigation("rules")}
                >
                  <ScrollText />
                  <span>Reglas</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
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
            <SidebarSeparator className="mx-0 !w-full" />
          </>
        )}
        <NavUser user={user} onLogout={handleLogout} />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;
