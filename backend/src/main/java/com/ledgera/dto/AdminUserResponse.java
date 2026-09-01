package com.ledgera.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminUserResponse {
    
    private Long id;
    private String name;
    private String email;
    private String role;
    private Boolean active;
    private LocalDateTime createdAt;
    private Long currentWorkspaceId;
    private String currentWorkspaceName;
    private Integer workspaceCount;
}
