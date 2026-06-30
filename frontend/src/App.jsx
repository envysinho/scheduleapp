import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import Dashboard from "@/pages/Dashboard";
import Teachers from "@/pages/Teachers";
import Spaces from "@/pages/Spaces";
import Courses from "@/pages/Courses";
import Horarios from "@/pages/Horarios";
import Login from "@/pages/Login";
import Users from "@/pages/Users";
import Rules from "@/pages/Rules";

function AppContent() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if ((currentPage === "users" || currentPage === "rules") && !isAdmin) {
      setCurrentPage("dashboard");
    }
  }, [currentPage, isAdmin]);

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "teachers":
        return <Teachers />;
      case "courses":
        return <Courses />;
      case "spaces":
        return <Spaces />;
      case "rules":
        return isAdmin ? <Rules /> : <Dashboard />;
      case "users":
        return isAdmin ? <Users /> : <Dashboard />;
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
