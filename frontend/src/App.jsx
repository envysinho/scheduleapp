import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useTheme } from './hooks/useTheme';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Classrooms from './pages/Classrooms';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'teachers':
        return <Teachers />;
      case 'classrooms':
        return <Classrooms />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Navbar toggleSidebar={toggleSidebar} isDark={isDark} onToggleTheme={toggleTheme} />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} onNavigate={setCurrentPage} />
      <main className="app">
        {renderPage()}
      </main>
    </>
  );
}

export default App;
