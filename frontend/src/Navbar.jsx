import { Settings, Search, Bell, Menu, Sun, Moon } from 'lucide-react';

function Navbar({ toggleSidebar, isDark, onToggleTheme }) {
  return (
    <nav className="navbar">
      <div className="navbar-left">
        <button type="button" className="hamburger-btn" onClick={toggleSidebar}>
          <Menu size={24} />
        </button>
        <h2 className="navbar-title">Gestor de Horarios</h2>
      </div>

      <div className="navbar-center">
        <div className="search-container">
          <Search size={18} />
          <input
            type="text"
            placeholder="Buscar..."
            className="search-input"
          />
        </div>
      </div>

      <div className="navbar-right">
        <button type="button" className="notification-btn">
          <Bell size={22} />
          <span className="notification-badge">3</span>
        </button>
        <button
          type="button"
          className="theme-btn"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
          title={isDark ? 'Modo claro' : 'Modo oscuro'}
        >
          {isDark ? <Sun size={22} /> : <Moon size={22} />}
        </button>
        <button type="button" className="settings-btn">
          <Settings size={22} />
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
