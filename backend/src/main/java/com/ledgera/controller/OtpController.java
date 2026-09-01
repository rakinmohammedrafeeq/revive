package com.ledgera.controller;

import com.ledgera.dto.MessageResponse;
import com.ledgera.dto.RequestOtpRequest;
import com.ledgera.dto.ResetPasswordWithOtpRequest;
import com.ledgera.dto.VerifyOtpRequest;
import com.ledgera.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth/otp")
@RequiredArgsConstructor
public class OtpController {

    private final OtpService otpService;

    @PostMapping("/request")
    public ResponseEntity<MessageResponse> requestOtp(@Valid @RequestBody RequestOtpRequest request) {
        MessageResponse response = otpService.requestOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify")
    public ResponseEntity<MessageResponse> verifyOtp(@Valid @RequestBody VerifyOtpRequest request) {
        MessageResponse response = otpService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordWithOtpRequest request) {
        MessageResponse response = otpService.resetPasswordWithOtp(request);
        return ResponseEntity.ok(response);
    }
}
