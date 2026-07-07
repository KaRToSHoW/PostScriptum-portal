import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import ToastProvider from './components/Toast'
import LoginPage          from './pages/LoginPage'
import DashboardPage      from './pages/DashboardPage'
import AdminFinancePage   from './pages/AdminFinancePage'
import AdminRolesPage     from './pages/AdminRolesPage'
import CalendarPage       from './pages/CalendarPage'
import HomeworkPage       from './pages/HomeworkPage'
import SubscriptionsPage  from './pages/SubscriptionsPage'
import ProfilePage        from './pages/ProfilePage'
import MessagesPage       from './pages/MessagesPage'
import TeachersPage       from './pages/TeachersPage'
import StudentsPage       from './pages/StudentsPage'
import AdminUsersPage     from './pages/AdminUsersPage'
import AdminReportsPage        from './pages/AdminReportsPage'
import AdminSubscriptionsPage  from './pages/AdminSubscriptionsPage'
import TeacherEarningsPage     from './pages/TeacherEarningsPage'
import ParentPage         from './pages/ParentPage'
import ConferencePage     from './pages/ConferencePage'
import OAuthCallbackPage  from './pages/OAuthCallbackPage'

/* Защищённый маршрут: если не авторизован — на логин */
function Protected({ children }) {
  const { isAuth } = useApp()
  const location   = useLocation()
  if (!isAuth) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

/* Маршрут только для роли ученика: админ/менеджер не могут быть учениками */
function StudentOnly({ children }) {
  const { isAuth, role } = useApp()
  const location = useLocation()
  if (!isAuth) return <Navigate to="/login" state={{ from: location }} replace />
  if (role === 'admin' || role === 'manager') return <Navigate to="/dashboard" replace />
  return children
}

/* Управление пользователями — только администратор, менеджеру недоступно */
function AdminOnly({ children }) {
  const { isAuth, role } = useApp()
  const location = useLocation()
  if (!isAuth) return <Navigate to="/login" state={{ from: location }} replace />
  if (role !== 'admin') return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/oauth/callback" element={<OAuthCallbackPage />} />

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
      <Route path="/homework" element={
        <StudentOnly><HomeworkPage /></StudentOnly>
      } />
      <Route path="/billing" element={
        <StudentOnly><SubscriptionsPage /></StudentOnly>
      } />
      <Route path="/profile" element={
        <Protected><ProfilePage /></Protected>
      } />
      <Route path="/messages" element={
        <Protected><MessagesPage /></Protected>
      } />
      <Route path="/teachers" element={
        <Protected><TeachersPage /></Protected>
      } />
      <Route path="/students" element={
        <Protected><StudentsPage /></Protected>
      } />
      <Route path="/admin/users" element={
        <AdminOnly><AdminUsersPage /></AdminOnly>
      } />
      <Route path="/admin/reports" element={
        <Protected><AdminReportsPage /></Protected>
      } />
      <Route path="/admin/subscriptions" element={
        <Protected><AdminSubscriptionsPage /></Protected>
      } />
      <Route path="/teacher/earnings" element={
        <Protected><TeacherEarningsPage /></Protected>
      } />
      <Route path="/children" element={
        <Protected><ParentPage /></Protected>
      } />
      <Route path="/conference" element={
        <Protected><ConferencePage /></Protected>
      } />
      <Route path="/conference/:lessonId" element={
        <Protected><ConferencePage /></Protected>
      } />
      <Route path="/settings" element={
        <Protected><ProfilePage /></Protected>
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
        <ToastProvider />
      </BrowserRouter>
    </AppProvider>
  )
}
