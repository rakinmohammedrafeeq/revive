package com.ledgera.controller;

import com.ledgera.dto.ChangePasswordRequest;
import com.ledgera.dto.UpdateNameRequest;
import com.ledgera.dto.UserResponse;
import com.ledgera.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> getCurrentUser() {
        return ResponseEntity.ok(userService.getCurrentUser());
    }

    @PutMapping("/me/name")
    public ResponseEntity<UserResponse> updateCurrentUserName(@Valid @RequestBody UpdateNameRequest request) {
        return ResponseEntity.ok(userService.updateCurrentUserName(request.getName()));
    }

    @PutMapping("/me/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    // only admins and analysts can list users
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/assignable")
    // limit assignable list to elevated roles
    @PreAuthorize("hasAnyRole('ADMIN', 'ANALYST')")
    public ResponseEntity<List<UserResponse>> getAssignableUsers() {
        return ResponseEntity.ok(userService.getAssignableUsers());
    }

    @PutMapping("/{id}/toggle-status")
    // only admins can activate/deactivate users
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserResponse> toggleUserStatus(@PathVariable Long id) {
        return ResponseEntity.ok(userService.toggleUserStatus(id));
    }
}
