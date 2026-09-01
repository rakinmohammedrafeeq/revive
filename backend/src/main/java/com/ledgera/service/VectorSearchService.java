package com.ledgera.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ledgera.entity.FinancialEmbedding;
import com.ledgera.entity.FinancialRecord;
import com.ledgera.repository.FinancialEmbeddingRepository;
import com.ledgera.repository.FinancialRecordRepository;
import com.pgvector.PGvector;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Service for vector-based semantic search of financial records
 * Core component of RAG pipeline
 */
@Service
public class VectorSearchService {

    private static final Logger logger = LoggerFactory.getLogger(VectorSearchService.class);

    private final EmbeddingService embeddingService;
    private final FinancialEmbeddingRepository embeddingRepository;
    private final FinancialRecordRepository financialRecordRepository;
    private final ObjectMapper objectMapper;

    public VectorSearchService(
            EmbeddingService embeddingService,
            FinancialEmbeddingRepository embeddingRepository,
            FinancialRecordRepository financialRecordRepository,
            ObjectMapper objectMapper) {
        this.embeddingService = embeddingService;
        this.embeddingRepository = embeddingRepository;
        this.financialRecordRepository = financialRecordRepository;
        this.objectMapper = objectMapper;
    }

    /**
     * Index a financial record for vector search
     */
    @Transactional(propagation = org.springframework.transaction.annotation.Propagation.REQUIRES_NEW)
    public void indexFinancialRecord(FinancialRecord record, Long userId, Long workspaceId) {
        try {
            // Create searchable text from record
            String content = buildRecordContent(record);
            
            // Generate embedding
            float[] embeddingArray = embeddingService.generateEmbedding(content);
            PGvector pgVector = new PGvector(embeddingArray);
            
            // Create metadata
            Map<String, Object> metadata = new HashMap<>();
            metadata.put("amount", record.getAmount());
            metadata.put("type", record.getType());
            metadata.put("category", record.getCategory());
            metadata.put("date", record.getDate().toString());
            
            String metadataJson = objectMapper.writeValueAsString(metadata);
            
            // Save embedding
            FinancialEmbedding embedding = FinancialEmbedding.builder()
                    .userId(userId)
                    .workspaceId(workspaceId)
                    .recordId(record.getId())
                    .content(content)
                    .embedding(pgVector)
                    .metadata(metadataJson)
                    .build();
            
            embeddingRepository.save(embedding);
            
            logger.debug("Indexed financial record {} for vector search", record.getId());
            
        } catch (Exception e) {
            logger.error("Error indexing financial record: {}", e.getMessage(), e);
            // Don't propagate exception - indexing is optional
        }
    }

    /**
     * Search for similar financial records using semantic search
     */
    public List<FinancialRecord> searchSimilar(String query, Long userId, Long workspaceId, int limit) {
        try {
            // Generate query embedding
            float[] queryEmbedding = embeddingService.generateEmbedding(query);
            String embeddingStr = formatEmbeddingForQuery(queryEmbedding);
            
            // Search for similar embeddings
            List<FinancialEmbedding> similarEmbeddings;
            if (workspaceId != null) {
                similarEmbeddings = embeddingRepository.findSimilarInWorkspace(
                        embeddingStr, userId, workspaceId, limit);
            } else {
                similarEmbeddings = embeddingRepository.findSimilar(
                        embeddingStr, userId, limit);
            }
            
            // Retrieve actual financial records
            List<Long> recordIds = similarEmbeddings.stream()
                    .map(FinancialEmbedding::getRecordId)
                    .filter(Objects::nonNull)
                    .collect(Collectors.toList());
            
            if (recordIds.isEmpty()) {
                return Collections.emptyList();
            }
            
            List<FinancialRecord> records = financialRecordRepository.findAllById(recordIds);
            
            logger.info("Found {} similar records for query: {}", records.size(), query);
            
            return records;
            
        } catch (Exception e) {
            logger.error("Error searching similar records: {}", e.getMessage(), e);
            return Collections.emptyList();
        }
    }

    /**
     * Get relevant context for RAG
     * Returns formatted text with relevant financial information
     */
    public String getRelevantContext(String query, Long userId, Long workspaceId, int maxRecords) {
        List<FinancialRecord> similarRecords = searchSimilar(query, userId, workspaceId, maxRecords);
        
        if (similarRecords.isEmpty()) {
            return "No relevant financial records found.";
        }
        
        StringBuilder context = new StringBuilder();
        context.append("Relevant Financial Records:\n\n");
        
        for (int i = 0; i < similarRecords.size(); i++) {
            FinancialRecord record = similarRecords.get(i);
            context.append(String.format("%d. %s - $%.2f (%s) on %s - %s\n",
                    i + 1,
                    record.getCategory(),
                    record.getAmount(),
                    record.getType(),
                    record.getDate(),
                    record.getDescription() != null ? record.getDescription() : "No description"
            ));
        }
        
        return context.toString();
    }

    /**
     * Reindex all financial records for a user
     */
    @Transactional
    public void reindexAllRecords(Long userId, Long workspaceId) {
        logger.info("Reindexing all records for user {} in workspace {}", userId, workspaceId);
        
        List<FinancialRecord> records;
        if (workspaceId != null) {
            records = financialRecordRepository.findByWorkspaceIdOrderByDateDesc(workspaceId);
        } else {
            records = financialRecordRepository.findByUserIdOrderByDateDesc(userId);
        }
        
        for (FinancialRecord record : records) {
            indexFinancialRecord(record, userId, workspaceId);
        }
        
        logger.info("Reindexed {} records", records.size());
    }

    /**
     * Delete embedding when record is deleted
     */
    @Transactional
    public void deleteEmbedding(Long recordId) {
        embeddingRepository.deleteByRecordId(recordId);
    }

    /**
     * Build searchable content from financial record
     */
    private String buildRecordContent(FinancialRecord record) {
        StringBuilder content = new StringBuilder();
        content.append(record.getType()).append(" ");
        content.append(record.getCategory()).append(" ");
        content.append("$").append(record.getAmount()).append(" ");
        if (record.getDescription() != null && !record.getDescription().isEmpty()) {
            content.append(record.getDescription()).append(" ");
        }
        content.append(record.getDate().toString());
        return content.toString();
    }

    /**
     * Format embedding array for PostgreSQL vector query
     */
    private String formatEmbeddingForQuery(float[] embedding) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < embedding.length; i++) {
            if (i > 0) sb.append(",");
            sb.append(embedding[i]);
        }
        sb.append("]");
        return sb.toString();
    }
}
