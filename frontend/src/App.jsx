import { useState } from "react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import Dashboard from "@/pages/Dashboard";
import Teachers from "@/pages/Teachers";
import Classrooms from "@/pages/Classrooms";
import Courses from "@/pages/Courses";
import Horarios from "@/pages/Horarios";
import Login from "@/pages/Login";

function AppContent() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "teachers":
        return <Teachers />;
      case "courses":
        return <Courses />;
      case "classrooms":
        return <Classrooms />;
      default: {
        if (currentPage.startsWith("cycle")) {
          const cycle = Number.parseInt(currentPage.replace("cycle", ""), 10);
          if (cycle >= 1 && cycle <= 10) {
            return <Horarios cycle={cycle} />;
          }
        }
        return <Dashboard />;
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar currentPage={currentPage} onNavigate={setCurrentPage} />
        <SidebarInset>
          <AppHeader isDark={isDark} onToggleTheme={toggleTheme} />
          <div className="flex flex-1 flex-col gap-4 p-4">{renderPage()}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
