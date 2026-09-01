package com.ledgera.controller;

import com.ledgera.dto.AgentRequest;
import com.ledgera.dto.AgentResponse;
import com.ledgera.dto.ConfirmActionRequest;
import com.ledgera.service.AgentOrchestrationService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for the Ledgera AI agent.
 *
 * <h3>Endpoints</h3>
 * <pre>
 *   POST   /api/ai/agent          — send a message; returns FINAL_ANSWER or PENDING_CONFIRMATION
 *   POST   /api/ai/agent/confirm  — confirm a pending write action; returns FINAL_ANSWER
 *   DELETE /api/ai/agent/{id}     — cancel a pending write action
 * </pre>
 *
 * <p>All endpoints require a valid JWT (enforced by SecurityConfig).
 * Workspace access is validated inside {@link AgentOrchestrationService}.
 */
@RestController
@RequestMapping("/api/ai/agent")
public class AgentController {

    private static final Logger logger = LoggerFactory.getLogger(AgentController.class);

    private final AgentOrchestrationService agentService;

    public AgentController(AgentOrchestrationService agentService) {
        this.agentService = agentService;
    }

    /**
     * Primary agent endpoint.
     *
     * <p>Accepts a user message and workspace ID, runs the tool-calling agent loop,
     * and returns either:
     * <ul>
     *   <li>{@code responseType: "FINAL_ANSWER"} — with the agent's text answer, or</li>
     *   <li>{@code responseType: "PENDING_CONFIRMATION"} — with a {@code pendingAction}
     *       the frontend must display for the user to confirm or cancel.</li>
     * </ul>
     *
     * <p>Example request:
     * <pre>{@code
     * POST /api/ai/agent
     * {
     *   "message": "How much did I spend on food this month?",
     *   "workspaceId": 3
     * }
     * }</pre>
     */
    @PostMapping
    public ResponseEntity<AgentResponse> chat(@Valid @RequestBody AgentRequest request) {
        logger.info("Agent request received: workspaceId={}, message=\"{}\"",
                request.getWorkspaceId(),
                request.getMessage().length() > 80
                        ? request.getMessage().substring(0, 80) + "..." : request.getMessage());

        AgentResponse response = agentService.processMessage(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Confirms a pending write action and executes it.
     *
     * <p>The {@code actionId} must have been returned in a prior {@code PENDING_CONFIRMATION}
     * response and must not have expired (10-minute TTL).
     *
     * <p>Example request:
     * <pre>{@code
     * POST /api/ai/agent/confirm
     * { "actionId": "550e8400-e29b-41d4-a716-446655440000" }
     * }</pre>
     */
    @PostMapping("/confirm")
    public ResponseEntity<AgentResponse> confirm(@Valid @RequestBody ConfirmActionRequest request) {
        logger.info("Agent action confirmation: actionId={}", request.getActionId());
        AgentResponse response = agentService.confirmAction(request.getActionId());
        return ResponseEntity.ok(response);
    }

    /**
     * Cancels a pending write action without executing it.
     *
     * <p>Example request:
     * <pre>{@code
     * DELETE /api/ai/agent/550e8400-e29b-41d4-a716-446655440000
     * }</pre>
     */
    @DeleteMapping("/{actionId}")
    public ResponseEntity<Void> cancel(@PathVariable String actionId) {
        logger.info("Agent action cancellation: actionId={}", actionId);
        agentService.cancelAction(actionId);
        return ResponseEntity.noContent().build();
    }
}
