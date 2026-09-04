package com.revive.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.revive.dto.RecoveryDecision;
import com.revive.entity.FailedPayment;
import com.revive.enums.PaymentStatus;
import com.revive.repository.AuditTrailRepository;
import com.revive.repository.FailedPaymentRepository;
import com.revive.repository.RecoveredRevenueRepository;
import com.revive.repository.RecoveryActionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

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
    private final ObjectMapper objectMapper;

    public BatchValidationService(
            RecoveryOrchestrationService orchestrationService,
            FailedPaymentRepository failedPaymentRepository,
            RecoveryActionRepository recoveryActionRepository,
            RecoveredRevenueRepository recoveredRevenueRepository,
            AuditTrailRepository auditTrailRepository,
            RecoveryMetricsService metricsService,
            ObjectMapper objectMapper) {
        this.orchestrationService = orchestrationService;
        this.failedPaymentRepository = failedPaymentRepository;
        this.recoveryActionRepository = recoveryActionRepository;
        this.recoveredRevenueRepository = recoveredRevenueRepository;
        this.auditTrailRepository = auditTrailRepository;
        this.metricsService = metricsService;
        this.objectMapper = objectMapper;
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

        logger.info("Found {} eligible FAILED payments for recovery", eligiblePayments.size());

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

        // Process each payment
        for (FailedPayment payment : eligiblePayments) {
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
                    eligiblePayments.indexOf(payment) >= eligiblePayments.size() - 5) {
                    sampleResults.add(record);
                }

            } catch (Exception e) {
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
    }
}
