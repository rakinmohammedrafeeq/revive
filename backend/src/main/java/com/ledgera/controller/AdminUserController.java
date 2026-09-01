package com.ledgera.controller;

import com.ledgera.dto.AdminUserResponse;
import com.ledgera.dto.UpdateUserStatusRequest;
import com.ledgera.service.AdminUserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<AdminUserResponse>> getAllUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Boolean active,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction) {
        
        String safeSortBy = switch (sortBy) {
            case "name", "email", "role", "active", "createdAt", "id" -> sortBy;
            default -> "createdAt";
        };
        
        Page<AdminUserResponse> users = adminUserService.getAllUsers(
                search, active, page, size, safeSortBy, direction);
        
        return ResponseEntity.ok(users);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserResponse> getUserById(@PathVariable Long id) {
        AdminUserResponse user = adminUserService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminUserResponse> updateUserStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        AdminUserResponse user = adminUserService.updateUserStatus(id, request.getActive());
        return ResponseEntity.ok(user);
    }
}
