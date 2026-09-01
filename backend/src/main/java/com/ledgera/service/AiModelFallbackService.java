package com.ledgera.service;

import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Supplier;

/**
 * Service for managing AI model fallbacks on rate limits
 * Supports cross-provider fallbacks between Gemini and Groq
 * Automatically tries fallback models when primary models hit rate limits
 */
@Service
public class AiModelFallbackService {

    private static final Logger logger = LoggerFactory.getLogger(AiModelFallbackService.class);

    private final List<ModelConfig> visionModels;
    private final List<ModelConfig> textModels;
    private final int maxRetryAttempts;
    private final long retryDelayMs;

    public AiModelFallbackService() {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();

        // Load vision models (support images) - Gemini + Groq
        this.visionModels = new ArrayList<>();
        addModelIfPresent(visionModels, dotenv, "GEMINI_VISION_PRIMARY", ModelProvider.GEMINI);
        addModelIfPresent(visionModels, dotenv, "GEMINI_VISION_FALLBACK1", ModelProvider.GEMINI);
        addModelIfPresent(visionModels, dotenv, "GEMINI_VISION_FALLBACK2", ModelProvider.GEMINI);
        addModelIfPresent(visionModels, dotenv, "GEMINI_VISION_FALLBACK3", ModelProvider.GEMINI);
        addModelIfPresent(visionModels, dotenv, "GROQ_VISION_MODEL", ModelProvider.GROQ);

        // Load text-only models - Gemini + Groq
        this.textModels = new ArrayList<>();
        addModelIfPresent(textModels, dotenv, "GEMINI_TEXT_PRIMARY", ModelProvider.GEMINI);
        addModelIfPresent(textModels, dotenv, "GEMINI_TEXT_FALLBACK1", ModelProvider.GEMINI);
        addModelIfPresent(textModels, dotenv, "GEMINI_TEXT_FALLBACK2", ModelProvider.GEMINI);
        addModelIfPresent(textModels, dotenv, "GEMINI_TEXT_FALLBACK3", ModelProvider.GEMINI);
        addModelIfPresent(textModels, dotenv, "GROQ_TEXT_MODEL", ModelProvider.GROQ);

        // Retry configuration
        this.maxRetryAttempts = Integer.parseInt(dotenv.get("AI_RETRY_ATTEMPTS", "3"));
        this.retryDelayMs = Long.parseLong(dotenv.get("AI_RETRY_DELAY_MS", "1000"));

        logger.info("AI Model Fallback Service initialized with cross-provider support");
        logger.info("Vision models: {}", visionModels);
        logger.info("Text models: {}", textModels);
        logger.info("Max retry attempts: {}", maxRetryAttempts);
    }

    private void addModelIfPresent(List<ModelConfig> list, Dotenv dotenv, String key, ModelProvider provider) {
        String value = dotenv.get(key);
        if (value != null && !value.isEmpty() && !value.startsWith("your_")) {
            list.add(new ModelConfig(value, provider));
        }
    }

    /**
     * Execute with automatic fallback on rate limits (Vision models)
     */
    public <T> T executeWithVisionFallback(CrossProviderExecutor<T> executor) throws Exception {
        return executeWithFallback(executor, visionModels, "VISION");
    }

    /**
     * Execute with automatic fallback on rate limits (Text models)
     */
    public <T> T executeWithTextFallback(CrossProviderExecutor<T> executor) throws Exception {
        return executeWithFallback(executor, textModels, "TEXT");
    }

    /**
     * Executes text generation with a caller-selected primary model, followed by
     * the configured cross-provider fallbacks. This is used by flows that have a
     * dedicated primary model setting (such as the tool-calling agent).
     */
    public <T> T executeWithTextFallback(
            String primaryModel,
            ModelProvider primaryProvider,
            CrossProviderExecutor<T> executor) throws Exception {
        List<ModelConfig> orderedModels = new ArrayList<>();
        orderedModels.add(new ModelConfig(primaryModel, primaryProvider));
        for (ModelConfig configuredModel : textModels) {
            if (configuredModel.provider != primaryProvider
                    || !configuredModel.modelName.equals(primaryModel)) {
                orderedModels.add(configuredModel);
            }
        }
        return executeWithFallback(executor, orderedModels, "TEXT");
    }

