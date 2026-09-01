package com.ledgera.repository;

import com.ledgera.entity.FailedPayment;
import com.ledgera.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface FailedPaymentRepository extends JpaRepository<FailedPayment, Long> {

    /**
     * Find by payment identifier
     */
    Optional<FailedPayment> findByPaymentIdentifier(String paymentIdentifier);

    /**
     * Find all failed payments for a workspace
     */
    List<FailedPayment> findByWorkspaceIdOrderByFailedAtDesc(Long workspaceId);

    /**
     * Find by status and workspace
     */
    List<FailedPayment> findByWorkspaceIdAndStatus(Long workspaceId, PaymentStatus status);

    /**
     * Find payments ready for retry (status = PENDING_RETRY and cooldown expired)
     */
    @Query("SELECT fp FROM FailedPayment fp WHERE fp.workspace.id = :workspaceId " +
           "AND fp.status = 'PENDING_RETRY' " +
           "AND (fp.lastRetryAt IS NULL OR fp.lastRetryAt < :cooldownExpiry)")
    List<FailedPayment> findPaymentsReadyForRetry(
        @Param("workspaceId") Long workspaceId,
        @Param("cooldownExpiry") LocalDateTime cooldownExpiry
    );

    /**
     * Find by error code
     */
    List<FailedPayment> findByWorkspaceIdAndErrorCode(Long workspaceId, String errorCode);

    /**
     * Find by payment method
     */
    List<FailedPayment> findByWorkspaceIdAndPaymentMethod(Long workspaceId, String paymentMethod);

    /**
     * Find by customer ID
     */
    List<FailedPayment> findByWorkspaceIdAndCustomerId(Long workspaceId, String customerId);

    /**
     * Count failed payments by status for a workspace
     */
    long countByWorkspaceIdAndStatus(Long workspaceId, PaymentStatus status);

    /**
     * Find recent failures (for dashboard)
     */
    List<FailedPayment> findTop20ByWorkspaceIdOrderByFailedAtDesc(Long workspaceId);
}
