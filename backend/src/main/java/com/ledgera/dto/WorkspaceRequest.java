package com.ledgera.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WorkspaceRequest {
    
    @NotBlank(message = "Workspace name is required")
    @Size(min = 2, max = 255, message = "Workspace name must be between 2 and 255 characters")
    private String name;
}
