import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

const Layout = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const allMenuItems = [
  { icon: '📊', label: 'Dashboard', path: '/dashboard', roles: ['admin', 'teacher', 'student', 'parent'] },
  { icon: '👨‍🎓', label: 'Students', path: '/students', roles: ['admin', 'teacher'] },
  { icon: '👨‍🏫', label: 'Teachers', path: '/teachers', roles: ['admin'] },
  { icon: '👨‍👩‍👧‍👦', label: 'Parents', path: '/parents', roles: ['admin'] },
  { icon: '💰', label: 'Fees', path: '/fees', roles: ['admin', 'parent'] },
  { icon: '📝', label: 'Attendance', path: '/attendance', roles: ['admin', 'teacher', 'student', 'parent'] },
  { icon: '📊', label: 'Grades', path: '/grades', roles: ['admin', 'teacher', 'student', 'parent'] },
  { icon: '📅', label: 'Timetable', path: '/timetable', roles: ['admin', 'teacher', 'student'] },
  { icon: '📢', label: 'Announcements', path: '/announcements', roles: ['admin', 'teacher', 'student', 'parent'] },
  { icon: '📈', label: 'Reports', path: '/reports', roles: ['admin'] },
];

// Filter menu items based on user role
const menuItems = allMenuItems.filter(item => 
  !item.roles || item.roles.includes(user.role)
);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* Sidebar */}
      <aside
        className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-primary text-white transition-all duration-300 fixed h-full z-20 shadow-lg`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-14 border-b border-blue-700">
          <span className={`${sidebarOpen ? 'text-xl font-bold' : 'text-2xl'} transition-all`}>
            {sidebarOpen ? theme.schoolName : 'S'}
          </span>
        </div>

        {/* Navigation */}
        <nav className="mt-6">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className="w-full flex items-center px-4 py-3 hover:bg-blue-700 transition duration-200"
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="ml-3">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="absolute bottom-0 w-full border-t border-blue-700 p-3">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold">
                {user.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            {sidebarOpen && (
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium">{user.full_name || 'User'}</p>
                <p className="text-xs text-blue-300 capitalize">{user.role || 'user'}</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full mt-3 text-sm text-blue-300 hover:text-white transition"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`flex-1 ${sidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
        {/* Top Bar */}
        <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
          <button
            onClick={toggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">{user.full_name || 'User'}</span>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white">
              {user.full_name?.charAt(0) || 'U'}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;