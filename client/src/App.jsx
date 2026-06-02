import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { SocketProvider } from './context/SocketContext'
import { ToastProvider } from './context/ToastContext'
import { RefreshProvider } from './context/RefreshContext'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/ProtectedRoute'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import Dashboard from './pages/Dashboard'
import FAQBrowser from './pages/FAQBrowser'
import FAQDetail from './pages/FAQDetail'
import ChatBot from './pages/ChatBot'
import Profile from './pages/Profile'
import AdminPanel from './pages/AdminPanel'
import Notifications from './pages/Notifications'
import Sidebar from './components/Sidebar'
import Layout from './components/Layout'

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  return user ? <Navigate to="/dashboard" replace /> : children
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
            <RefreshProvider>
            <ErrorBoundary>

              {/* Sidebar — always rendered, works on every page including /faqs */}
              <Sidebar />

              <Routes>
                {/* Public auth pages — redirect if already signed in */}
                <Route path="/"         element={<PublicRoute><Landing /></PublicRoute>} />
                <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
                <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
                <Route path="/reset-password/:token" element={<ResetPassword />} />

                {/* FAQ pages — fully public, sidebar stays visible */}
                <Route path="/faqs"     element={<FAQBrowser />} />
                <Route path="/faqs/:id" element={<FAQDetail />} />

                {/* Protected app pages — layout provides Topbar + Outlet */}
                <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
                  <Route path="/dashboard"     element={<Dashboard />} />
                  <Route path="/chat"          element={<ChatBot />} />
                  <Route path="/profile"       element={<Profile />} />
                  <Route path="/admin"         element={<AdminPanel />} />
                  <Route path="/notifications" element={<Notifications />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
            </RefreshProvider>
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}