package com.revive.repository;

import com.revive.entity.AdvisorConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AdvisorConversationRepository extends JpaRepository<AdvisorConversation, Long> {

    List<AdvisorConversation> findBySessionIdOrderByCreatedAtAsc(String sessionId);
    
    List<AdvisorConversation> findBySessionIdAndWorkspaceIdOrderByCreatedAtAsc(String sessionId, Long workspaceId);

    List<AdvisorConversation> findByUserIdOrderByCreatedAtDesc(Long userId);
    
    List<AdvisorConversation> findByUserIdAndWorkspaceIdOrderByCreatedAtDesc(Long userId, Long workspaceId);

    List<AdvisorConversation> findByUserIdAndCreatedAtAfterOrderByCreatedAtDesc(
            Long userId, LocalDateTime after);

    void deleteBySessionId(String sessionId);

    void deleteByUserIdAndCreatedAtBefore(Long userId, LocalDateTime before);
}
