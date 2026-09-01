package com.ledgera.service;

import com.ledgera.entity.RecoveryPolicy;
import com.ledgera.repository.RecoveryPolicyRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Service for managing recovery policies.
 * Provides policy evaluation for recovery actions (to be implemented in Phase 3).
 */
@Service
public class RecoveryPolicyService {

    private static final Logger logger = LoggerFactory.getLogger(RecoveryPolicyService.class);

    private final RecoveryPolicyRepository policyRepository;

    public RecoveryPolicyService(RecoveryPolicyRepository policyRepository) {
        this.policyRepository = policyRepository;
    }

    /**
     * Get active policies for a workspace
     */
    @Transactional(readOnly = true)
    public List<RecoveryPolicy> getActivePolicies(Long workspaceId) {
        return policyRepository.findByWorkspaceIdAndIsActiveTrueOrderByPriorityAsc(workspaceId);
    }

    /**
     * Get a specific policy by name
     */
    @Transactional(readOnly = true)
    public Optional<RecoveryPolicy> getPolicyByName(Long workspaceId, String name) {
        return policyRepository.findByWorkspaceIdAndNameAndIsActiveTrue(workspaceId, name);
    }

    /**
     * Create a new policy
     */
    @Transactional
    public RecoveryPolicy createPolicy(RecoveryPolicy policy) {
        logger.info("Creating recovery policy '{}' for workspace {}", 
                policy.getName(), policy.getWorkspace().getId());
        return policyRepository.save(policy);
    }

    /**
     * Update an existing policy
     */
    @Transactional
    public RecoveryPolicy updatePolicy(RecoveryPolicy policy) {
        logger.info("Updating recovery policy '{}' (id={})", policy.getName(), policy.getId());
        return policyRepository.save(policy);
    }

    /**
     * Deactivate a policy
     */
    @Transactional
    public void deactivatePolicy(Long policyId) {
        policyRepository.findById(policyId).ifPresent(policy -> {
            policy.setIsActive(false);
            policyRepository.save(policy);
            logger.info("Deactivated recovery policy '{}' (id={})", policy.getName(), policyId);
        });
    }

    /**
     * Check if workspace has any active policies
     */
    @Transactional(readOnly = true)
    public boolean hasActivePolicies(Long workspaceId) {
        return policyRepository.existsByWorkspaceIdAndIsActiveTrue(workspaceId);
    }

    // TODO Phase 3: Implement policy evaluation methods
    // - canExecuteAction(paymentId, actionType)
    // - checkRetryLimit(payment, policy)
    // - checkCooldownPeriod(payment, policy)
    // - checkBudgetCap(workspace, actionCost, policy)
}
