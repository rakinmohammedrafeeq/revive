package com.revive.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revive.dto.RecoveryDecision;
import com.revive.entity.BatchEvaluationResult;
import com.revive.entity.FailedPayment;
import com.revive.entity.Workspace;
import com.revive.enums.PaymentStatus;
import com.revive.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Batch validation service that processes multiple payment recoveries
 * and produces comprehensive evidence of pipeline execution.
 * 
 * This service:
 * 1. Processes batch of failed payments through complete pipeline
 * 2. Measures actual outcomes (not mock data)
 * 3. Produces detailed evidence for validation
 * 4. Tracks model usage and fallback cases
 * 5. Records exception cases with reasons
 */
@Service
public class BatchValidationService {

    private static final Logger logger = LoggerFactory.getLogger(BatchValidationService.class);

    private final RecoveryOrchestrationService orchestrationService;
    private final FailedPaymentRepository failedPaymentRepository;
    private final RecoveryActionRepository recoveryActionRepository;
    private final RecoveredRevenueRepository recoveredRevenueRepository;
    private final AuditTrailRepository auditTrailRepository;
    private final RecoveryMetricsService metricsService;
    private final BatchEvaluationResultRepository batchResultRepository;
    private final ObjectMapper objectMapper;

    public BatchValidationService(
            RecoveryOrchestrationService orchestrationService,
            FailedPaymentRepository failedPaymentRepository,
            RecoveryActionRepository recoveryActionRepository,
            RecoveredRevenueRepository recoveredRevenueRepository,
            AuditTrailRepository auditTrailRepository,
            RecoveryMetricsService metricsService,
            BatchEvaluationResultRepository batchResultRepository,
            ObjectMapper objectMapper) {
        this.orchestrationService = orchestrationService;
        this.failedPaymentRepository = failedPaymentRepository;
        this.recoveryActionRepository = recoveryActionRepository;
        this.recoveredRevenueRepository = recoveredRevenueRepository;
        this.auditTrailRepository = auditTrailRepository;
        this.metricsService = metricsService;
        this.batchResultRepository = batchResultRepository;
        this.objectMapper = objectMapper;
    }

    private final Map<Long, Boolean> activeCancellations = new java.util.concurrent.ConcurrentHashMap<>();
    private final Map<Long, Thread> activeThreads = new java.util.concurrent.ConcurrentHashMap<>();

    /**
     * Cancel an ongoing batch validation for a workspace.
     * Sets the cancellation flag and interrupts the worker thread so the execution loop halts immediately.
     */
    public boolean cancelBatchValidation(Long workspaceId) {
        logger.info("Batch validation cancellation requested for workspace {}", workspaceId);
        activeCancellations.put(workspaceId, true);
        Thread thread = activeThreads.get(workspaceId);
        if (thread != null) {
            try {
                thread.interrupt();
                logger.info("Interrupted active worker thread for workspace {}", workspaceId);
            } catch (Exception e) {
                logger.warn("Could not interrupt worker thread: {}", e.getMessage());
            }
        }
        return true;
    }

