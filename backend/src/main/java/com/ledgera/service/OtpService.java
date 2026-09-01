package com.ledgera.service;

import com.ledgera.dto.MessageResponse;
import com.ledgera.dto.RequestOtpRequest;
import com.ledgera.dto.ResetPasswordWithOtpRequest;
import com.ledgera.dto.VerifyOtpRequest;
import com.ledgera.entity.User;
import com.ledgera.exception.BadRequestException;
import com.ledgera.repository.UserRepository;
import com.ledgera.config.RateLimitConfig;
import io.github.bucket4j.Bucket;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Map;

@Slf4j
@Service
public class OtpService {

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int MAX_OTP_ATTEMPTS = 5;
    private static final int RESEND_COOLDOWN_SECONDS = 30; // Reduced from 60 to 30 seconds
    
    private final UserRepository userRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final Map<String, Bucket> passwordResetBuckets;
    private final RateLimitConfig rateLimitConfig;
    private final SecureRandom secureRandom;

    public OtpService(UserRepository userRepository,
                      EmailService emailService,
                      PasswordEncoder passwordEncoder,
                      Map<String, Bucket> passwordResetBuckets,
                      RateLimitConfig rateLimitConfig) {
        this.userRepository = userRepository;
        this.emailService = emailService;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetBuckets = passwordResetBuckets;
        this.rateLimitConfig = rateLimitConfig;
        this.secureRandom = new SecureRandom();
    }

    @Transactional
    public MessageResponse requestOtp(RequestOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        log.info("=== OTP REQUEST START ===");
        log.info("Email: {}", email);
        log.info("Step 1: Rate limiting check");

        // Rate limiting
        Bucket bucket = passwordResetBuckets.computeIfAbsent(email,
                k -> rateLimitConfig.createPasswordResetBucket());

        if (!bucket.tryConsume(1)) {
            log.warn("Step 1 FAILED: Rate limit exceeded for OTP request: {}", email);
            throw new BadRequestException("Too many OTP requests. Please try again later.");
        }
        log.info("Step 1 PASSED: Rate limit check successful");

        // Find user
        log.info("Step 2: Finding user by email");
        User user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {
            log.warn("Step 2: No account found for email: {}", email);
            // Return success to prevent email enumeration
            return MessageResponse.builder()
                    .message("If an account exists with this email, you will receive an OTP.")
                    .build();
        }
        log.info("Step 2 PASSED: User found - ID: {}, Name: {}", user.getId(), user.getName());

        // Check resend cooldown
        log.info("Step 3: Checking resend cooldown");
        if (user.getOtpLastSent() != null) {
            LocalDateTime cooldownEnd = user.getOtpLastSent().plusSeconds(RESEND_COOLDOWN_SECONDS);
            if (LocalDateTime.now().isBefore(cooldownEnd)) {
                long secondsRemaining = java.time.Duration.between(LocalDateTime.now(), cooldownEnd).getSeconds();
                log.warn("Step 3 FAILED: Cooldown active - {} seconds remaining", secondsRemaining);
                
                // Format time remaining in a user-friendly way
                String timeMessage;
                if (secondsRemaining < 60) {
                    timeMessage = secondsRemaining + " seconds";
                } else if (secondsRemaining < 3600) {
                    long minutes = secondsRemaining / 60;
                    timeMessage = minutes + " minute" + (minutes > 1 ? "s" : "");
                } else {
                    long hours = secondsRemaining / 3600;
                    long minutes = (secondsRemaining % 3600) / 60;
                    timeMessage = hours + " hour" + (hours > 1 ? "s" : "") + 
                                 (minutes > 0 ? " and " + minutes + " minute" + (minutes > 1 ? "s" : "") : "");
                }
                
                throw new BadRequestException("Please wait " + timeMessage + " before requesting a new OTP.");
            }
        }
        log.info("Step 3 PASSED: No active cooldown");

        // Generate OTP
        log.info("Step 4: Generating OTP");
        String otp = generateOtp();
        log.info("Step 4 PASSED: OTP generated successfully");

        // Save OTP
        log.info("Step 5: Saving OTP to database");
        user.setOtpCode(otp);
        user.setOtpExpiry(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        user.setOtpAttempts(0);
        user.setOtpLastSent(LocalDateTime.now());

        try {
            userRepository.save(user);
            log.info("Step 5 PASSED: OTP saved to database successfully");
        } catch (Exception e) {
            log.error("Step 5 FAILED: Database save error - {}", e.getMessage(), e);
            throw new BadRequestException("Unable to process request. Please try again.");
        }

        // Send OTP email
        log.info("Step 6: Preparing to send OTP email");
        log.info("Email recipient: {}", user.getEmail());
        log.info("User name: {}", user.getName());
        
        try {
            log.info("Step 6a: Calling emailService.sendOtpEmail()");
            emailService.sendOtpEmail(user.getEmail(), user.getName(), otp);
            log.info("Step 6 PASSED: OTP email sent successfully");
            log.info("=== OTP REQUEST SUCCESS ===");
        } catch (Exception e) {
            log.error("Step 6 FAILED: Email send error");
            log.error("Exception type: {}", e.getClass().getName());
            log.error("Exception message: {}", e.getMessage());
            log.error("Full stack trace:", e);
            
            // Rollback OTP
            log.info("Step 7: Rolling back OTP due to email failure");
            user.setOtpCode(null);
            user.setOtpExpiry(null);
            user.setOtpAttempts(0);
            user.setOtpLastSent(null);
            
            try {
                userRepository.save(user);
                log.info("Step 7 PASSED: OTP rollback successful");
            } catch (Exception rollbackError) {
                log.error("Step 7 FAILED: Rollback error - {}", rollbackError.getMessage(), rollbackError);
            }
            
            throw new BadRequestException("Failed to send OTP. Please try again later.");
        }

        return MessageResponse.builder()
                .message("If an account exists with this email, you will receive an OTP.")
                .build();
    }

    @Transactional
    public MessageResponse verifyOtp(VerifyOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        String otp = request.getOtp().trim();

        log.info("=== OTP VERIFICATION START ===");
        log.info("Email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid OTP"));

        // Check if OTP exists
        if (user.getOtpCode() == null || user.getOtpExpiry() == null) {
            throw new BadRequestException("No OTP found. Please request a new one.");
        }

        // Check expiry
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            user.setOtpCode(null);
            user.setOtpExpiry(null);
            user.setOtpAttempts(0);
            userRepository.save(user);
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        // Check attempts
        if (user.getOtpAttempts() >= MAX_OTP_ATTEMPTS) {
            user.setOtpCode(null);
            user.setOtpExpiry(null);
            user.setOtpAttempts(0);
            userRepository.save(user);
            throw new BadRequestException("Too many failed attempts. Please request a new OTP.");
        }

        // Verify OTP
        if (!otp.equals(user.getOtpCode())) {
            user.setOtpAttempts(user.getOtpAttempts() + 1);
            userRepository.save(user);
            int attemptsLeft = MAX_OTP_ATTEMPTS - user.getOtpAttempts();
            throw new BadRequestException("Invalid OTP. " + attemptsLeft + " attempts remaining.");
        }

        log.info("=== OTP VERIFICATION SUCCESS ===");

        return MessageResponse.builder()
                .message("OTP verified successfully")
                .build();
    }

