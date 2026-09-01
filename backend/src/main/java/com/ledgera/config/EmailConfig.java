package com.ledgera.config;

import com.resend.Resend;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Slf4j
@Configuration
public class EmailConfig {

    @Value("${resend.api.key}")
    private String resendApiKey;

    @Bean
    public Resend resend() {
        log.info("=== RESEND CONFIG INIT ===");
        log.info("API Key present: {}", resendApiKey != null && !resendApiKey.isBlank());
        log.info("API Key length: {}", resendApiKey != null ? resendApiKey.length() : 0);
        if (resendApiKey != null && resendApiKey.length() > 6) {
            log.info("API Key prefix: {}", resendApiKey.substring(0, 6) + "...");
        }

        if (resendApiKey == null || resendApiKey.trim().isEmpty() || resendApiKey.contains("your_resend_api_key_here")) {
            log.error("RESEND_API_KEY is not configured properly!");
            log.error("Current value: '{}'", resendApiKey);
            // Return a client anyway to prevent app crash - will fail at send time with clear error
            log.warn("Creating Resend client with empty key - email sending will fail");
            return new Resend("invalid_key");
        }

        log.info("=== RESEND CONFIG OK ===");
        return new Resend(resendApiKey);
    }
}
