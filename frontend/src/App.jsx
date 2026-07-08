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
import PracticeHeads from "@/pages/PracticeHeads";
import Users from "@/pages/Users";
import Rules from "@/pages/Rules";
import Semesters from "@/pages/Semesters";

const PAGE_BY_SEARCH_TYPE = {
  teacher: "teachers",
  space: "spaces",
  course: "courses",
};

function AppContent() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [searchFilter, setSearchFilter] = useState(null);
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  useEffect(() => {
    if (
      (currentPage === "users" ||
        currentPage === "rules" ||
        currentPage === "semesters") &&
      !isAdmin
    ) {
      setCurrentPage("dashboard");
    }
  }, [currentPage, isAdmin]);

  const handleNavigate = (page) => {
    if (searchFilter) {
      const expectedPage = PAGE_BY_SEARCH_TYPE[searchFilter.type];
      if (page !== expectedPage) {
        setSearchFilter(null);
      }
    }
    setCurrentPage(page);
  };

  const handleSearchSelect = (filter) => {
    setSearchFilter(filter);
    setCurrentPage(PAGE_BY_SEARCH_TYPE[filter.type]);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <Dashboard />;
      case "teachers":
        return (
          <Teachers
            searchFilter={searchFilter}
            onClearSearchFilter={() => setSearchFilter(null)}
          />
        );
      case "courses":
        return (
          <Courses
            searchFilter={searchFilter}
            onClearSearchFilter={() => setSearchFilter(null)}
          />
        );
      case "spaces":
        return (
          <Spaces
            searchFilter={searchFilter}
            onClearSearchFilter={() => setSearchFilter(null)}
          />
        );
      case "practiceHeads":
        return <PracticeHeads />;
      case "rules":
        return isAdmin ? <Rules /> : <Dashboard />;
      case "semesters":
        return isAdmin ? <Semesters /> : <Dashboard />;
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
        <AppSidebar currentPage={currentPage} onNavigate={handleNavigate} />
        <SidebarInset>
          <AppHeader
            isDark={isDark}
            onToggleTheme={toggleTheme}
            onSearchSelect={handleSearchSelect}
          />
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
