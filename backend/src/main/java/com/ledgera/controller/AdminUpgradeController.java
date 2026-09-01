package com.ledgera.controller;

import com.ledgera.entity.User;
import com.ledgera.enums.Role;
import com.ledgera.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * TEMPORARY endpoint to upgrade user to ADMIN
 * Remove this in production!
 */
@RestController
@RequestMapping("/api/admin-upgrade")
public class AdminUpgradeController {

    private static final Logger logger = LoggerFactory.getLogger(AdminUpgradeController.class);
    private final UserRepository userRepository;

    public AdminUpgradeController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    /**
     * Upgrade specific user to ADMIN role
     * This is a temporary development endpoint
     */
    @PostMapping("/make-admin/{email}")
    public ResponseEntity<Map<String, String>> upgradeToAdmin(@PathVariable String email) {
        Map<String, String> response = new HashMap<>();
        
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
            
            if (user.getRole() == Role.ADMIN) {
                response.put("message", "User is already ADMIN");
                response.put("email", email);
                response.put("role", "ADMIN");
                return ResponseEntity.ok(response);
            }
            
            // Upgrade to ADMIN
            user.setRole(Role.ADMIN);
            userRepository.save(user);
            
            logger.info("✅ Upgraded user to ADMIN: {}", email);
            
            response.put("message", "Successfully upgraded to ADMIN");
            response.put("email", email);
            response.put("role", "ADMIN");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to upgrade user", e);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Check all users with a specific email
     */
    @GetMapping("/check/{email}")
    public ResponseEntity<Map<String, Object>> checkUser(@PathVariable String email) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("User not found: " + email));
            
            response.put("id", user.getId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole().name());
            response.put("active", user.getActive());
            response.put("hasPassword", !user.getPassword().isEmpty());
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
    
    /**
     * Delete VIEWER account and keep ADMIN account
     * This merges duplicate accounts
     */
    @PostMapping("/merge-accounts/{email}")
    public ResponseEntity<Map<String, String>> mergeAccounts(@PathVariable String email) {
        Map<String, String> response = new HashMap<>();
        
        try {
            // Find all accounts with this email
            java.util.List<User> users = userRepository.findAll().stream()
                    .filter(u -> u.getEmail().equals(email))
                    .toList();
            
            if (users.isEmpty()) {
                response.put("error", "No users found with email: " + email);
                return ResponseEntity.badRequest().body(response);
            }
            
            if (users.size() == 1) {
                response.put("message", "Only one account exists. No merge needed.");
                response.put("role", users.get(0).getRole().name());
                return ResponseEntity.ok(response);
            }
            
            // Find ADMIN and VIEWER accounts
            User adminUser = users.stream()
                    .filter(u -> u.getRole() == Role.ADMIN)
                    .findFirst()
                    .orElse(null);
            
            User viewerUser = users.stream()
                    .filter(u -> u.getRole() == Role.VIEWER)
                    .findFirst()
                    .orElse(null);
            
            if (adminUser != null && viewerUser != null) {
                // Delete VIEWER account, keep ADMIN
                userRepository.delete(viewerUser);
                logger.info("✅ Deleted VIEWER account for: {}", email);
                
                response.put("message", "Successfully merged accounts");
                response.put("deleted", "VIEWER account (ID: " + viewerUser.getId() + ")");
                response.put("kept", "ADMIN account (ID: " + adminUser.getId() + ")");
                
                return ResponseEntity.ok(response);
            }
            
            response.put("message", "Found " + users.size() + " accounts but no ADMIN+VIEWER pair");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            logger.error("Failed to merge accounts", e);
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }
}
