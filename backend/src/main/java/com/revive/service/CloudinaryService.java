package com.revive.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import io.github.cdimascio.dotenv.Dotenv;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
public class CloudinaryService {

    private static final Logger logger = LoggerFactory.getLogger(CloudinaryService.class);
    
    private final Cloudinary cloudinary;
    private final boolean isConfigured;

    public CloudinaryService() {
        Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
        
        String cloudName = dotenv.get("CLOUDINARY_CLOUD_NAME");
        String apiKey = dotenv.get("CLOUDINARY_API_KEY");
        String apiSecret = dotenv.get("CLOUDINARY_API_SECRET");
        
        if (cloudName != null && apiKey != null && apiSecret != null) {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", cloudName,
                    "api_key", apiKey,
                    "api_secret", apiSecret,
                    "secure", true
            ));
            this.isConfigured = true;
            logger.info("Cloudinary configured successfully with cloud: {}", cloudName);
        } else {
            this.cloudinary = null;
            this.isConfigured = false;
            logger.warn("Cloudinary not configured. Image upload features will be disabled.");
        }
    }

    /**
     * Upload receipt image to Cloudinary
     * 
     * @param file MultipartFile containing the image
     * @param userId User ID for folder organization
     * @return Map containing upload result with url, publicId, etc.
     * @throws IOException if upload fails
     */
    public Map<String, Object> uploadReceipt(MultipartFile file, Long userId) throws IOException {
        if (!isConfigured) {
            throw new IllegalStateException("Cloudinary is not configured");
        }

        // Upload to specific folder: revive/receipts/user_{userId}/
        String folder = "revive/receipts/user_" + userId;
        
        Map<String, Object> uploadParams = ObjectUtils.asMap(
                "folder", folder,
                "resource_type", "image",
                "format", "jpg", // Convert all images to JPG for consistency
                "quality", "auto:good", // Optimize quality automatically
                "width", 2000,
                "height", 2000,
                "crop", "limit", // Don't upscale, only downscale if needed
                "tags", new String[]{"receipt", "revive", "user_" + userId}
        );

        Map<String, Object> uploadResult = cloudinary.uploader().upload(
                file.getBytes(),
                uploadParams
        );

        logger.info("Receipt uploaded successfully to Cloudinary. Public ID: {}, URL: {}",
                uploadResult.get("public_id"), uploadResult.get("secure_url"));

        return uploadResult;
    }

    /**
     * Upload receipt with custom filename
     */
    public Map<String, Object> uploadReceiptWithFilename(
            MultipartFile file, 
            Long userId, 
            String customFilename) throws IOException {
        
        if (!isConfigured) {
            throw new IllegalStateException("Cloudinary is not configured");
        }

        String folder = "revive/receipts/user_" + userId;
        
        Map<String, Object> uploadParams = ObjectUtils.asMap(
                "folder", folder,
                "public_id", customFilename,
                "resource_type", "image",
                "format", "jpg",
                "quality", "auto:good",
                "width", 2000,
                "height", 2000,
                "crop", "limit",
                "tags", new String[]{"receipt", "revive", "user_" + userId}
        );

        return cloudinary.uploader().upload(file.getBytes(), uploadParams);
    }

    /**
     * Delete receipt image from Cloudinary
     * 
     * @param publicId The public ID of the image to delete
     * @return Map containing deletion result
     * @throws IOException if deletion fails
     */
    public Map<String, Object> deleteReceipt(String publicId) throws IOException {
        if (!isConfigured) {
            throw new IllegalStateException("Cloudinary is not configured");
        }

        Map<String, Object> deleteResult = cloudinary.uploader().destroy(
                publicId,
                ObjectUtils.emptyMap()
        );

        logger.info("Receipt deleted from Cloudinary. Public ID: {}, Result: {}",
                publicId, deleteResult.get("result"));

        return deleteResult;
    }

    /**
     * Get optimized URL for receipt display
     * 
     * @param publicId The public ID of the image
     * @param width Desired width (null for original)
     * @param height Desired height (null for original)
     * @return Optimized image URL
     */
    public String getOptimizedUrl(String publicId, Integer width, Integer height) {
        if (!isConfigured || publicId == null) {
            return null;
        }

        if (width != null && height != null) {
            return cloudinary.url()
                    .transformation(new com.cloudinary.Transformation()
                            .width(width)
                            .height(height)
                            .crop("fill")
                            .quality("auto:good")
                            .fetchFormat("auto"))
                    .generate(publicId);
        } else if (width != null) {
            return cloudinary.url()
                    .transformation(new com.cloudinary.Transformation()
                            .width(width)
                            .crop("scale")
                            .quality("auto:good")
                            .fetchFormat("auto"))
                    .generate(publicId);
        }

        return cloudinary.url().generate(publicId);
    }

    /**
     * Get thumbnail URL for receipt preview
     */
    public String getThumbnailUrl(String publicId) {
        return getOptimizedUrl(publicId, 300, 300);
    }

    /**
     * Check if Cloudinary is configured and available
     */
    public boolean isConfigured() {
        return isConfigured;
    }

    /**
     * Get user's receipt folder path
     */
    public String getUserReceiptFolder(Long userId) {
        return "revive/receipts/user_" + userId;
    }

    /**
     * List all receipts for a user (optional, for future use)
     */
    public Map<String, Object> listUserReceipts(Long userId, int maxResults) throws Exception {
        if (!isConfigured) {
            throw new IllegalStateException("Cloudinary is not configured");
        }

        String folder = getUserReceiptFolder(userId);
        
        Map<String, Object> searchParams = ObjectUtils.asMap(
                "expression", "folder:" + folder,
                "max_results", maxResults,
                "resource_type", "image"
        );

        return cloudinary.search().expression("folder:" + folder)
                .maxResults(maxResults)
                .execute();
    }
}
