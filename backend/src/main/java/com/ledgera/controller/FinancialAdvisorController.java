package com.ledgera.controller;

import com.ledgera.dto.AdvisorChatRequest;
import com.ledgera.dto.AdvisorChatResponse;
import com.ledgera.dto.FinancialInsightResponse;
import com.ledgera.dto.MessageResponse;
import com.ledgera.service.FinancialAdvisorService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * REST Controller for RAG-powered Financial Advisor
 * Provides AI-driven financial advice with personalized context
 */
@RestController
@RequestMapping("/api/advisor")
public class FinancialAdvisorController {

    private static final Logger logger = LoggerFactory.getLogger(FinancialAdvisorController.class);

    private final FinancialAdvisorService advisorService;

    public FinancialAdvisorController(FinancialAdvisorService advisorService) {
        this.advisorService = advisorService;
    }

    /**
     * Chat with AI financial advisor
     * Uses RAG to retrieve relevant financial context
     * 
     * Example request:
     * {
     *   "message": "Can I afford a $2000 vacation?",
     *   "workspaceId": 1
     * }
     */
    @PostMapping("/chat")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<?> chat(@Valid @RequestBody AdvisorChatRequest request) {
        logger.info("Financial advisor chat request: {}", request.getMessage());
        
        try {
            AdvisorChatResponse response = advisorService.chat(request);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Chat failed", e);
            return ResponseEntity.status(500)
                    .body(new MessageResponse("Failed to process chat: " + e.getMessage()));
        }
    }

    /**
     * Generate proactive financial insights
     */
    @PostMapping("/insights/generate")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<?> generateInsights(
            @RequestParam(required = false) Long workspaceId) {
        logger.info("Generating financial insights for workspace: {}", workspaceId);
        
        try {
            List<FinancialInsightResponse> insights = advisorService.generateInsights(workspaceId);
            return ResponseEntity.ok(insights);
        } catch (Exception e) {
            logger.error("Failed to generate insights", e);
            return ResponseEntity.status(500)
                    .body(new MessageResponse("Failed to generate insights: " + e.getMessage()));
        }
    }

    /**
     * Get active financial insights
     */
    @GetMapping("/insights")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<List<FinancialInsightResponse>> getInsights(
            @RequestParam(required = false) Long workspaceId) {
        logger.info("Fetching active insights for workspace: {}", workspaceId);
        
        List<FinancialInsightResponse> insights = advisorService.getActiveInsights(workspaceId);
        return ResponseEntity.ok(insights);
    }
    
    /**
     * Reindex all financial records for RAG search (manual trigger)
     */
    @PostMapping("/reindex")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<MessageResponse> reindexWorkspace(
            @RequestParam(required = false) Long workspaceId) {
        logger.info("Manual reindex requested for workspace: {}", workspaceId);
        
        try {
            advisorService.reindexWorkspace(workspaceId);
            return ResponseEntity.ok(new MessageResponse(
                    "Workspace reindexed successfully. Financial records are now searchable."));
        } catch (Exception e) {
            logger.error("Reindex failed", e);
            return ResponseEntity.status(500).body(new MessageResponse(
                    "Reindex failed: " + e.getMessage()));
        }
    }

    /**
     * Clean up duplicate insights (admin utility)
     */
    @PostMapping("/insights/cleanup")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MessageResponse> cleanupDuplicates(
            @RequestParam(required = false) Long workspaceId) {
        logger.info("Cleaning up duplicate insights for workspace: {}", workspaceId);
        
        try {
            int deletedCount = advisorService.cleanupDuplicateInsights(workspaceId);
            return ResponseEntity.ok(new MessageResponse(
                    "Cleaned up " + deletedCount + " duplicate insights"));
        } catch (Exception e) {
            logger.error("Cleanup failed", e);
            return ResponseEntity.status(500).body(new MessageResponse(
                    "Cleanup failed: " + e.getMessage()));
        }
    }
}
