package com.ledgera.dto;

import com.ledgera.enums.WorkspacePermission;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceMemberResponse {
    
    private Long id;
    private Long userId;
    private String userName;
    private String userEmail;
    private WorkspacePermission permission;
    private Long invitedById;
    private String invitedByName;
    private LocalDateTime joinedAt;
    private Boolean isActive;
}
