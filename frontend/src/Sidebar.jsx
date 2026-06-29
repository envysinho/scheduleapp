import { useState } from "react";
import logo from "./assets/images/logofi.png";

import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  School,
  CalendarDays,
  LogOut,
  ChevronDown,
} from "lucide-react";

function Sidebar({ isOpen, toggleSidebar, onNavigate }) {
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const handleNavigation = (page) => {
    onNavigate(page);
    toggleSidebar();
  };

  return (
    <>
      {isOpen && (
        <div
          className="overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) toggleSidebar();
          }}
        />
      )}

      <aside className={`sidebar ${isOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <img src={logo} alt="Logo FI" className="sidebar-logo" />

          <div className="sidebar-title">
            <span>Facultad de</span>
            <strong>Ingeniería</strong>
          </div>
        </div>

        <nav>
          {/* Menú principal */}
          <ul>
            <li>
              <a
                href="#dashboard"
                onClick={() => handleNavigation("dashboard")}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </a>
            </li>

            <li>
              <a
                href="#teachers"
                onClick={() => handleNavigation("teachers")}
              >
                <GraduationCap size={20} />
                <span>Docentes</span>
              </a>
            </li>

            <li>
              <a
                href="#courses"
                onClick={() => handleNavigation("courses")}
              >
                <BookOpen size={20} />
                <span>Cursos</span>
              </a>
            </li>

            <li>
              <a
                href="#classrooms"
                onClick={() => handleNavigation("classrooms")}
              >
                <School size={20} />
                <span>Aulas</span>
              </a>
            </li>
          </ul>

          <div className="sidebar-divider" />

          {/* Horarios */}
          <button
            className="sidebar-dropdown"
            onClick={() => setScheduleOpen(!scheduleOpen)}
          >
            <span className="sidebar-dropdown-label">
              <CalendarDays size={20} />
              <span>Horarios</span>
            </span>
            <ChevronDown
              size={18}
              className={`sidebar-dropdown-chevron${scheduleOpen ? " rotate" : ""}`}
            />
          </button>

          {scheduleOpen && (
            <ul className="submenu">
              <li><a href="#cycle1" onClick={() => handleNavigation("cycle1")}>Ciclo I</a></li>
              <li><a href="#cycle2" onClick={() => handleNavigation("cycle2")}>Ciclo II</a></li>
              <li><a href="#cycle3" onClick={() => handleNavigation("cycle3")}>Ciclo III</a></li>
              <li><a href="#cycle4" onClick={() => handleNavigation("cycle4")}>Ciclo IV</a></li>
              <li><a href="#cycle5" onClick={() => handleNavigation("cycle5")}>Ciclo V</a></li>
              <li><a href="#cycle6" onClick={() => handleNavigation("cycle6")}>Ciclo VI</a></li>
              <li><a href="#cycle7" onClick={() => handleNavigation("cycle7")}>Ciclo VII</a></li>
              <li><a href="#cycle8" onClick={() => handleNavigation("cycle8")}>Ciclo VIII</a></li>
              <li><a href="#cycle9" onClick={() => handleNavigation("cycle9")}>Ciclo IX</a></li>
              <li><a href="#cycle10" onClick={() => handleNavigation("cycle10")}>Ciclo X</a></li>
            </ul>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-divider" />

          <ul>
            <li>
              <a href="#logout">
                <LogOut size={20} />
                <span>Cerrar sesión</span>
              </a>
            </li>
          </ul>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;