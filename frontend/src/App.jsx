import { useEffect, useState } from "react";
import AppHeader from "@/components/AppHeader";
import AppSidebar from "@/components/AppSidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SemesterProvider, useSemester } from "@/contexts/SemesterContext";
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
import {
  canManageUsers,
  canViewPracticeHeads,
  isOwner,
  isStudent,
} from "@/lib/permissions";

const PAGE_BY_SEARCH_TYPE = {
  teacher: "teachers",
  practiceHead: "practiceHeads",
  space: "spaces",
  course: "courses",
};

function AppContent() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [searchFilter, setSearchFilter] = useState(null);
  const { isDark, toggleTheme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const { semester } = useSemester();
  const owner = isOwner(user);
  const canOpenUsers = canManageUsers(user);
  const studentCyclePage = isStudent(user) && user?.assignedCycle
    ? `cycle${user.assignedCycle}`
    : null;

  useEffect(() => {
    if (
      currentPage === "rules" &&
      !owner
    ) {
      setCurrentPage("dashboard");
    }
    if (currentPage === "semesters" && !owner) {
      setCurrentPage("dashboard");
    }
    if (currentPage === "users" && !canOpenUsers) {
      setCurrentPage("dashboard");
    }
    if (currentPage === "practiceHeads" && !canViewPracticeHeads(user)) {
      setCurrentPage("dashboard");
    }
    if (studentCyclePage && currentPage.startsWith("cycle") && currentPage !== studentCyclePage) {
      setCurrentPage(studentCyclePage);
    }
  }, [currentPage, owner, canOpenUsers, user, studentCyclePage]);

  useEffect(() => {
    setSearchFilter(null);
  }, [semester]);

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
        return canViewPracticeHeads(user) ? (
          <PracticeHeads
            searchFilter={searchFilter}
            onClearSearchFilter={() => setSearchFilter(null)}
          />
        ) : <Dashboard />;
      case "rules":
        return owner ? <Rules /> : <Dashboard />;
      case "semesters":
        return owner ? <Semesters /> : <Dashboard />;
      case "users":
        return canOpenUsers ? <Users /> : <Dashboard />;
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
      <SemesterProvider>
        <AppContent />
      </SemesterProvider>
    </AuthProvider>
  );
}

export default App;
