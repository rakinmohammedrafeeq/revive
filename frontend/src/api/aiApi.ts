import { apiClient } from './client'

// AI Categorization Types
export interface AiCategorizationRequest {
  description: string
  amount?: string
  date?: string
}

export interface AiCategorizationResponse {
  category: string
  type: 'INCOME' | 'EXPENSE'
  confidence: number
  reasoning: string
  success: boolean
  error?: string
}

// AI Receipt Types
export interface AiReceiptResponse {
  amount: number
  merchant: string
  date: string
  category: string
  type: 'INCOME' | 'EXPENSE'
  description: string
  confidence: number
  success: boolean
  error?: string
  cloudinaryUrl?: string
  cloudinaryPublicId?: string
}

// AI Insights Types
export interface AiInsightsResponse {
  summary: string
  keyInsights: string[]
  recommendations: string[]
  spendingAnalysis: {
    topCategory: string
    percentageChange: number
    comparisonPeriod: string
  }
  trendAnalysis: string
  success: boolean
  error?: string
}

/**
 * Get AI-powered category suggestion for a transaction
 */
export const categorizeTransaction = async (
  request: AiCategorizationRequest
): Promise<AiCategorizationResponse> => {
  const response = await apiClient.post<AiCategorizationResponse>(
    '/ai/categorize',
    request
  )
  return response.data
}

/**
 * Upload receipt for OCR and automatic data extraction
 */
export const uploadReceipt = async (file: File): Promise<AiReceiptResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  const response = await apiClient.post<AiReceiptResponse>(
    '/ai/receipt',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // 30 seconds for image processing
    }
  )
  return response.data
}

/**
 * Get AI-generated financial insights for current workspace
 */
export const getAiInsights = async (): Promise<AiInsightsResponse> => {
  const response = await apiClient.get<AiInsightsResponse>('/ai/insights')
  return response.data
}

/**
 * Check if AI service is available
 */
export const checkAiHealth = async (): Promise<boolean> => {
  try {
    await apiClient.get('/ai/health')
    return true
  } catch (error) {
    console.error('AI service health check failed:', error)
    return false
  }
}

// ── AI Agent types ──────────────────────────────────────────────────────────

export interface AgentRequest {
  message: string
  workspaceId: number
}

/**
 * A write action proposed by the agent that requires explicit user confirmation
 * before it executes. Only `summary` should be shown to the user.
 */
export interface PendingAction {
  actionId: string
  toolName: string
  /** Raw JSON arguments from the LLM — never parse or render this in the UI. */
  toolArguments: string
  /** Human-readable description of the proposed action. This is the only field shown to users. */
  summary: string
  /** ISO-8601 datetime string — action expires 10 minutes after creation. */
  expiresAt: string
}

export interface AgentResponse {
  responseType: 'FINAL_ANSWER' | 'PENDING_CONFIRMATION'
  /** Present when responseType === 'FINAL_ANSWER'. */
  answer?: string | null
  /** Present when responseType === 'PENDING_CONFIRMATION'. */
  pendingAction?: PendingAction | null
}

export interface ConfirmActionRequest {
  actionId: string
}

// ── AI Agent API functions ──────────────────────────────────────────────────

/**
 * Send a user message to the AI agent.
 * Returns either a FINAL_ANSWER (text) or a PENDING_CONFIRMATION (write action awaiting user approval).
 * Timeout is inherited from the global apiClient (180s) — LLM multi-step loops can take several seconds.
 */
export const sendAgentMessage = async (
  request: AgentRequest
): Promise<AgentResponse> => {
  const response = await apiClient.post<AgentResponse>('/ai/agent', request)
  return response.data
}

/**
 * Confirm a pending write action. Executes the stored action and returns a FINAL_ANSWER.
 * The actionId must match a non-expired pending action owned by the current user.
 */
export const confirmAgentAction = async (
  request: ConfirmActionRequest
): Promise<AgentResponse> => {
  const response = await apiClient.post<AgentResponse>('/ai/agent/confirm', request)
  return response.data
}

/**
 * Cancel a pending write action without executing it.
 * Returns 204 No Content on success.
 */
export const cancelAgentAction = async (actionId: string): Promise<void> => {
  await apiClient.delete(`/ai/agent/${actionId}`)
}