    /**
     * Run batch validation and produce comprehensive evidence
     * 
     * @param workspaceId Workspace to validate
     * @param batchStartTime Start time for batch processing
     * @return Complete batch validation results
     */
    public BatchValidationResult runBatchValidation(Long workspaceId, LocalDateTime batchStartTime) {
        logger.info("=".repeat(80));
        logger.info("BATCH VALIDATION STARTED - Workspace: {}", workspaceId);
        logger.info("Timestamp: {}", batchStartTime);
        logger.info("=".repeat(80));

        activeCancellations.put(workspaceId, false);
        activeThreads.put(workspaceId, Thread.currentThread());
        try {
            BatchValidationResult result = new BatchValidationResult();
            result.setWorkspaceId(workspaceId);
            result.setBatchStartTime(batchStartTime);
            result.setModelUsed("Random Forest (scikit-learn) - ml/models/recovery_model.pkl");
            result.setTestMode(true); // Razorpay TEST MODE

            // Get all FAILED payments before batch
            List<FailedPayment> eligiblePayments = failedPaymentRepository
                    .findByWorkspaceIdAndStatus(workspaceId, PaymentStatus.FAILED);

            result.setTotalRecords(eligiblePayments.size());
            result.setEligibleRecoveryCount(eligiblePayments.size());

            // Cap batch processing to 10 payments per run for ultra-fast, snappy execution in ~3-5s
            int maxBatchSize = 10;
            List<FailedPayment> batchToProcess = eligiblePayments.size() > maxBatchSize
                    ? eligiblePayments.subList(0, maxBatchSize)
                    : eligiblePayments;

            logger.info("Found {} eligible FAILED payments for recovery (processing batch of {} in this run)",
                    eligiblePayments.size(), batchToProcess.size());

            // Track outcomes
            int processed = 0;
            int executed = 0;
            int successfulRecoveries = 0;
            int failedExecutions = 0;
            int blockedCases = 0;
            int escalatedCases = 0;
            int duplicateBlocked = 0;
            int policyBlocked = 0;
            int errors = 0;
            int mlFallbackUsed = 0;

            BigDecimal totalRecoveredRevenue = BigDecimal.ZERO;
            List<Map<String, Object>> sampleResults = new ArrayList<>();
            List<Map<String, Object>> exceptionCases = new ArrayList<>();
            
            long auditEventsBefore = auditTrailRepository.countByWorkspaceId(workspaceId);

            // Process each payment in the batch
            for (FailedPayment payment : batchToProcess) {
                if (Boolean.TRUE.equals(activeCancellations.get(workspaceId)) || Thread.currentThread().isInterrupted()) {
                    logger.warn("Batch validation CANCELLED by user for workspace {}. Halting processing immediately after {} cases.",
                            workspaceId, processed);
                    result.setCancelled(true);
                    break;
                }
                try {
                    logger.info("Processing payment: {} ({})", 
                            payment.getPaymentIdentifier(), payment.getErrorCode());

                RecoveryDecision decision = orchestrationService.processFailedPayment(payment.getId());
                processed++;

                // Build result record
                Map<String, Object> record = new LinkedHashMap<>();
                record.put("paymentIdentifier", payment.getPaymentIdentifier());
                record.put("amount", payment.getAmount());
                record.put("errorCode", payment.getErrorCode());
                record.put("failureReason", payment.getFailureReason());
                record.put("decision", decision.getDecision());
                record.put("recoveryProbability", decision.getRecoveryProbability());
                
                // AI diagnosis info
                if (decision.getAiDiagnosis() != null) {
                    record.put("aiDiagnosis", decision.getAiDiagnosis().getDiagnosis());
                    record.put("aiConfidence", decision.getAiDiagnosis().getConfidence());
                } else {
                    mlFallbackUsed++;
                }

                // Process by decision type
                switch (decision.getDecision()) {
                    case "EXECUTE" -> {
                        executed++;
                        record.put("executionStatus", decision.getExecutionStatus());
                        record.put("actionType", decision.getRecommendation() != null ? 
                                decision.getRecommendation().getActionType() : "UNKNOWN");

                        if ("SUCCESS".equals(decision.getExecutionStatus())) {
                            successfulRecoveries++;
                            if (decision.getRecoveredAmount() != null) {
                                totalRecoveredRevenue = totalRecoveredRevenue.add(decision.getRecoveredAmount());
                                record.put("recoveredAmount", decision.getRecoveredAmount());
                            }
                        } else if ("FAILED".equals(decision.getExecutionStatus())) {
                            failedExecutions++;
                        }
                    }
                    case "BLOCKED" -> {
                        blockedCases++;
                        record.put("blockReason", decision.getReason());
                        
                        // Categorize block reason
                        String reason = decision.getReason().toLowerCase();
                        if (reason.contains("duplicate") || reason.contains("already")) {
                            duplicateBlocked++;
                        } else if (reason.contains("policy") || reason.contains("retry limit") || 
                                   reason.contains("terminal")) {
                            policyBlocked++;
                        }
                        
                        // Add to exception cases
                        exceptionCases.add(record);
                    }
                    case "ESCALATE" -> {
                        escalatedCases++;
                        record.put("escalateReason", decision.getReason());
                        exceptionCases.add(record);
                    }
                }

                // Keep sample results (first 15 + last 5)
                if (sampleResults.size() < 15 || 
                    batchToProcess.indexOf(payment) >= batchToProcess.size() - 5) {
                    sampleResults.add(record);
                }

            } catch (Exception e) {
                if (Boolean.TRUE.equals(activeCancellations.get(workspaceId)) || Thread.currentThread().isInterrupted()) {
                    logger.warn("Batch validation interrupted/cancelled during payment {}. Halting processing.", 
                            payment.getPaymentIdentifier());
                    result.setCancelled(true);
                    break;
                }
                errors++;
                logger.error("Error processing payment {}: {}", 
                        payment.getPaymentIdentifier(), e.getMessage(), e);
                
                Map<String, Object> errorRecord = new LinkedHashMap<>();
                errorRecord.put("paymentIdentifier", payment.getPaymentIdentifier());
                errorRecord.put("error", e.getMessage());
                errorRecord.put("errorType", e.getClass().getSimpleName());
                exceptionCases.add(errorRecord);
            }
        }

        long auditEventsAfter = auditTrailRepository.countByWorkspaceId(workspaceId);
        long auditEventsCreated = auditEventsAfter - auditEventsBefore;

        // Calculate final metrics from database
        var metrics = metricsService.calculateMetrics(workspaceId);
        
        // Calculate recovery rate
        double recoveryRate = 0.0;
        if (executed > 0) {
            recoveryRate = (successfulRecoveries * 100.0) / executed;
        }

        // Calculate average recovery time
        Double avgRecoveryTime = calculateAverageRecoveryTime(workspaceId, batchStartTime);

        // Populate result
        result.setProcessedCount(processed);
        result.setExecutedCount(executed);
        result.setSuccessfulRecoveries(successfulRecoveries);
        result.setFailedExecutions(failedExecutions);
        result.setBlockedCases(blockedCases);
        result.setEscalatedCases(escalatedCases);
        result.setDuplicateBlockedCount(duplicateBlocked);
        result.setPolicyBlockedCount(policyBlocked);
        result.setErrorCount(errors);
        result.setMlFallbackUsed(mlFallbackUsed);
        result.setRecoveredRevenue(totalRecoveredRevenue);
        result.setRecoveryRate(recoveryRate);
        result.setExpectedRecoveryValue(metrics.getExpectedRecoveryValue());
        result.setAverageRecoveryTimeMinutes(avgRecoveryTime);
        result.setAuditEventsCreated(auditEventsCreated);
        result.setSampleResults(sampleResults);
        result.setExceptionCases(exceptionCases);
        result.setBatchEndTime(LocalDateTime.now());
        result.setCumulativeMetrics(metrics);

        logger.info("=".repeat(80));
        logger.info("BATCH VALIDATION COMPLETE");
        logger.info("Processed: {}, Executed: {}, Successful: {}, Failed: {}, Blocked: {}",
                processed, executed, successfulRecoveries, failedExecutions, blockedCases);
        logger.info("Total Recovered: ₹{}", totalRecoveredRevenue);
        logger.info("Recovery Rate: {:.1f}%", recoveryRate);
        logger.info("Audit Events: {}", auditEventsCreated);
        logger.info("=".repeat(80));

        return result;
        } finally {
            activeCancellations.remove(workspaceId);
            activeThreads.remove(workspaceId);
        }
    }