    /**
     * Core fallback logic with cross-provider support
     */
    private <T> T executeWithFallback(CrossProviderExecutor<T> executor, List<ModelConfig> models, String type) throws Exception {
        if (models.isEmpty()) {
            throw new IllegalStateException("No " + type + " models configured");
        }

        Exception lastException = null;

        for (int i = 0; i < models.size(); i++) {
            ModelConfig modelConfig = models.get(i);
            String modelLabel = i == 0 ? "PRIMARY" : "FALLBACK" + i;

            logger.info("Trying {} {} model: {} (provider: {})", type, modelLabel, modelConfig.modelName, modelConfig.provider);

            try {
                T result = executor.execute(modelConfig.modelName, modelConfig.provider);
                
                if (i > 0) {
                    logger.warn("Successfully used {} {} ({}) after primary failed", 
                            modelLabel, modelConfig.modelName, modelConfig.provider);
                }
                
                return result;

            } catch (Exception e) {
                lastException = e;
                String errorMessage = e.getMessage() != null ? e.getMessage().toLowerCase() : "";

                // Check if it's a rate limit error
                if (isRateLimitError(errorMessage)) {
                    logger.warn("{} {} model rate limited: {} ({}). Trying fallback...", 
                            type, modelLabel, modelConfig.modelName, modelConfig.provider);
                    
                    // Wait before trying next model
                    if (i < models.size() - 1) {
                        try {
                            Thread.sleep(retryDelayMs);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                        }
                    }
                    continue;
                }

                // Check if it's a quota exceeded error
                if (isQuotaExceededError(errorMessage)) {
                    logger.error("{} {} model quota exceeded: {} ({}). Trying fallback...", 
                            type, modelLabel, modelConfig.modelName, modelConfig.provider);
                    
                    if (i < models.size() - 1) {
                        try {
                            Thread.sleep(retryDelayMs);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                        }
                    }
                    continue;
                }

                // For other errors, fail immediately (don't waste quota on other models)
                logger.error("{} {} model failed with non-rate-limit error: {} ({})", 
                        type, modelLabel, e.getMessage(), modelConfig.provider);
                throw e;
            }
        }

        // All models failed
        logger.error("All {} models exhausted. Last error: {}", type, 
                lastException != null ? lastException.getMessage() : "Unknown");
        throw new Exception("All " + type + " models failed. Last error: " + 
                (lastException != null ? lastException.getMessage() : "Unknown"), lastException);
    }

    /**
     * Check if error is a rate limit error
     */
    private boolean isRateLimitError(String errorMessage) {
        return errorMessage.contains("rate limit") ||
               errorMessage.contains("429") ||
               errorMessage.contains("too many requests") ||
               errorMessage.contains("resource_exhausted") ||
               errorMessage.contains("rate_limit_exceeded");
    }

    /**
     * Check if error is a quota exceeded error
     */
    private boolean isQuotaExceededError(String errorMessage) {
        return errorMessage.contains("quota") ||
               errorMessage.contains("quota exceeded") ||
               errorMessage.contains("insufficient quota") ||
               errorMessage.contains("quota_exceeded");
    }

    /**
     * Get primary vision model config
     */
    public ModelConfig getPrimaryVisionModel() {
        return visionModels.isEmpty() ? new ModelConfig("gemini-3.6-flash", ModelProvider.GEMINI) : visionModels.get(0);
    }

    /**
     * Get primary text model config
     */
    public ModelConfig getPrimaryTextModel() {
        return textModels.isEmpty() ? new ModelConfig("gemini-3.5-flash-lite", ModelProvider.GEMINI) : textModels.get(0);
    }

    /**
     * Check if vision models are configured
     */
    public boolean hasVisionModels() {
        return !visionModels.isEmpty();
    }

    /**
     * Check if text models are configured
     */
    public boolean hasTextModels() {
        return !textModels.isEmpty();
    }

    /**
     * Functional interface for cross-provider model execution
     */
    @FunctionalInterface
    public interface CrossProviderExecutor<T> {
        T execute(String modelName, ModelProvider provider) throws Exception;
    }

    /**
     * Model configuration with provider info
     */
    public static class ModelConfig {
        public final String modelName;
        public final ModelProvider provider;

        public ModelConfig(String modelName, ModelProvider provider) {
            this.modelName = modelName;
            this.provider = provider;
        }

        @Override
        public String toString() {
            return modelName + " (" + provider + ")";
        }
    }

    /**
     * Supported AI providers
     */
    public enum ModelProvider {
        GEMINI,
        GROQ
    }
}
