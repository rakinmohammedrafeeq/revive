import { apiClient } from './client'

// ─── Types ─────────────────────────────────────────────────────────────────

export interface MlPrediction {
  id: number
  failedPaymentId: number
  predictedProbability: number
  modelVersion: string
  modelName: string
  predictionMethod: string
  features: string // JSON
  actualOutcome: string | null
  wasCorrect: boolean | null
  predictionError: number | null
  predictedAt: string
  outcomeRecordedAt: string | null
}

export interface MlModelMetrics {
  id: number
  workspaceId: number
  periodStart: string
  periodEnd: string
  accuracy: number
  precision: number
  recall: number
  f1Score: number
  rocAuc: number
  totalPredictions: number
  correctPredictions: number
  falsePositives: number
  falseNegatives: number
  averagePredictionError: number
}

export interface AccuracyMetrics {
  totalPredictionsWithOutcomes: number
  correctPredictions: number
  accuracy: number
  averagePredictionError: number | null
}

export interface ModelInfo {
  modelName: string
  modelVersion: string
  modelType: string
  featureImportance?: Record<string, number>
  testMetrics?: {
    precision: number
    recall: number
    f1Score: number
    rocAuc: number
    accuracy: number
  }
  trainSize?: number
  valSize?: number
  testSize?: number
}

// ─── ML Predictions API ────────────────────────────────────────────────────

export const mlPredictionsApi = {
  /**
   * Get ML prediction for a specific payment
   */
  getByPaymentId: (failedPaymentId: number) =>
    apiClient.get<MlPrediction>(`/ml/predictions/${failedPaymentId}`).then((r) => r.data),

  /**
   * Get all ML predictions for workspace
   */
  getAll: () =>
    apiClient.get<MlPrediction[]>('/ml/predictions').then((r) => r.data),

  /**
   * Get predictions pending outcome
   */
  getPending: () =>
    apiClient.get<MlPrediction[]>('/ml/predictions/pending').then((r) => r.data),

  /**
   * Get prediction accuracy summary
   */
  getAccuracy: () =>
    apiClient.get<AccuracyMetrics>('/ml/predictions/accuracy').then((r) => r.data),
}

// ─── ML Model Metrics API ──────────────────────────────────────────────────

export const mlMetricsApi = {
  /**
   * Get latest model metrics
   */
  getLatest: () =>
    apiClient.get<MlModelMetrics>('/ml/metrics/latest').then((r) => r.data),

  /**
   * Get all model metrics for workspace
   */
  getAll: () =>
    apiClient.get<MlModelMetrics[]>('/ml/metrics').then((r) => r.data),

  /**
   * Get model metrics in date range
   */
  getRange: (startDate: string, endDate: string) =>
    apiClient
      .get<MlModelMetrics[]>('/ml/metrics/range', {
        params: { startDate, endDate },
      })
      .then((r) => r.data),

  /**
   * Calculate model metrics for a time period
   */
  calculate: (periodStart: string, periodEnd: string) =>
    apiClient
      .post<MlModelMetrics>('/ml/metrics/calculate', null, {
        params: { periodStart, periodEnd },
      })
      .then((r) => r.data),
}

// ─── Export all ML APIs ────────────────────────────────────────────────────

export const mlApi = {
  predictions: mlPredictionsApi,
  metrics: mlMetricsApi,
}
