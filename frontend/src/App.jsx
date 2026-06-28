import { useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Classrooms from './pages/Classrooms';

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <Navbar toggleSidebar={toggleSidebar} />
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} onNavigate={setCurrentPage} />
      <main className="app">
        {renderPage()}
      </main>
    </>
  );
}

export default App;
