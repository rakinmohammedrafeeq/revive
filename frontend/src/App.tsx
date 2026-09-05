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
import { RecoveryWorkspace } from '@/pages/recovery/RecoveryWorkspace'
import { RecoveryCaseDetail } from '@/pages/recovery/RecoveryCaseDetail'
import { MlPerformancePage } from '@/pages/ml/MlPerformancePage'
import { BatchEvaluationPage } from '@/pages/recovery/BatchEvaluationPage'
import { PoliciesControl } from '@/pages/policies/PoliciesControl'
import { AuditPage } from '@/pages/audit/AuditPage'
import { AdminUsersPage } from '@/pages/admin/AdminUsersPage'
import { PricingPage } from '@/pages/PricingPage'
import { DocumentationPage } from '@/pages/DocumentationPage'
import { ApiReferencePage } from '@/pages/ApiReferencePage'
import { IntegrationsPage } from '@/pages/IntegrationsPage'
import { UseCasesPage } from '@/pages/UseCasesPage'
import { HelpPage } from '@/pages/HelpPage'
import { ContactPage } from '@/pages/ContactPage'
import { AboutPage } from '@/pages/AboutPage'

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
      <Route path="/pricing" element={<PricingPage />} />
      <Route path="/documentation" element={<DocumentationPage />} />
      <Route path="/api-reference" element={<ApiReferencePage />} />
      <Route path="/privacy" element={<Navigate to="/terms-and-privacy?tab=privacy" replace />} />
      <Route path="/terms" element={<Navigate to="/terms-and-privacy?tab=terms" replace />} />
      <Route path="/security" element={<Navigate to="/terms-and-privacy?tab=security" replace />} />
      <Route path="/integrations" element={<IntegrationsPage />} />
      <Route path="/use-cases" element={<UseCasesPage />} />
      <Route path="/help" element={<HelpPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/about" element={<AboutPage />} />

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
        <Route path="ml-performance" element={<MlPerformancePage />} />
        <Route path="batch-evaluation" element={<BatchEvaluationPage />} />
        <Route path="policies" element={<PoliciesControl />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="members" element={<Navigate to="/app/admin/users" replace />} />
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
      <Route path="/ml-performance" element={<Navigate to="/app/ml-performance" replace />} />
      <Route path="/batch-evaluation" element={<Navigate to="/app/batch-evaluation" replace />} />
      <Route path="/records" element={<Navigate to="/app/recovery" replace />} />
      <Route path="/insights" element={<Navigate to="/app/ml-performance" replace />} />
      <Route path="/policies" element={<Navigate to="/app/policies" replace />} />
      <Route path="/audit" element={<Navigate to="/app/audit" replace />} />
      <Route path="/members" element={<Navigate to="/app/admin/users" replace />} />
      <Route path="/team" element={<Navigate to="/app/admin/users" replace />} />
      <Route path="/advisor" element={<Navigate to="/app/ml-performance" replace />} />

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
