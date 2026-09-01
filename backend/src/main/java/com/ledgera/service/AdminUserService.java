package com.ledgera.service;

import com.ledgera.dto.AdminUserResponse;
import com.ledgera.entity.User;
import com.ledgera.entity.Workspace;
import com.ledgera.exception.BadRequestException;
import com.ledgera.exception.ForbiddenException;
import com.ledgera.exception.ResourceNotFoundException;
import com.ledgera.repository.UserRepository;
import com.ledgera.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final WorkspaceRepository workspaceRepository;
    private final CurrentUserService currentUserService;

    @Transactional(readOnly = true)
    public Page<AdminUserResponse> getAllUsers(String search, Boolean active, int page, int size, String sortBy, String direction) {
        User currentUser = currentUserService.requireCurrentUser();
        
        // Only admins can access this
        if (currentUser.getRole() != com.ledgera.enums.Role.ADMIN) {
            throw new ForbiddenException("Only platform administrators can access user management");
        }
        
        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();
        
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<User> users;
        
        if (search != null && !search.trim().isEmpty()) {
            String searchTerm = search.trim().toLowerCase();
            if (active != null) {
                users = userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseAndActive(
                        searchTerm, searchTerm, active, pageable);
            } else {
                users = userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
                        searchTerm, searchTerm, pageable);
            }
        } else {
            if (active != null) {
                users = userRepository.findByActive(active, pageable);
            } else {
                users = userRepository.findAll(pageable);
            }
        }
        
        return users.map(this::mapToAdminResponse);
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUserById(Long userId) {
        User currentUser = currentUserService.requireCurrentUser();
        
        // Only admins can access this
        if (currentUser.getRole() != com.ledgera.enums.Role.ADMIN) {
            throw new ForbiddenException("Only platform administrators can access user management");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        return mapToAdminResponse(user);
    }

    @Transactional
    public AdminUserResponse updateUserStatus(Long userId, Boolean active) {
        User currentUser = currentUserService.requireCurrentUser();
        
        // Only admins can access this
        if (currentUser.getRole() != com.ledgera.enums.Role.ADMIN) {
            throw new ForbiddenException("Only platform administrators can manage users");
        }
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));
        
        // Prevent admin from deactivating themselves
        if (user.getId().equals(currentUser.getId())) {
            throw new BadRequestException("You cannot deactivate your own account");
        }
        
        user.setActive(active);
        user = userRepository.save(user);
        
        return mapToAdminResponse(user);
    }

    private AdminUserResponse mapToAdminResponse(User user) {
        List<Workspace> userWorkspaces = workspaceRepository.findWorkspacesByUserId(user.getId());
        
        return AdminUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .active(user.getActive())
                .createdAt(user.getCreatedAt())
                .currentWorkspaceId(user.getCurrentWorkspace() != null ? user.getCurrentWorkspace().getId() : null)
                .currentWorkspaceName(user.getCurrentWorkspace() != null ? user.getCurrentWorkspace().getName() : null)
                .workspaceCount(userWorkspaces.size())
                .build();
    }
}
