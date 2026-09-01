package com.ledgera.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiError {
    private int status;
    private String message;
    private LocalDateTime timestamp;
}
