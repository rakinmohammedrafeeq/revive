package com.ledgera.controller;

import com.ledgera.dto.*;
import com.ledgera.service.CloudinaryService;
import com.ledgera.service.CurrentUserService;
import com.ledgera.service.GeminiAiService;
import com.ledgera.service.GroqAiService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AiController {

    private static final Logger logger = LoggerFactory.getLogger(AiController.class);
    private final GeminiAiService geminiAiService;  // For vision/OCR tasks
    private final GroqAiService groqAiService;      // For text-based tasks (categorization, insights)
    private final CloudinaryService cloudinaryService;
    private final CurrentUserService currentUserService;

    public AiController(
            GeminiAiService geminiAiService,
            GroqAiService groqAiService,
            CloudinaryService cloudinaryService,
            CurrentUserService currentUserService) {
        this.geminiAiService = geminiAiService;
        this.groqAiService = groqAiService;
        this.cloudinaryService = cloudinaryService;
        this.currentUserService = currentUserService;
    }

    /**
     * AI-powered transaction categorization
     * Uses Groq for fast, generous-quota text categorization
     */
    @PostMapping("/categorize")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<AiCategorizationResponse> categorizeTransaction(
            @Valid @RequestBody AiCategorizationRequest request) {
        
        logger.info("AI categorization request for: {}", request.getDescription());
        
        // Use Groq for text-based categorization (better free quota)
        AiCategorizationResponse response = groqAiService.categorizeTransaction(request);
        
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * AI-powered receipt OCR and data extraction
     * Uses Gemini Vision for image understanding
     * Then uses Groq for category refinement if needed
     */
    @PostMapping(value = "/receipt", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<AiReceiptResponse> processReceipt(
            @RequestParam("file") MultipartFile file) {
        
        logger.info("Receipt upload request: {} ({} bytes)", 
                file.getOriginalFilename(), file.getSize());
        
        // Validate file
        if (file.isEmpty()) {
            AiReceiptResponse errorResponse = AiReceiptResponse.builder()
                    .success(false)
                    .error("File is empty")
                    .build();
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        // Check file type
        String contentType = file.getContentType();
        if (contentType == null || 
                (!contentType.startsWith("image/jpeg") && 
                 !contentType.startsWith("image/png") &&
                 !contentType.startsWith("image/jpg"))) {
            AiReceiptResponse errorResponse = AiReceiptResponse.builder()
                    .success(false)
                    .error("Only JPEG and PNG images are supported")
                    .build();
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        // Check file size (max 10MB)
        if (file.getSize() > 10 * 1024 * 1024) {
            AiReceiptResponse errorResponse = AiReceiptResponse.builder()
                    .success(false)
                    .error("File size must be less than 10MB")
                    .build();
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        try {
            // Get current user
            Long userId = currentUserService.requireCurrentUser().getId();
            
            // Upload to Cloudinary first
            Map<String, Object> uploadResult = null;
            String cloudinaryUrl = null;
            String publicId = null;
            
            if (cloudinaryService.isConfigured()) {
                logger.info("Uploading receipt to Cloudinary for user {}", userId);
                uploadResult = cloudinaryService.uploadReceipt(file, userId);
                cloudinaryUrl = (String) uploadResult.get("secure_url");
                publicId = (String) uploadResult.get("public_id");
                logger.info("Receipt uploaded to Cloudinary: {}", cloudinaryUrl);
            } else {
                logger.warn("Cloudinary not configured, processing without upload");
            }
            
            // Process with Gemini Vision (best for OCR/image understanding)
            byte[] imageData = file.getBytes();
            AiReceiptResponse response = geminiAiService.processReceipt(imageData, contentType);
            
            // Add Cloudinary URL to response
            if (cloudinaryUrl != null) {
                response.setCloudinaryUrl(cloudinaryUrl);
                response.setCloudinaryPublicId(publicId);
            }
            
            if (!response.isSuccess()) {
                // If AI processing failed but we uploaded to Cloudinary, clean up
                if (publicId != null && cloudinaryService.isConfigured()) {
                    try {
                        cloudinaryService.deleteReceipt(publicId);
                        logger.info("Cleaned up Cloudinary upload after AI failure");
                    } catch (Exception e) {
                        logger.error("Failed to clean up Cloudinary upload", e);
                    }
                }
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Error processing receipt", e);
            AiReceiptResponse errorResponse = AiReceiptResponse.builder()
                    .success(false)
                    .error("Failed to process receipt: " + e.getMessage())
                    .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }

    /**
     * AI-generated financial insights for current workspace
     * Uses Groq for fast, generous-quota text analysis
     */
    @GetMapping("/insights")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<AiInsightsResponse> getInsights() {
        
        logger.info("AI insights request");
        
        // Use Groq for text-based insights (better free quota)
        AiInsightsResponse response = groqAiService.generateInsights();
        
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
        
        return ResponseEntity.ok(response);
    }

    /**
     * Health check for AI service
     */
    @GetMapping("/health")
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST', 'VIEWER')")
    public ResponseEntity<MessageResponse> checkAiHealth() {
        return ResponseEntity.ok(new MessageResponse("AI service is available"));
    }
}
