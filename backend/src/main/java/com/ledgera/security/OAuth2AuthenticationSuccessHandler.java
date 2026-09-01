package com.ledgera.security;

import com.ledgera.entity.User;
import com.ledgera.entity.Workspace;
import com.ledgera.entity.WorkspaceMember;
import com.ledgera.enums.Role;
import com.ledgera.enums.WorkspacePermission;
import com.ledgera.repository.UserRepository;
import com.ledgera.repository.WorkspaceRepository;
import com.ledgera.repository.WorkspaceMemberRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private static final Logger logger = LoggerFactory.getLogger(OAuth2AuthenticationSuccessHandler.class);

    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    
    @Value("${app.oauth2.redirect-uri:http://localhost:5173/oauth2/callback}")
    private String redirectUri;

    public OAuth2AuthenticationSuccessHandler(
            JwtTokenProvider jwtTokenProvider,
            UserRepository userRepository,
            WorkspaceRepository workspaceRepository,
            WorkspaceMemberRepository workspaceMemberRepository) {
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.workspaceRepository = workspaceRepository;
        this.workspaceMemberRepository = workspaceMemberRepository;
    }

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication) throws IOException {
        
        if (response.isCommitted()) {
            logger.debug("Response has already been committed. Unable to redirect.");
            return;
        }

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        
        // Extract user info from Google
        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");
        String googleId = oAuth2User.getAttribute("sub");
        
        logger.info("OAuth2 login successful for email: {}", email);

        // Check if user exists
        boolean isNewUser = !userRepository.existsByEmail(email);
        
        // Find or create user
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            logger.info("Creating new user from OAuth2: {}", email);
            User newUser = User.builder()
                    .email(email)
                    .name(name != null ? name : email.split("@")[0])
                    .password("") // OAuth users don't have password
                    .role(Role.ANALYST) // Default to ANALYST for new OAuth users (same as register)
                    .active(true)
                    .build();
            return userRepository.save(newUser);
        });
        
        // If this is a new user, create their default workspace
        if (isNewUser) {
            String firstName = extractFirstName(user.getName());
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
            
            logger.info("✅ Created default workspace for new OAuth user: {} (Workspace: {})", email, workspaceName);
        }
        
        // If user has password but logged in via OAuth, update to allow OAuth
        // This ensures existing accounts work with both login methods
        if (user.getPassword() != null && !user.getPassword().isEmpty()) {
            logger.info("✅ Existing account found for OAuth login: {} (Role: {})", email, user.getRole());
        }

        // Check if user is active
        if (!user.getActive()) {
            String errorUrl = UriComponentsBuilder.fromUriString(redirectUri)
                    .queryParam("error", "account_disabled")
                    .build().toUriString();
            getRedirectStrategy().sendRedirect(request, response, errorUrl);
            return;
        }

        // Generate JWT token with workspace context if available
        Long workspaceId = null;
        if (user.getCurrentWorkspace() != null) {
            workspaceId = user.getCurrentWorkspace().getId();
        } else {
            // Find user's first workspace and set it as current (same logic as email/password login)
            var workspaces = workspaceRepository.findWorkspacesByUserId(user.getId());
            if (!workspaces.isEmpty()) {
                workspaceId = workspaces.get(0).getId();
                user.setCurrentWorkspace(workspaces.get(0));
                userRepository.save(user);
                logger.info("Set default workspace for OAuth user: {} (Workspace: {})", email, workspaces.get(0).getName());
            }
        }

        String token = workspaceId != null
                ? jwtTokenProvider.generateTokenWithWorkspace(user.getEmail(), user.getRole().name(), workspaceId)
                : jwtTokenProvider.generateTokenFromEmail(user.getEmail(), user.getRole().name());
        
        // Redirect to frontend with token and role
        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", token)
                .queryParam("email", email)
                .queryParam("name", user.getName())
                .queryParam("role", user.getRole().name())
                .build().toUriString();

        logger.info("Redirecting to: {} with role: {}", targetUrl, user.getRole().name());
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
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
}
