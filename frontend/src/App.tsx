import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { SidebarProvider } from '@/contexts/SidebarContext'
import { WorkspaceProvider } from '@/contexts/WorkspaceContext'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { getDefaultRouteByRole } from '@/lib/routeUtils'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { ForgotPasswordOtpPage } from '@/pages/auth/ForgotPasswordOtpPage'
import { ResetPasswordPage } from '@/pages/auth/ResetPasswordPage'
import { OAuth2CallbackPage } from '@/pages/auth/OAuth2CallbackPage'
import { TermsAndPrivacyPage } from '@/pages/auth/TermsAndPrivacyPage'
import { RevenueDashboard } from '@/pages/dashboard/RevenueDashboard'
import { RecordsPage } from '@/pages/records/RecordsPage'
import { RecoveryWorkspace } from '@/pages/recovery/RecoveryWorkspace'
import { RecoveryCaseDetail } from '@/pages/recovery/RecoveryCaseDetail'
import { RevenueInsights } from '@/pages/insights/RevenueInsights'
import { PoliciesControl } from '@/pages/policies/PoliciesControl'
import { AuditPage } from '@/pages/audit/AuditPage'
import { WorkspaceMembersPage } from '@/pages/workspace/WorkspaceMembersPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'

function RoleRedirect() {
  const { isAuthenticated, isReady } = useAuth()

  if (!isReady) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={getDefaultRouteByRole()} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />

      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordOtpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* OAuth2 Callback - No layout needed */}
      <Route path="/oauth2/callback" element={<OAuth2CallbackPage />} />
      
      {/* Terms and Privacy - No layout needed */}
      <Route path="/terms-and-privacy" element={<TermsAndPrivacyPage />} />

      <Route
        path="/app"
        element={
          <ProtectedRoute allowedRoles={['VIEWER', 'ANALYST', 'ADMIN']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<RevenueDashboard />} />
        <Route path="recovery" element={<RecoveryWorkspace />} />
        <Route path="recovery/:caseId" element={<RecoveryCaseDetail />} />
        <Route path="records" element={<RecordsPage />} />
        <Route path="insights" element={<RevenueInsights />} />
        <Route path="policies" element={<PoliciesControl />} />
        <Route path="audit" element={<AuditPage />} />
        <Route
          path="members"
          element={
            <ProtectedRoute allowedRoles={['ADMIN', 'ANALYST']}>
              <WorkspaceMembersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/users"
          element={
            <ProtectedRoute allowedRoles={['ADMIN']}>
              <AdminUsersPage />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
      <Route path="/recovery" element={<Navigate to="/app/recovery" replace />} />
      <Route path="/records" element={<Navigate to="/app/records" replace />} />
      <Route path="/insights" element={<Navigate to="/app/insights" replace />} />
      <Route path="/policies" element={<Navigate to="/app/policies" replace />} />
      <Route path="/audit" element={<Navigate to="/app/audit" replace />} />
      <Route path="/members" element={<Navigate to="/app/members" replace />} />
      <Route path="/team" element={<Navigate to="/app/members" replace />} />
      <Route path="/advisor" element={<Navigate to="/app/insights" replace />} />

      <Route path="*" element={<RoleRedirect />} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <SidebarProvider>
            <AppRoutes />
          </SidebarProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