    @Transactional
    public MessageResponse resetPasswordWithOtp(ResetPasswordWithOtpRequest request) {
        String email = request.getEmail().toLowerCase().trim();
        String otp = request.getOtp().trim();

        log.info("=== PASSWORD RESET WITH OTP START ===");
        log.info("Email: {}", email);

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("Invalid OTP"));

        // Check if OTP exists
        if (user.getOtpCode() == null || user.getOtpExpiry() == null) {
            throw new BadRequestException("No OTP found. Please request a new one.");
        }

        // Check expiry
        if (user.getOtpExpiry().isBefore(LocalDateTime.now())) {
            user.setOtpCode(null);
            user.setOtpExpiry(null);
            user.setOtpAttempts(0);
            userRepository.save(user);
            throw new BadRequestException("OTP has expired. Please request a new one.");
        }

        // Check attempts
        if (user.getOtpAttempts() >= MAX_OTP_ATTEMPTS) {
            user.setOtpCode(null);
            user.setOtpExpiry(null);
            user.setOtpAttempts(0);
            userRepository.save(user);
            throw new BadRequestException("Too many failed attempts. Please request a new OTP.");
        }

        // Verify OTP
        if (!otp.equals(user.getOtpCode())) {
            user.setOtpAttempts(user.getOtpAttempts() + 1);
            userRepository.save(user);
            int attemptsLeft = MAX_OTP_ATTEMPTS - user.getOtpAttempts();
            throw new BadRequestException("Invalid OTP. " + attemptsLeft + " attempts remaining.");
        }

        // Reset password
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        
        // Clear OTP
        user.setOtpCode(null);
        user.setOtpExpiry(null);
        user.setOtpAttempts(0);
        user.setOtpLastSent(null);
        
        userRepository.save(user);

        log.info("=== PASSWORD RESET WITH OTP SUCCESS ===");

        return MessageResponse.builder()
                .message("Password has been reset successfully")
                .build();
    }

    private String generateOtp() {
        int otp = secureRandom.nextInt(900000) + 100000; // 6-digit number
        return String.valueOf(otp);
    }
}
