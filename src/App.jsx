import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext'
import ToastProvider from './components/Toast'
import ConfirmProvider from './components/ConfirmDialog'
import LoginPage          from './pages/LoginPage'

/*
  Страницы грузятся по требованию (отдельными чанками): при первом входе браузер скачивает
  только вход и общий каркас, а тяжёлые разделы — конференция (livekit-client),
  календарь, админка — подгружаются при переходе в них.
*/
const DashboardPage          = lazy(() => import('./pages/DashboardPage'))
const AdminFinancePage       = lazy(() => import('./pages/AdminFinancePage'))
const AdminRolesPage         = lazy(() => import('./pages/AdminRolesPage'))
const CalendarPage           = lazy(() => import('./pages/CalendarPage'))
const HomeworkPage           = lazy(() => import('./pages/HomeworkPage'))
const SubscriptionsPage      = lazy(() => import('./pages/SubscriptionsPage'))
const ProfilePage            = lazy(() => import('./pages/ProfilePage'))
const MessagesPage           = lazy(() => import('./pages/MessagesPage'))
const TeachersPage           = lazy(() => import('./pages/TeachersPage'))
const StudentsPage           = lazy(() => import('./pages/StudentsPage'))
const AdminUsersPage         = lazy(() => import('./pages/AdminUsersPage'))
const AdminReportsPage       = lazy(() => import('./pages/AdminReportsPage'))
const AdminSubscriptionsPage = lazy(() => import('./pages/AdminSubscriptionsPage'))
const TeacherEarningsPage    = lazy(() => import('./pages/TeacherEarningsPage'))
const ParentPage             = lazy(() => import('./pages/ParentPage'))
const ConferencePage         = lazy(() => import('./pages/ConferencePage'))
const ResetPasswordPage      = lazy(() => import('./pages/ResetPasswordPage'))
const OAuthCallbackPage      = lazy(() => import('./pages/OAuthCallbackPage'))
const LeadsPage              = lazy(() => import('./pages/LeadsPage'))

function PageLoader() {
  return (
    <div role="status" aria-live="polite" style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'var(--bg-cream)', color: 'var(--ink-muted)', fontSize: 14, fontWeight: 700 }}>
      Загрузка...
    </div>
  )
}

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

/* Абонементы: ученик (свои) и родитель (детей) */
function StudentOrParent({ children }) {
  const { isAuth, role } = useApp()
  const location = useLocation()
  if (!isAuth) return <Navigate to="/login" state={{ from: location }} replace />
  if (role !== 'student' && role !== 'parent') return <Navigate to="/dashboard" replace />
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

/* Заявки, роли и т.п. — админ и менеджер */
function StaffOnly({ children }) {
  const { isAuth, role } = useApp()
  const location = useLocation()
  if (!isAuth) return <Navigate to="/login" state={{ from: location }} replace />
  if (role !== 'admin' && role !== 'manager') return <Navigate to="/dashboard" replace />
  return children
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
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
      <Route path="/leads" element={
        <StaffOnly><LeadsPage /></StaffOnly>
      } />
      <Route path="/homework" element={
        <StudentOnly><HomeworkPage /></StudentOnly>
      } />
      <Route path="/billing" element={
        <StudentOrParent><SubscriptionsPage /></StudentOrParent>
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
    </Suspense>
  )
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastProvider />
        <ConfirmProvider />
      </BrowserRouter>
    </AppProvider>
  )
}