    /**
     * Calculate average recovery time for payments recovered during batch
     */
    private Double calculateAverageRecoveryTime(Long workspaceId, LocalDateTime batchStartTime) {
        List<FailedPayment> recovered = failedPaymentRepository
                .findByWorkspaceIdAndStatus(workspaceId, PaymentStatus.RECOVERED);

        return recovered.stream()
                .filter(p -> p.getRecoveredAt() != null && 
                            p.getRecoveredAt().isAfter(batchStartTime))
                .filter(p -> p.getFailedAt() != null)
                .mapToDouble(p -> Duration.between(p.getFailedAt(), p.getRecoveredAt()).toMinutes())
                .average()
                .orElse(0.0);
    }

    /**
     * Result container for batch validation
     */
    public static class BatchValidationResult {
        private Long workspaceId;
        private LocalDateTime batchStartTime;
        private LocalDateTime batchEndTime;
        private String modelUsed;
        private Boolean testMode;
        private Boolean cancelled = false;
        
        // Input metrics
        private Integer totalRecords;
        private Integer eligibleRecoveryCount;
        
        // Processing metrics
        private Integer processedCount;
        private Integer executedCount;
        private Integer successfulRecoveries;
        private Integer failedExecutions;
        private Integer blockedCases;
        private Integer escalatedCases;
        private Integer duplicateBlockedCount;
        private Integer policyBlockedCount;
        private Integer errorCount;
        private Integer mlFallbackUsed;
        
        // Outcome metrics
        private BigDecimal recoveredRevenue;
        private Double recoveryRate;
        private BigDecimal expectedRecoveryValue;
        private Double averageRecoveryTimeMinutes;
        private Long auditEventsCreated;
        
        // Evidence
        private List<Map<String, Object>> sampleResults;
        private List<Map<String, Object>> exceptionCases;
        private Object cumulativeMetrics;

        // Getters and setters
        public Long getWorkspaceId() { return workspaceId; }
        public void setWorkspaceId(Long workspaceId) { this.workspaceId = workspaceId; }
        
