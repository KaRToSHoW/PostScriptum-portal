import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import LoginPage        from './pages/LoginPage'
import DashboardPage    from './pages/DashboardPage'
import AdminFinancePage from './pages/AdminFinancePage'
import AdminRolesPage   from './pages/AdminRolesPage'
import CalendarPage     from './pages/CalendarPage'

/* Защищённый маршрут: если не авторизован — на логин */
function Protected({ children }) {
  const { isAuth } = useApp()
  const location   = useLocation()
  if (!isAuth) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route path="/dashboard" element={
        <Protected><DashboardPage /></Protected>
      } />
      <Route path="/calendar" element={
        <Protected><CalendarPage /></Protected>
      } />
      <Route path="/admin/finance" element={
        <Protected><AdminFinancePage /></Protected>
      } />
      <Route path="/admin/roles" element={
        <Protected><AdminRolesPage /></Protected>
      } />

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}
