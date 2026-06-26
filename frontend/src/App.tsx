import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';

// Import Pages
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { KnowledgeHub } from './pages/KnowledgeHub';
import { GitQuery } from './pages/GitQuery';
import { WikiQuery } from './pages/WikiQuery';
import { AIAssistant } from './pages/AIAssistant';
import { Contribute } from './pages/Contribute';
import { Feed } from './pages/Feed';
import { Analytics } from './pages/Analytics';
import { AdminConsole } from './pages/AdminConsole';
import { Settings } from './pages/Settings';

// Protected Route wrapper component
const ProtectedRoute: React.FC<{ children: React.ReactNode; requiredRole?: string }> = ({ 
  children, 
  requiredRole 
}) => {
  const { token, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-bg-dark text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold tracking-wider">LOADING NEXUS AI...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-bg-dark">
      <Sidebar />
      <div className="flex flex-col flex-1 pl-64 overflow-hidden h-full">
        <Header />
        <main className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </main>
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Workspace Layout Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/knowledge" element={
            <ProtectedRoute>
              <KnowledgeHub />
            </ProtectedRoute>
          } />
          <Route path="/gitquery" element={
            <ProtectedRoute>
              <GitQuery />
            </ProtectedRoute>
          } />
          <Route path="/wikiquery" element={
            <ProtectedRoute>
              <WikiQuery />
            </ProtectedRoute>
          } />
          <Route path="/chat" element={
            <ProtectedRoute>
              <AIAssistant />
            </ProtectedRoute>
          } />
          <Route path="/contribute" element={
            <ProtectedRoute>
              <Contribute />
            </ProtectedRoute>
          } />
          <Route path="/feed" element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          } />
          <Route path="/trending" element={
            <ProtectedRoute>
              <Feed forceTrending={true} />
            </ProtectedRoute>
          } />
          <Route path="/bookmarks" element={
            <ProtectedRoute>
              <Feed forceBookmarks={true} />
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="Admin">
              <AdminConsole />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } />

          {/* Fallback to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
