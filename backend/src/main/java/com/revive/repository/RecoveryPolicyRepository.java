package com.revive.repository;

import com.revive.entity.RecoveryPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RecoveryPolicyRepository extends JpaRepository<RecoveryPolicy, Long> {

    /**
     * Find all active policies for a workspace, ordered by priority
     */
    List<RecoveryPolicy> findByWorkspaceIdAndIsActiveTrueOrderByPriorityAsc(Long workspaceId);

    /**
     * Find a specific active policy by name
     */
    Optional<RecoveryPolicy> findByWorkspaceIdAndNameAndIsActiveTrue(Long workspaceId, String name);

    /**
     * Find all policies (active and inactive) for a workspace
     */
    List<RecoveryPolicy> findByWorkspaceIdOrderByPriorityAsc(Long workspaceId);

    /**
     * Check if workspace has any active policies
     */
    boolean existsByWorkspaceIdAndIsActiveTrue(Long workspaceId);
}
