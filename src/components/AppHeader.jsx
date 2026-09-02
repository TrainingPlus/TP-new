import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Users, BookOpen, GraduationCap, Home as HomeIcon } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { cn } from '@/lib/utils';

export default function AppHeader() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role || 'employee';

  const navItems = [];
  if (role === 'admin' || role === 'manager') {
    navItems.push(
      { label: 'Manager', path: '/manager', icon: HomeIcon },
      { label: 'Directory', path: '/directory', icon: GraduationCap },
      { label: 'Employees', path: '/manager?tab=employees', icon: Users },
      { label: 'Courses', path: '/manager?tab=courses', icon: BookOpen }
    );
  } else if (role === 'operator') {
    navItems.push(
      { label: 'Operator', path: '/operator', icon: HomeIcon },
      { label: 'Directory', path: '/directory', icon: GraduationCap },
      { label: 'Courses', path: '/operator?tab=courses', icon: BookOpen }
    );
  } else {
    navItems.push(
      { label: 'Directory', path: '/directory', icon: GraduationCap }
    );
  }

  const handleLogout = () => {
    logout();
  };

  const isActive = (path) => {
    const base = path.split('?')[0];
    return location.pathname === base;
  };

  return (
    <header className="bg-primary text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="w-9 h-9 rounded-full bg-white/15 border border-white/30 flex items-center justify-center">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-semibold text-sm sm:text-base hidden sm:block">
            Training Plus Institute
          </span>
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.path}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border transition-colors whitespace-nowrap',
                  isActive(item.path)
                    ? 'bg-white text-primary border-white'
                    : 'bg-white/10 border-white/30 hover:bg-white/25'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium border bg-white/10 border-white/30 hover:bg-destructive transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
