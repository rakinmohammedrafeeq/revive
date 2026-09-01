package com.revive.repository;

import com.revive.entity.FinancialEmbedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FinancialEmbeddingRepository extends JpaRepository<FinancialEmbedding, Long> {

    List<FinancialEmbedding> findByUserId(Long userId);

    List<FinancialEmbedding> findByUserIdAndWorkspaceId(Long userId, Long workspaceId);

    void deleteByRecordId(Long recordId);

    /**
     * Find similar financial records using vector cosine similarity
     * @param embedding Query embedding vector
     * @param userId User ID to filter results
     * @param limit Maximum number of results
     * @return List of similar embeddings ordered by similarity
     */
    @Query(value = "SELECT * FROM financial_embeddings " +
                   "WHERE user_id = :userId " +
                   "ORDER BY embedding <=> CAST(:embedding AS vector) " +
                   "LIMIT :limit", 
           nativeQuery = true)
    List<FinancialEmbedding> findSimilar(
            @Param("embedding") String embedding,
            @Param("userId") Long userId,
            @Param("limit") int limit
    );

    /**
     * Find similar records within a specific workspace
     */
    @Query(value = "SELECT * FROM financial_embeddings " +
                   "WHERE user_id = :userId AND workspace_id = :workspaceId " +
                   "ORDER BY embedding <=> CAST(:embedding AS vector) " +
                   "LIMIT :limit", 
           nativeQuery = true)
    List<FinancialEmbedding> findSimilarInWorkspace(
            @Param("embedding") String embedding,
            @Param("userId") Long userId,
            @Param("workspaceId") Long workspaceId,
            @Param("limit") int limit
    );
}