        public LocalDateTime getBatchStartTime() { return batchStartTime; }
        public void setBatchStartTime(LocalDateTime batchStartTime) { this.batchStartTime = batchStartTime; }
        
        public LocalDateTime getBatchEndTime() { return batchEndTime; }
        public void setBatchEndTime(LocalDateTime batchEndTime) { this.batchEndTime = batchEndTime; }
        
        public String getModelUsed() { return modelUsed; }
        public void setModelUsed(String modelUsed) { this.modelUsed = modelUsed; }
        
        public Boolean getTestMode() { return testMode; }
        public void setTestMode(Boolean testMode) { this.testMode = testMode; }

        public Boolean getCancelled() { return cancelled; }
        public void setCancelled(Boolean cancelled) { this.cancelled = cancelled; }
        
        public Integer getTotalRecords() { return totalRecords; }
        public void setTotalRecords(Integer totalRecords) { this.totalRecords = totalRecords; }
        
        public Integer getEligibleRecoveryCount() { return eligibleRecoveryCount; }
        public void setEligibleRecoveryCount(Integer eligibleRecoveryCount) { 
            this.eligibleRecoveryCount = eligibleRecoveryCount; 
        }
        
        public Integer getProcessedCount() { return processedCount; }
        public void setProcessedCount(Integer processedCount) { this.processedCount = processedCount; }
        
        public Integer getExecutedCount() { return executedCount; }
        public void setExecutedCount(Integer executedCount) { this.executedCount = executedCount; }
        
        public Integer getSuccessfulRecoveries() { return successfulRecoveries; }
        public void setSuccessfulRecoveries(Integer successfulRecoveries) { 
            this.successfulRecoveries = successfulRecoveries; 
        }
        
        public Integer getFailedExecutions() { return failedExecutions; }
        public void setFailedExecutions(Integer failedExecutions) { 
            this.failedExecutions = failedExecutions; 
        }
        
        public Integer getBlockedCases() { return blockedCases; }
        public void setBlockedCases(Integer blockedCases) { this.blockedCases = blockedCases; }
        
        public Integer getEscalatedCases() { return escalatedCases; }
        public void setEscalatedCases(Integer escalatedCases) { this.escalatedCases = escalatedCases; }
        
        public Integer getDuplicateBlockedCount() { return duplicateBlockedCount; }
        public void setDuplicateBlockedCount(Integer duplicateBlockedCount) { 
            this.duplicateBlockedCount = duplicateBlockedCount; 
        }
        
        public Integer getPolicyBlockedCount() { return policyBlockedCount; }
        public void setPolicyBlockedCount(Integer policyBlockedCount) { 
            this.policyBlockedCount = policyBlockedCount; 
        }
        
        public Integer getErrorCount() { return errorCount; }
        public void setErrorCount(Integer errorCount) { this.errorCount = errorCount; }
        
        public Integer getMlFallbackUsed() { return mlFallbackUsed; }
        public void setMlFallbackUsed(Integer mlFallbackUsed) { this.mlFallbackUsed = mlFallbackUsed; }
        
        public BigDecimal getRecoveredRevenue() { return recoveredRevenue; }
        public void setRecoveredRevenue(BigDecimal recoveredRevenue) { 
            this.recoveredRevenue = recoveredRevenue; 
        }
        
        public Double getRecoveryRate() { return recoveryRate; }
        public void setRecoveryRate(Double recoveryRate) { this.recoveryRate = recoveryRate; }
        
        public BigDecimal getExpectedRecoveryValue() { return expectedRecoveryValue; }
        public void setExpectedRecoveryValue(BigDecimal expectedRecoveryValue) { 
            this.expectedRecoveryValue = expectedRecoveryValue; 
        }
        
        public Double getAverageRecoveryTimeMinutes() { return averageRecoveryTimeMinutes; }
        public void setAverageRecoveryTimeMinutes(Double averageRecoveryTimeMinutes) { 
            this.averageRecoveryTimeMinutes = averageRecoveryTimeMinutes; 
        }
        
        public Long getAuditEventsCreated() { return auditEventsCreated; }
        public void setAuditEventsCreated(Long auditEventsCreated) { 
            this.auditEventsCreated = auditEventsCreated; 
        }
        
        public List<Map<String, Object>> getSampleResults() { return sampleResults; }
        public void setSampleResults(List<Map<String, Object>> sampleResults) { 
            this.sampleResults = sampleResults; 
        }
        
        public List<Map<String, Object>> getExceptionCases() { return exceptionCases; }
        public void setExceptionCases(List<Map<String, Object>> exceptionCases) { 
            this.exceptionCases = exceptionCases; 
        }
        
