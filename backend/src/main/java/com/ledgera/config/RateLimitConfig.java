package com.ledgera.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Configuration
public class RateLimitConfig {

    /**
     * Rate limiter for password reset requests
     * Allows 10 requests per 15 minutes per email (increased for development)
     */
    @Bean
    public Map<String, Bucket> passwordResetBuckets() {
        return new ConcurrentHashMap<>();
    }

    public Bucket createPasswordResetBucket() {
        Bandwidth limit = Bandwidth.classic(10, Refill.intervally(10, Duration.ofMinutes(15)));
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }
}
