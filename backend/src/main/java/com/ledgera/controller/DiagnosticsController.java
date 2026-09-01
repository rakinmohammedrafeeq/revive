package com.ledgera.controller;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/diagnostics")
public class DiagnosticsController {

    @Value("${resend.api.key:NOT_SET}")
    private String resendApiKey;

    @Value("${resend.from.email:NOT_SET}")
    private String resendFromEmail;

    @Value("${resend.from.name:NOT_SET}")
    private String resendFromName;

    @Value("${app.base.url:NOT_SET}")
    private String appBaseUrl;

    @Value("${spring.datasource.url:NOT_SET}")
    private String dbUrl;

    @Value("${jwt.secret:NOT_SET}")
    private String jwtSecret;

    /**
     * Diagnostic endpoint to check environment configuration
     * WARNING: This endpoint should be secured or removed in production
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> checkConfig() {
        log.info("=== DIAGNOSTICS CONFIG CHECK ===");
        
        Map<String, Object> config = new HashMap<>();
        
        // Resend Configuration
        Map<String, Object> resendConfig = new HashMap<>();
        resendConfig.put("apiKeyConfigured", isConfigured(resendApiKey));
        resendConfig.put("apiKeyLength", resendApiKey != null ? resendApiKey.length() : 0);
        resendConfig.put("apiKeyPrefix", getPrefix(resendApiKey, 6));
        resendConfig.put("fromEmail", resendFromEmail);
        resendConfig.put("fromName", resendFromName);
        resendConfig.put("fromEmailConfigured", isConfigured(resendFromEmail));
        config.put("resend", resendConfig);
        
        // App Configuration
        Map<String, Object> appConfig = new HashMap<>();
        appConfig.put("baseUrl", appBaseUrl);
        appConfig.put("baseUrlConfigured", isConfigured(appBaseUrl));
        config.put("app", appConfig);
        
        // Database Configuration
        Map<String, Object> dbConfig = new HashMap<>();
        dbConfig.put("configured", isConfigured(dbUrl));
        dbConfig.put("urlPrefix", getPrefix(dbUrl, 20));
        config.put("database", dbConfig);
        
        // JWT Configuration
        Map<String, Object> jwtConfig = new HashMap<>();
        jwtConfig.put("configured", isConfigured(jwtSecret));
        jwtConfig.put("secretLength", jwtSecret != null ? jwtSecret.length() : 0);
        config.put("jwt", jwtConfig);
        
        // Overall Status
        boolean allConfigured = 
            isConfigured(resendApiKey) &&
            isConfigured(resendFromEmail) &&
            isConfigured(appBaseUrl) &&
            isConfigured(dbUrl) &&
            isConfigured(jwtSecret);
        
        config.put("status", allConfigured ? "OK" : "INCOMPLETE");
        config.put("timestamp", java.time.LocalDateTime.now().toString());
        
        log.info("Configuration status: {}", allConfigured ? "OK" : "INCOMPLETE");
        
        return ResponseEntity.ok(config);
    }
    
    private boolean isConfigured(String value) {
        return value != null && 
               !value.trim().isEmpty() && 
               !value.equals("NOT_SET") &&
               !value.contains("your_") &&
               !value.contains("_here");
    }
    
    private String getPrefix(String value, int length) {
        if (value == null || value.length() <= length) {
            return value;
        }
        return value.substring(0, length) + "...";
    }
}
