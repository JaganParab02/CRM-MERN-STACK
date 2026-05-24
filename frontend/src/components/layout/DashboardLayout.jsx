import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useStore } from '../../store/useStore';
import { cn } from '../../lib/utils';

export default function DashboardLayout() {
  const { isSidebarOpen } = useStore();

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div 
        className={cn(
          "flex-1 flex flex-col transition-all duration-300 ease-in-out",
          isSidebarOpen ? "md:ml-[260px]" : "md:ml-[80px]"
        )}
      >
        <TopBar />
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
