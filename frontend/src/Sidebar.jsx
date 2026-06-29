import logo from "./assets/images/logofi.png";
import { LayoutDashboard, GraduationCap, School } from "lucide-react";

function Sidebar({ isOpen, toggleSidebar, onNavigate }) {
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

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src={logo} alt="Logo FI" className="sidebar-logo" />

          <div className="sidebar-title">
            <span>Facultad de</span>
            <strong>Ingeniería</strong>
          </div>
        </div>

        <nav>
          <ul>
            <li>
              <a href="#dashboard" onClick={() => handleNavigation('dashboard')}>
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </a>
            </li>
            <li>
              <a href="#teachers" onClick={() => handleNavigation('teachers')}>
                <GraduationCap size={20} />
                <span>Docentes</span>
              </a>
            </li>
            <li>
              <a href="#classrooms" onClick={() => handleNavigation('classrooms')}>
                <School size={20} />
                <span>Aulas</span>
              </a>
            </li>
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
