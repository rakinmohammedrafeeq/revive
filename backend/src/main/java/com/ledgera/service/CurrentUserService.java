package com.ledgera.service;

import com.ledgera.entity.User;
import com.ledgera.exception.UnauthorizedException;
import com.ledgera.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

@Service
public class CurrentUserService {

    private final UserRepository userRepository;

    public CurrentUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User requireCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        // require an authenticated security context
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new UnauthorizedException("Authentication required");
        }

        String email = authentication.getName();
        // guard against anonymous or blank principals
        if (email == null || email.isBlank() || "anonymousUser".equalsIgnoreCase(email)) {
            throw new UnauthorizedException("Invalid authentication principal");
        }

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UnauthorizedException("Authenticated user not found"));
    }
}
