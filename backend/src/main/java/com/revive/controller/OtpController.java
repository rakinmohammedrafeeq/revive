package com.revive.controller;

import com.revive.dto.MessageResponse;
import com.revive.dto.RequestOtpRequest;
import com.revive.dto.ResetPasswordWithOtpRequest;
import com.revive.dto.VerifyOtpRequest;
import com.revive.service.OtpService;
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

    @PostMapping("/send-registration-otp")
    public ResponseEntity<MessageResponse> sendRegistrationOtp(@Valid @RequestBody RequestOtpRequest request) {
        MessageResponse response = otpService.sendRegistrationOtp(request.getEmail());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-registration-otp")
    public ResponseEntity<com.revive.dto.VerifyRegistrationOtpResponse> verifyRegistrationOtp(@Valid @RequestBody VerifyOtpRequest request) {
        com.revive.dto.VerifyRegistrationOtpResponse response = otpService.verifyRegistrationOtp(request.getEmail(), request.getOtp());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordWithOtpRequest request) {
        MessageResponse response = otpService.resetPasswordWithOtp(request);
        return ResponseEntity.ok(response);
    }
}
