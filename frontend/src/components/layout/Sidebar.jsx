import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Target, 
  Settings, 
  BarChart3,
  LogOut
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

export default function Sidebar() {
  const { isSidebarOpen, user } = useStore();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', adminOnly: false },
    { name: 'Leads', icon: Target, path: '/leads', adminOnly: false },
    { name: 'Pipeline', icon: BarChart3, path: '/pipeline', adminOnly: false },
    { name: 'Tasks', icon: LayoutDashboard, path: '/tasks', adminOnly: false },
    { name: 'Goals', icon: Target, path: '/goals', adminOnly: false },
    { name: 'Team', icon: Users, path: '/team', adminOnly: true },
    { name: 'Users', icon: Settings, path: '/users', adminOnly: true },
  ];

  const filteredNav = navItems.filter(item => !item.adminOnly || user?.role === 'admin');

  return (
    <motion.aside
      initial={false}
      animate={{ 
        width: isSidebarOpen ? '260px' : '80px',
        transition: { duration: 0.3, ease: 'easeInOut' }
      }}
      className="fixed left-0 top-0 z-40 h-screen border-r bg-card flex flex-col hidden md:flex"
    >
      <div className="h-16 flex items-center justify-center border-b border-border">
        <div className="flex items-center gap-2 overflow-hidden px-4">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-primary-foreground" />
          </div>
          {isSidebarOpen && (
            <motion.span 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-xl font-bold tracking-tight whitespace-nowrap"
            >
              BDA CRM
            </motion.span>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-3 space-y-2">
        {filteredNav.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          return (
            <Link
              key={item.name}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors group relative",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
              {isSidebarOpen && (
                <span className="font-medium whitespace-nowrap">{item.name}</span>
              )}
              {!isSidebarOpen && (
                <div className="absolute left-full ml-4 rounded-md bg-popover px-2 py-1 text-sm text-popover-foreground opacity-0 shadow-md group-hover:opacity-100 pointer-events-none z-50 whitespace-nowrap">
                  {item.name}
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-border mt-auto">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors group"
        >
          <LogOut className="w-5 h-5 flex-shrink-0 group-hover:text-destructive" />
          {isSidebarOpen && <span className="font-medium whitespace-nowrap">Logout</span>}
        </button>
      </div>
    </motion.aside>
  );
}
