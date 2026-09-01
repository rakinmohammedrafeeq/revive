package com.ledgera.dto;

import com.ledgera.enums.WorkspacePermission;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePermissionRequest {
    
    @NotNull(message = "Permission is required")
    private WorkspacePermission permission;
}
