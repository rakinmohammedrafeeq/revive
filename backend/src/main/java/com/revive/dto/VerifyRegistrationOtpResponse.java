package com.revive.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyRegistrationOtpResponse {
    private boolean verified;
    private String message;
    private String verificationToken;
}
