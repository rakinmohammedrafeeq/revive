package com.ledgera.service;

import com.ledgera.dto.*;
import com.ledgera.entity.User;
import com.ledgera.entity.Workspace;
import com.ledgera.entity.WorkspaceMember;
import com.ledgera.enums.Role;
import com.ledgera.enums.WorkspacePermission;
import com.ledgera.exception.BadRequestException;
import com.ledgera.exception.ResourceNotFoundException;
import com.ledgera.repository.UserRepository;
import com.ledgera.repository.WorkspaceRepository;
import com.ledgera.repository.WorkspaceMemberRepository;
import com.ledgera.security.JwtTokenProvider;
import com.ledgera.config.RateLimitConfig;
import io.github.bucket4j.Bucket;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final EmailService emailService;
    private final Map<String, Bucket> passwordResetBuckets;
    private final RateLimitConfig rateLimitConfig;

    public AuthService(UserRepository userRepository,
                       WorkspaceRepository workspaceRepository,
                       WorkspaceMemberRepository workspaceMemberRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtTokenProvider jwtTokenProvider,
                       EmailService emailService,
                       Map<String, Bucket> passwordResetBuckets,
                       RateLimitConfig rateLimitConfig) {
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.emailService = emailService;
        this.passwordResetBuckets = passwordResetBuckets;
        this.rateLimitConfig = rateLimitConfig;
    }

    public AuthResponse login(LoginRequest request) {
        // verify credentials through the authentication manager
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Get current workspace or default workspace
        Long workspaceId = null;
        if (user.getCurrentWorkspace() != null) {
            workspaceId = user.getCurrentWorkspace().getId();
        } else {
            // Find user's first workspace
            var workspaces = workspaceRepository.findWorkspacesByUserId(user.getId());
            if (!workspaces.isEmpty()) {
                workspaceId = workspaces.get(0).getId();
                user.setCurrentWorkspace(workspaces.get(0));
                userRepository.save(user);
            }
        }

        // issue a JWT with workspace context
        String token = workspaceId != null 
            ? jwtTokenProvider.generateTokenWithWorkspace(user.getEmail(), user.getRole().name(), workspaceId)
            : jwtTokenProvider.generateTokenFromEmail(user.getEmail(), user.getRole().name());

        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // prevent duplicate accounts
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email is already registered");
        }

        // Automatically assign ANALYST role (full access to their own workspace)
        Role role = Role.ANALYST;

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .active(true)
                .build();

        user = userRepository.save(user);

        // Create default workspace with user's first name
        String firstName = extractFirstName(request.getName());
        String workspaceName = firstName + "'s Workspace";
        String slug = generateSlug(workspaceName) + "-" + user.getId();
        
        Workspace workspace = Workspace.builder()
                .name(workspaceName)
                .slug(slug)
                .owner(user)
                .isActive(true)
                .build();
        
        workspace = workspaceRepository.save(workspace);
        
        // Add user as OWNER of their workspace
        WorkspaceMember member = WorkspaceMember.builder()
                .workspace(workspace)
                .user(user)
                .permission(WorkspacePermission.OWNER)
                .isActive(true)
                .build();
        
        workspaceMemberRepository.save(member);
        
        // Set as current workspace
        user.setCurrentWorkspace(workspace);
        userRepository.save(user);

        String token = jwtTokenProvider.generateTokenWithWorkspace(
                user.getEmail(), 
                user.getRole().name(), 
                workspace.getId()
        );

        return AuthResponse.builder()
                .token(token)
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    private String extractFirstName(String fullName) {
        if (fullName == null || fullName.trim().isEmpty()) {
            return "User";
        }
        String[] parts = fullName.trim().split("\\s+");
        return parts[0];
    }

    private String generateSlug(String name) {
        return name.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    public MessageResponse forgotPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        log.info("=== FORGOT PASSWORD REQUEST START ===");
        log.info("Email: {}", email);

        // Step 1: Rate limiting
        Bucket bucket = passwordResetBuckets.computeIfAbsent(email,
            k -> rateLimitConfig.createPasswordResetBucket());

        if (!bucket.tryConsume(1)) {
            log.warn("Rate limit exceeded for password reset: {}", email);
            throw new BadRequestException("Too many password reset requests. Please try again later.");
        }
        log.info("Step 1 PASSED: Rate limit check OK");

        // Step 2: Find user
        User user;
        try {
            user = userRepository.findByEmail(email)
                    .orElse(null);
        } catch (Exception e) {
            log.error("Step 2 FAILED: Database query error: {}", e.getMessage(), e);
            throw new BadRequestException("Unable to process request. Please try again.");
        }

        if (user == null) {
            log.warn("Step 2: No account found for email: {}", email);
            // Return success message anyway to avoid email enumeration
            return MessageResponse.builder()
                    .message("If an account exists with this email, you will receive password reset instructions.")
                    .build();
        }
        log.info("Step 2 PASSED: User found - name={}, id={}", user.getName(), user.getId());

        // Step 3: Generate reset token
        String resetToken = UUID.randomUUID().toString();
        user.setResetToken(resetToken);
        user.setResetTokenExpiry(LocalDateTime.now().plusMinutes(15));
        log.info("Step 3 PASSED: Reset token generated");

        // Step 4: Save token to database
        try {
            userRepository.save(user);
            log.info("Step 4 PASSED: Token saved to database");
        } catch (Exception e) {
            log.error("Step 4 FAILED: Could not save token: {}", e.getMessage(), e);
            throw new BadRequestException("Unable to process request. Please try again.");
        }

        // Step 5: Send email
        try {
            log.info("Step 5: Sending email via Resend...");
            emailService.sendPasswordResetEmail(user.getEmail(), user.getName(), resetToken);
            log.info("Step 5 PASSED: Email sent successfully");
        } catch (Exception e) {
            log.error("Step 5 FAILED: Email send error: {} - {}", e.getClass().getSimpleName(), e.getMessage(), e);
            // Rollback the token since email failed
            try {
                user.setResetToken(null);
                user.setResetTokenExpiry(null);
                userRepository.save(user);
            } catch (Exception rollbackEx) {
                log.error("Token rollback also failed: {}", rollbackEx.getMessage());
            }
            throw new BadRequestException("Failed to send password reset email. Please try again later.");
        }

        log.info("=== FORGOT PASSWORD REQUEST SUCCESS ===");
        return MessageResponse.builder()
                .message("If an account exists with this email, you will receive password reset instructions.")
                .build();
    }

    public MessageResponse resetPassword(ResetPasswordRequest request) {
        User user = userRepository.findByResetToken(request.getToken())
                // reject unknown reset tokens
                .orElseThrow(() -> new BadRequestException("Invalid reset token"));

        // enforce token expiry window
        if (user.getResetTokenExpiry() == null || user.getResetTokenExpiry().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Reset token has expired");
        }

        // update stored password hash
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        // clear token after successful reset
        user.setResetToken(null);
        user.setResetTokenExpiry(null);
        userRepository.save(user);

        return MessageResponse.builder()
                .message("Password has been reset successfully")
                .build();
    }
}
