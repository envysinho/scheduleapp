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
        <nav>
          <ul>
            <li><a href="#dashboard" onClick={() => handleNavigation('dashboard')}>Dashboard</a></li>
            <li><a href="#teachers" onClick={() => handleNavigation('teachers')}>Docentes</a></li>
            <li><a href="#classrooms" onClick={() => handleNavigation('classrooms')}>Aulas</a></li>
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
