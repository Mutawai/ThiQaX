import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import authService from '../../services/authService';

const Navbar = ({ toggleSidebar, user }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const notificationsRef = useRef(null);
  const navigate = useNavigate();

  // Handle logout
  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Format user name
  const userName = user ? `${user.firstName} ${user.lastName}` : 'User';
  
  // Placeholder notifications
  const notifications = [
    { id: 1, message: 'Your profile is 60% complete', read: false },
    { id: 2, message: 'New job matching your profile', read: false },
    { id: 3, message: 'Document verification pending', read: true },
  ];

  return (
    <nav className="sticky top-0 z-10 flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200 shadow-sm">
      {/* Left side - Mobile menu button and breadcrumb */}
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-2 mr-4 text-gray-600 rounded-md lg:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h16M4 18h16"
            ></path>
          </svg>
        </button>

        {/* Breadcrumb - can be made dynamic based on current route */}
        <div className="hidden md:flex">
          <span className="text-gray-600">Dashboard</span>
          {/* Add dynamic breadcrumb segments here */}
        </div>
      </div>

      {/* Right side - Notifications and user menu */}
      <div className="flex items-center space-x-4">
        {/* Notifications */}
        <div className="relative" ref={notificationsRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="p-2 text-gray-600 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              ></path>
            </svg>
            {notifications.some(n => !n.read) && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-4 h-4 text-xs text-white bg-red-500 rounded-full">
                {notifications.filter(n => !n.read).length}
              </span>
            )}
          </button>

          {/* Notifications dropdown */}
          {notificationsOpen && (
            <div className="absolute right-0 w-72 mt-2 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg">
              <div className="px-4 py-3">
                <p className="text-sm font-medium text-gray-900">Notifications</p>
              </div>
              <div className="py-1">
                {notifications.length > 0 ? (
                  notifications.map((notification) => (
                    <a
                      key={notification.id}
                      href="#"
                      className={`flex px-4 py-3 text-sm hover:bg-gray-100 ${
                        notification.read ? 'opacity-75' : 'font-semibold'
                      }`}
                    >
                      <span className="mr-2">🔔</span>
                      <span>{notification.message}</span>
                    </a>
                  ))
                ) : (
                  <p className="px-4 py-3 text-sm text-gray-500">No notifications</p>
                )}
              </div>
              <div className="py-1">
                <a
                  href="#"
                  className="block px-4 py-2 text-sm text-center text-blue-600 hover:bg-gray-100"
                >
                  View all notifications
                </a>
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-md p-1"
          >
            <div className="flex items-center justify-center w-8 h-8 text-white bg-blue-600 rounded-full">
              {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
            </div>
            <span className="hidden text-sm font-medium text-gray-700 md:block">
              {userName}
            </span>
            <svg
              className="w-5 h-5 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              ></path>
            </svg>
          </button>

          {/* Dropdown menu */}
          {dropdownOpen && (
            <div className="absolute right-0 w-48 mt-2 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg">
              <div className="px-4 py-3">
                <p className="text-sm">Signed in as</p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.email}
                </p>
              </div>
              <div className="py-1">
                <Link
                  to="/dashboard/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Your Profile
                </Link>
                <Link
                  to="/dashboard/settings"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Settings
                </Link>
              </div>
              <div className="py-1">
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-sm text-left text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
