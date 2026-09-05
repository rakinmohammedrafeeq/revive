import { apiClient } from './client'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface FailedPayment {
  id: number
  paymentIdentifier: string
  orderIdentifier?: string
  customerId: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  amount: number
  currency: string
  status: PaymentStatus
  failureReason?: string
  errorCode?: string
  paymentMethod?: string
  retryCount: number
  failedAt: string
  lastRetryAt?: string
  recoveredAt?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type PaymentStatus =
  | 'FAILED'
  | 'PENDING_RETRY'
  | 'RETRY_IN_PROGRESS'
  | 'RECOVERED'
  | 'ABANDONED'
  | 'UNDER_REVIEW'

export interface FailedPaymentCreateRequest {
  paymentIdentifier: string
  orderIdentifier?: string
  customerId: string
  customerEmail?: string
  customerPhone?: string
  customerName?: string
  amount: number
  currency: string
  failureReason?: string
  errorCode?: string
  paymentMethod?: string
  metadata?: Record<string, unknown>
}

export interface RazorpayConfig {
  keyId: string
  currency: string
  isTestMode: boolean
}

export interface AiDiagnosisResult {
  diagnosis: string
  rootCause: string
  recommendation: string
  reasoning: string
  confidence: number
  isRecoverable: boolean
  suggestedAction: string
  suggestedDelayMinutes: number
}

export interface PolicyEvaluationResult {
  allowed: boolean
  requiresApproval?: boolean
  reason: string
  policyName?: string
}

export interface RecoveryRecommendation {
  actionType: string
  channel: string
  reasoning: string
  confidence: number
  diagnosis: string
  recommendation: string
  estimatedDelayMinutes: number
}

export interface RecoveryDecision {
  failedPaymentId: number
  decision: 'EXECUTE' | 'BLOCKED' | 'ESCALATE'
  reason: string
  recoveryProbability?: number
  aiDiagnosis?: AiDiagnosisResult
  recommendation?: RecoveryRecommendation
  policyResult?: PolicyEvaluationResult
  recoveryActionId?: number
  /** SUCCESS | PENDING | FAILED — actual execution outcome (when decision == EXECUTE) */
  executionStatus?: 'SUCCESS' | 'PENDING' | 'FAILED' | 'BLOCKED'
  /** Amount recovered in INR (only when executionStatus == SUCCESS) */
  recoveredAmount?: number
  /** Raw executor details from Razorpay TEST MODE */
  outcomeDetails?: Record<string, unknown>
  /** Always true — Razorpay TEST MODE only */
  testMode?: boolean
}

export interface RecoveryAction {
  id: number
  failedPayment: { id: number; paymentIdentifier: string; amount: number }
  actionType: string
  channel?: string
  status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED_SUCCESS' | 'COMPLETED_FAILURE' | 'FAILED'
  isAutomated: boolean
  outcome?: string
  cost: number
  initiatedAt: string
  completedAt?: string
  createdAt: string
}

export interface MLPrediction {
  paymentId: number
  paymentIdentifier: string
  recoveryProbability: number
  modelType: string
  confidence: 'HIGH' | 'MEDIUM' | 'LOW'
  expectedRecoveryValue?: number
}

export interface RecoveryMetrics {
  totalRevenueAtRisk: number
  totalRecovered: number
  totalRecoveryCost: number
  netGain: number
  roi: number
  recoveryRate: number
  volumeRecoveryRate?: number
  totalCases: number
  recoveredCases: number
  abandonedCases: number
  inProgressCases: number
  pendingReviewCases: number
  activeCases: number
  averageRecoveryTime: number
  policyBlockedActions?: number
  expectedRecoveryValue?: number
  /** Total recovery action attempts recorded */
  totalAttempts?: number
  /** Actions that resulted in payment status = RECOVERED */
  successfulRecoveries?: number
  /** Actions that ran but payment was declined again */
  failedRecoveries?: number
  /** Actions sent (email/SMS/link) awaiting customer response */
  pendingRecoveries?: number
  startDate?: string
  endDate?: string
}

export interface AuditTrailEntry {
  id: number
  timestamp: string
  actionType: string
  entityType?: string
  entityId?: number
  paymentIdentifier?: string
  details: string
  outcome?: string
}

export interface RecoveryPolicy {
  id: number
  name: string
  description?: string
  maxRetryCount: number
  cooldownHours: number
  maxRecoveryCostPerPayment?: number
  maxTotalRecoveryBudget?: number
  allowedChannels?: string
  isActive: boolean
  priority: number
}

// ─── Recovery Cases ─────────────────────────────────────────────────────────

export const recoveryCaseApi = {
  /** Get all recovery cases for the current workspace */
  getAll: () =>
    apiClient.get<FailedPayment[]>('/recovery/cases').then((r) => r.data),

  /** Get a specific recovery case */
  getById: (id: number) =>
    apiClient.get<FailedPayment>(`/recovery/cases/${id}`).then((r) => r.data),

  /** Get ML recovery probability prediction */
  getPrediction: (id: number) =>
    apiClient.get<MLPrediction>(`/recovery/cases/${id}/prediction`).then((r) => r.data),

  /** Get AI failure diagnosis */
  getDiagnosis: (id: number) =>
    apiClient.get<AiDiagnosisResult>(`/recovery/cases/${id}/diagnosis`).then((r) => r.data),

  /** Process a payment through the full recovery workflow */
  process: (id: number) =>
    apiClient.post<RecoveryDecision>(`/recovery/cases/${id}/process`).then((r) => r.data),

  /** Execute a specific recovery action */
  execute: (id: number, actionType: string, channel?: string) =>
    apiClient
      .post<RecoveryAction>(`/recovery/cases/${id}/execute`, { actionType, channel })
      .then((r) => r.data),

  /** Get recovery action history for a payment */
  getActions: (id: number) =>
    apiClient.get<RecoveryAction[]>(`/recovery/cases/${id}/actions`).then((r) => r.data),
}

// ─── Recovery Metrics ──────────────────────────────────────────────────────

export const recoveryMetricsApi = {
  /** Get comprehensive recovery metrics */
  get: () =>
    apiClient.get<RecoveryMetrics>('/recovery/metrics').then((r) => r.data),
}

// ─── ML Model ──────────────────────────────────────────────────────────────

export const mlModelApi = {
  /** Get ML model information and feature importance */
  getInfo: () =>
    apiClient.get<Record<string, unknown>>('/recovery/model/info').then((r) => r.data),
}

// ─── Audit Trail ───────────────────────────────────────────────────────────

export const auditTrailApi = {
  /** Get audit trail for the current workspace */
  getAll: () =>
    apiClient.get<AuditTrailEntry[]>('/recovery/audit').then((r) => r.data),

  /** Get audit trail for a specific payment */
  getByPayment: (paymentIdentifier: string) =>
    apiClient
      .get<AuditTrailEntry[]>(`/recovery/audit/${paymentIdentifier}`)
      .then((r) => r.data),
}

export interface BatchValidationResult {
  workspaceId: number
  batchStartTime: string
  batchEndTime: string
  modelUsed: string
  testMode: boolean
  totalRecords: number
  eligibleRecoveryCount: number
  processedCount: number
  executedCount: number
  successfulRecoveries: number
  failedExecutions: number
  blockedCases: number
  escalatedCases: number
  duplicateBlockedCount: number
  policyBlockedCount: number
  errorCount: number
  mlFallbackUsed: number
  recoveredRevenue: number
  recoveryRate: number
  expectedRecoveryValue: number
  averageRecoveryTimeMinutes: number
  auditEventsCreated: number
  sampleResults: Array<Record<string, unknown>>
  exceptionCases: Array<Record<string, unknown>>
  cumulativeMetrics?: RecoveryMetrics
}

// ─── Recovery Policies ────────────────────────────────────────────────────

export const recoveryPolicyApi = {
  /** Get all policies for current workspace */
  getAll: () =>
    apiClient.get<RecoveryPolicy[]>('/recovery/policies').then((r) => r.data),

  /** Get active policy */
  getActive: () =>
    apiClient.get<RecoveryPolicy>('/recovery/policies/active').then((r) => r.data),
}

// ─── Failed Payments / Live Simulator ────────────────────────────────────

export const failedPaymentsApi = {
  /** Report a new failed payment */
  create: (request: FailedPaymentCreateRequest) =>
    apiClient.post<FailedPayment>('/recovery/payments', request).then((r) => r.data),

  /** List failed payments for workspace */
  getAll: () =>
    apiClient.get<FailedPayment[]>('/recovery/payments').then((r) => r.data),

  /** Get specific failed payment */
  getById: (id: number) =>
    apiClient.get<FailedPayment>(`/recovery/payments/${id}`).then((r) => r.data),

  /** Diagnose payment and trigger recovery orchestration */
  diagnose: (id: number) =>
    apiClient.post<RecoveryDecision>(`/recovery/payments/${id}/diagnose`).then((r) => r.data),

  /** Get Razorpay key and config */
  getConfig: () =>
    apiClient.get<RazorpayConfig>('/recovery/payments/config').then((r) => r.data),
}

// ─── Demo / Admin / Batch ────────────────────────────────────────────────

export const recoveryAdminApi = {
  /** Generate synthetic demo data */
  generateDemoData: (count = 60) =>
    apiClient.post<{ generated: number; message?: string; workspace?: string }>('/recovery/demo/generate', { count }).then((r) => r.data),

  /** Run batch evaluation across all pending payments — returns rich evidence */
  runBatchEvaluation: () =>
    apiClient.post<BatchValidationResult>('/recovery/batch/evaluate').then((r) => r.data),

  /** Dataset statistics and ML model summary */
  getDemoStats: () =>
    apiClient.get<Record<string, unknown>>('/recovery/demo/stats').then((r) => r.data),
}

// Re-export ML APIs for convenience
export { mlPredictionsApi, mlMetricsApi, mlApi } from './mlApi'