        public Object getCumulativeMetrics() { return cumulativeMetrics; }
        public void setCumulativeMetrics(Object cumulativeMetrics) { 
            this.cumulativeMetrics = cumulativeMetrics; 
        }
        
        // Additional helper getters for batch result storage
        public Map<String, Object> getMlModelStats() {
            if (cumulativeMetrics instanceof Map) {
                return (Map<String, Object>) cumulativeMetrics;
            }
            return null;
        }
        
        public Map<String, Integer> getOutcomeBreakdown() {
            Map<String, Integer> breakdown = new HashMap<>();
            breakdown.put("executed", executedCount != null ? executedCount : 0);
            breakdown.put("successful", successfulRecoveries != null ? successfulRecoveries : 0);
            breakdown.put("failed", failedExecutions != null ? failedExecutions : 0);
            breakdown.put("blocked", blockedCases != null ? blockedCases : 0);
            breakdown.put("escalated", escalatedCases != null ? escalatedCases : 0);
            return breakdown;
        }
        
        public Map<String, Integer> getBlockedReasons() {
            Map<String, Integer> reasons = new HashMap<>();
            reasons.put("duplicate", duplicateBlockedCount != null ? duplicateBlockedCount : 0);
            reasons.put("policy", policyBlockedCount != null ? policyBlockedCount : 0);
            return reasons;
        }
        
        public BigDecimal getTotalRecoveredRevenue() {
            return recoveredRevenue != null ? recoveredRevenue : BigDecimal.ZERO;
        }
        
        public long getDurationSeconds() {
            if (batchStartTime != null && batchEndTime != null) {
                return Duration.between(batchStartTime, batchEndTime).getSeconds();
            }
            return 0;
        }
    }

    /**
     * Save batch evaluation result to database for historical tracking
     */
    @Transactional
    public BatchEvaluationResult saveBatchResult(Workspace workspace, BatchValidationResult result, LocalDateTime evaluatedAt) {
        BatchEvaluationResult entity = BatchEvaluationResult.builder()
                .workspace(workspace)
                .evaluatedAt(evaluatedAt)
                .totalPaymentsEvaluated(result.getTotalRecords())
                .autoApproved(result.getExecutedCount())
                .requiresReview(result.getEscalatedCases())
                .blocked(result.getBlockedCases())
                .mlAccuracy(result.getMlModelStats() != null ? 
                        (Double) result.getMlModelStats().get("accuracy") : null)
                .outcomeBreakdown(result.getOutcomeBreakdown())
                .blockedReasons(result.getBlockedReasons())
                .detailedMetrics(Map.of(
                    "processedCount", result.getProcessedCount(),
                    "successfulRecoveries", result.getSuccessfulRecoveries(),
                    "failedExecutions", result.getFailedExecutions(),
                    "totalRevenue", result.getTotalRecoveredRevenue().toString(),
                    "duration", result.getDurationSeconds()
                ))
                .build();

        return batchResultRepository.save(entity);
    }

    /**
     * Get batch evaluation history for workspace
     */
    @Transactional(readOnly = true)
    public List<BatchEvaluationResult> getBatchHistory(Long workspaceId) {
        return batchResultRepository.findByWorkspaceIdOrderByEvaluatedAtDesc(workspaceId);
    }

    /**
     * Delete a specific batch result (with workspace security check)
     */
    @Transactional
    public void deleteBatchResult(Long id, Long workspaceId) {
        BatchEvaluationResult result = batchResultRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Batch result not found"));
        
        if (!result.getWorkspace().getId().equals(workspaceId)) {
            throw new RuntimeException("Unauthorized: Batch result belongs to different workspace");
        }
        
        batchResultRepository.deleteById(id);
        logger.info("Deleted batch result {} for workspace {}", id, workspaceId);
    }

    /**
     * Clear all batch results for workspace
     */
    @Transactional
    public int clearAllBatchResults(Long workspaceId) {
        long count = batchResultRepository.countByWorkspaceId(workspaceId);
        batchResultRepository.deleteAllByWorkspaceId(workspaceId);
        logger.info("Cleared {} batch results for workspace {}", count, workspaceId);
        return (int) count;
    }

    /**
     * Auto-cleanup: Delete batch results older than 90 days
     * Runs daily at 2 AM
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void autoCleanupOldResults() {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(90);
        int deleted = batchResultRepository.deleteOlderThan(cutoff);
        if (deleted > 0) {
            logger.info("Auto-cleanup: Deleted {} batch results older than 90 days", deleted);
        }
    }
}
