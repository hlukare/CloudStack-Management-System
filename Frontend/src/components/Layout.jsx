import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, Server, Camera, Activity, DollarSign, 
  Bell, Zap, BarChart3, Settings, LogOut, Menu, X, Cloud, User
} from 'lucide-react';

export default function Layout() {
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  const navigation = [
    { name: 'Dashboard', to: '/' },
    { name: 'Virtual Machines', to: '/vms' },
    { name: 'AWS Virtual Machines', to: '/aws-vms' },
    { name: 'Azure Virtual Machines', to: '/azure-vms' },
    { name: 'GCP Virtual Machines', to: '/gcp-vms' },
    { name: 'Snapshots', to: '/snapshots' },
    { name: 'Monitoring', to: '/monitoring' },
    { name: 'Cost Analysis', to: '/costs' },
    { name: 'Alerts', to: '/alerts' },
    { name: 'Automation', to: '/automation' },
    { name: 'Analytics', to: '/analytics' },
    { name: 'Settings', to: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Government Header */}
      <div className="bg-white border-b-4 border-orange-500">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 py-1"></div>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-900 rounded-full flex items-center justify-center">
                <Server className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800" style={{letterSpacing: '0.5px'}}>CloudStack Management System</h1>
                <p className="text-sm text-gray-600">Enterprise Cloud Operations</p>
              </div>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700">{user?.username}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="px-4 py-2 text-sm bg-red-600 text-white hover:bg-red-700 transition-colors"
                style={{border: '1px solid #b91c1c'}}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="bg-blue-900 border-b-2 border-blue-950">
        <div className="container mx-auto px-4">
          <div className="hidden lg:flex space-x-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-medium transition-colors border-b-4 ${
                    isActive
                      ? 'bg-blue-800 text-white border-orange-500'
                      : 'text-blue-100 hover:bg-blue-800 hover:text-white border-transparent'
                  }`
                }
              >
                {item.name}
              </NavLink>
            ))}
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-40 bg-blue-900 border-b-2 border-blue-950">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => setSidebarOpen(true)} className="p-2 text-white">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-sm font-bold text-white">Cloud Management</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-blue-900 text-white transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:hidden`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-blue-800">
          <h2 className="text-lg font-bold">Menu</h2>
          <button onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="py-4">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                `block px-4 py-3 text-sm border-l-4 ${
                  isActive
                    ? 'bg-blue-800 text-white border-orange-500 font-medium'
                    : 'text-blue-100 hover:bg-blue-800 border-transparent'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              {item.name}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-blue-800">
          <div className="flex items-center mb-3 text-sm">
            <User className="w-8 h-8 mr-2" />
            <div>
              <p className="font-medium">{user?.username}</p>
              <p className="text-xs text-blue-200">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full px-4 py-2 text-sm bg-red-600 hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="bg-gray-50 min-h-screen">
        <main className="container mx-auto px-4 py-6">
          <Outlet />
        </main>
      </div>

      {/* Footer */}
      <div className="bg-blue-900 text-white py-6 border-t-4 border-orange-500">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm">
            <div>
              <p className="font-medium">CloudStack Management System</p>
              <p className="text-blue-200 text-xs mt-1">Professional Cloud Infrastructure Management Platform</p>
            </div>
            <div className="mt-4 md:mt-0 text-blue-200 text-xs">
              <p>Version 1.0.0 | Last Updated: December 2025</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
