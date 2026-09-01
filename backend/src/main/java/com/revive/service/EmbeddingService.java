package com.revive.service;

import ai.djl.Application;
import ai.djl.MalformedModelException;
import ai.djl.inference.Predictor;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ModelNotFoundException;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.huggingface.translator.TextEmbeddingTranslatorFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.io.IOException;

/**
 * Service for generating text embeddings using local Sentence Transformers model
 * Uses all-MiniLM-L6-v2 - FREE, fast, and perfect for semantic search
 * Model size: ~80MB, runs locally, no API costs
 * 
 * MEMORY OPTIMIZATION: Lazy loading - model only loads when first used
 */
@Service
public class EmbeddingService {

    private static final Logger logger = LoggerFactory.getLogger(EmbeddingService.class);
    private static final String MODEL_URL = "djl://ai.djl.huggingface.pytorch/sentence-transformers/all-MiniLM-L6-v2";
    private static final int EMBEDDING_DIMENSION = 384;
    
    private ZooModel<String, float[]> model;
    private boolean initialized = false;
    private boolean disabled = false; // Flag to disable embeddings in low-memory environments

    @PostConstruct
    public void checkEnvironment() {
        // Check if we should disable embeddings in production (low memory)
        String disableEmbeddings = System.getenv("DISABLE_EMBEDDINGS");
        if ("true".equalsIgnoreCase(disableEmbeddings)) {
            disabled = true;
            logger.warn("⚠️ Embeddings disabled via DISABLE_EMBEDDINGS=true (memory optimization)");
        } else {
            logger.info("Embedding service ready for lazy initialization (will load on first use)");
        }
    }

    /**
     * Lazy initialization - only loads model when first generateEmbedding is called
     */
    private synchronized void initializeIfNeeded() {
        if (disabled) {
            return; // Skip initialization if disabled
        }
        
        if (initialized || model != null) {
            return; // Already initialized
        }
        
        try {
            logger.info("Loading embedding model (all-MiniLM-L6-v2)... This may take a minute on first run.");
            
            Criteria<String, float[]> criteria = Criteria.builder()
                    .setTypes(String.class, float[].class)
                    .optModelUrls(MODEL_URL)
                    .optEngine("PyTorch")
                    .optApplication(Application.NLP.TEXT_EMBEDDING)
                    .optTranslatorFactory(new TextEmbeddingTranslatorFactory())
                    .build();
            
            model = criteria.loadModel();
            initialized = true;
            
            logger.info("✅ Embedding model loaded successfully! Dimension: {}", EMBEDDING_DIMENSION);
        } catch (ModelNotFoundException | MalformedModelException | IOException e) {
            logger.error("❌ Failed to load embedding model. RAG features will be disabled.", e);
            initialized = false;
            disabled = true; // Disable after failed attempt
        }
    }

    @PreDestroy
    public void cleanup() {
        if (model != null) {
            model.close();
            logger.info("Embedding model closed");
        }
    }

    /**
     * Generate embedding vector for text
     * @param text Input text
     * @return float array of embeddings (384 dimensions)
     */
    public float[] generateEmbedding(String text) {
        // Lazy initialization on first use
        if (!initialized && !disabled) {
            initializeIfNeeded();
        }
        
        if (!initialized || model == null || disabled) {
            logger.warn("Embedding model not available, returning zero vector");
            return new float[EMBEDDING_DIMENSION];
        }

        if (text == null || text.trim().isEmpty()) {
            logger.warn("Empty text provided for embedding");
            return new float[EMBEDDING_DIMENSION];
        }

        try (Predictor<String, float[]> predictor = model.newPredictor()) {
            float[] embedding = predictor.predict(text.trim());
            logger.debug("Generated embedding for text: {} (dimension: {})", 
                    text.substring(0, Math.min(50, text.length())), embedding.length);
            return embedding;
        } catch (Exception e) {
            logger.error("Error generating embedding: {}", e.getMessage());
            return new float[EMBEDDING_DIMENSION];
        }
    }

    /**
     * Calculate cosine similarity between two embedding vectors
     * @param a First vector
     * @param b Second vector
     * @return Similarity score (0 to 1, higher is more similar)
     */
    public double cosineSimilarity(float[] a, float[] b) {
        if (a.length != b.length) {
            throw new IllegalArgumentException("Vectors must have the same dimension");
        }

        double dotProduct = 0.0;
        double normA = 0.0;
        double normB = 0.0;

        for (int i = 0; i < a.length; i++) {
            dotProduct += a[i] * b[i];
            normA += a[i] * a[i];
            normB += b[i] * b[i];
        }

        return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
    }

    public boolean isInitialized() {
        return initialized;
    }

    public int getEmbeddingDimension() {
        return EMBEDDING_DIMENSION;
    }
}
