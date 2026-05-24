import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from 'react-hot-toast';

import DashboardLayout from './components/layout/DashboardLayout';

import LoginPage from './pages/LoginPage';
import LeadsPage from './pages/LeadsPage';
import PipelinePage from './pages/PipelinePage';
import DashboardPage from './pages/DashboardPage';
import TeamPage from './pages/TeamPage';
import UsersPage from './pages/UsersPage';
import TasksPage from './pages/TasksPage';
import GoalsPage from './pages/GoalsPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <Router>
      <Toaster position="top-right" toastOptions={{ duration: 3000, className: 'dark:bg-card dark:text-foreground dark:border dark:border-border' }} />
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route path="/leads" element={<LeadsPage />} />
          <Route path="/pipeline" element={<PipelinePage />} />
          <Route path="/tasks" element={<TasksPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Route>
        
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl font-bold mb-4">404</h1>
                <p className="text-gray-600 mb-6">Page not found</p>
                <a href="/leads" className="text-primary hover:underline">
                  Go back to leads
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}
