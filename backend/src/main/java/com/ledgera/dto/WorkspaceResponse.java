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
public class WorkspaceResponse {
    
    private Long id;
    private String name;
    private String slug;
    private Long ownerId;
    private String ownerName;
    private WorkspacePermission userPermission;
    private Integer memberCount;
    private Boolean isActive;
    private Boolean isCurrent;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
