package com.ledgera.service;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import com.resend.services.emails.model.CreateEmailResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    private final Resend resend;

    @Value("${resend.from.email}")
    private String fromEmail;

    @Value("${resend.from.name}")
    private String fromName;

    @Value("${app.base.url}")
    private String appBaseUrl;

    public EmailService(Resend resend) {
        this.resend = resend;
    }

    public void sendOtpEmail(String toEmail, String userName, String otp) {
        log.info("=== OTP EMAIL START ===");
        log.info("To: {}", toEmail);
        log.info("OTP: {}", otp);

        String fromAddress = fromName + " <" + fromEmail + ">";
        String htmlContent = buildOtpEmailHtml(userName, otp);

        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromAddress)
                    .to(toEmail)
                    .subject("Your Ledgera Password Reset Code")
                    .html(htmlContent)
                    .build();

            log.info("Calling Resend API...");
            CreateEmailResponse response = resend.emails().send(params);
            log.info("=== OTP EMAIL SEND SUCCESS === Email ID: {}", response.getId());

        } catch (ResendException e) {
            log.error("=== OTP EMAIL SEND FAILED (ResendException) ===");
            log.error("Error: {}", e.getMessage(), e);
            throw new RuntimeException("Resend API error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("=== OTP EMAIL SEND FAILED (Unexpected) ===");
            log.error("Error: {}", e.getMessage(), e);
            throw new RuntimeException("Email send error: " + e.getMessage(), e);
        }
    }

    public void sendWorkspaceInvitation(String toEmail, String inviterName, String workspaceName, String invitationToken) {
        log.info("=== WORKSPACE INVITATION EMAIL START ===");
        log.info("To: {}", toEmail);
        log.info("Inviter: {}", inviterName);
        log.info("Workspace: {}", workspaceName);

        String fromAddress = fromName + " <" + fromEmail + ">";
        String invitationLink = appBaseUrl + "/accept-invitation?token=" + invitationToken;
        String htmlContent = buildWorkspaceInvitationEmailHtml(inviterName, workspaceName, invitationLink);

        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromAddress)
                    .to(toEmail)
                    .subject("You've been invited to join " + workspaceName + " on Ledgera")
                    .html(htmlContent)
                    .build();

            log.info("Calling Resend API...");
            CreateEmailResponse response = resend.emails().send(params);
            log.info("=== INVITATION EMAIL SEND SUCCESS === Email ID: {}", response.getId());

        } catch (ResendException e) {
            log.error("=== INVITATION EMAIL SEND FAILED (ResendException) ===");
            log.error("Error: {}", e.getMessage(), e);
            throw new RuntimeException("Resend API error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("=== INVITATION EMAIL SEND FAILED (Unexpected) ===");
            log.error("Error: {}", e.getMessage(), e);
            throw new RuntimeException("Email send error: " + e.getMessage(), e);
        }
    }

    public void sendPasswordResetEmail(String toEmail, String userName, String resetToken) {
        log.info("=== EMAIL SEND START ===");
        log.info("To: {}", toEmail);
        log.info("From Name: {}", fromName);
        log.info("From Email: {}", fromEmail);
        log.info("App Base URL: {}", appBaseUrl);

        String fromAddress = fromName + " <" + fromEmail + ">";
        String resetLink = appBaseUrl + "/reset-password?token=" + resetToken;
        String htmlContent = buildPasswordResetEmailHtml(userName, resetLink, resetToken);

        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(fromAddress)
                    .to(toEmail)
                    .subject("Reset Your Ledgera Password")
                    .html(htmlContent)
                    .build();

            log.info("Calling Resend API...");
            CreateEmailResponse response = resend.emails().send(params);
            log.info("=== EMAIL SEND SUCCESS === Email ID: {}", response.getId());

        } catch (ResendException e) {
            log.error("=== EMAIL SEND FAILED (ResendException) ===");
            log.error("Error: {}", e.getMessage(), e);
            throw new RuntimeException("Resend API error: " + e.getMessage(), e);
        } catch (Exception e) {
            log.error("=== EMAIL SEND FAILED (Unexpected) ===");
            log.error("Error: {}", e.getMessage(), e);
            throw new RuntimeException("Email send error: " + e.getMessage(), e);
        }
    }

    private String buildPasswordResetEmailHtml(String userName, String resetLink, String resetToken) {
        int currentYear = java.time.Year.now().getValue();

        String html = "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "<title>Reset Your Password</title>" +
                "</head>" +

                "<body style=\"margin:0;padding:0;background:linear-gradient(180deg,#faf7f2 0%,#f5f2eb 100%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;\">" +

                "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"background:linear-gradient(180deg,#faf7f2 0%,#f5f2eb 100%);\">" +

                "<tr><td style=\"padding:60px 20px;\">" +

                "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"max-width:560px;margin:0 auto;\">" +

                "<tr>" +
                "<td style=\"text-align:center;padding-bottom:38px;\">" +

                "<img src=\"https://ledgera-finance-system.vercel.app/icon.png\" alt=\"Ledgera Logo\" width=\"72\" height=\"72\" style=\"display:block;margin:0 auto 18px auto;\">" +

                "<h1 style=\"margin:0;font-size:28px;font-weight:700;color:#111111;letter-spacing:-0.5px;\">Ledgera</h1>" +

                "</td>" +
                "</tr>" +

                "<tr>" +
                "<td>" +

                "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"background:#ffffff;border-radius:24px;box-shadow:0 10px 40px rgba(0,0,0,0.05),0 2px 10px rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.10);\">" +

                "<tr>" +
                "<td style=\"padding:52px 42px;\">" +

                "<h2 style=\"margin:0 0 16px 0;font-size:30px;font-weight:700;color:#111111;line-height:1.2;letter-spacing:-1px;\">" +
                "Reset your password" +
                "</h2>" +

                "<p style=\"margin:0 0 36px 0;font-size:15px;color:#666666;line-height:1.8;\">" +
                "Hi " + userName + ", a password reset was requested for your account." +
                "</p>" +

                "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\">" +
                "<tr>" +
                "<td style=\"text-align:center;padding:0 0 36px 0;\">" +

                "<a href=\"" + resetLink + "\" style=\"" +
                "display:inline-block;" +
                "background:linear-gradient(135deg,#D4AF37 0%,#F4C542 100%);" +
                "color:#111111;" +
                "text-decoration:none;" +
                "padding:16px 42px;" +
                "border-radius:16px;" +
                "font-weight:700;" +
                "font-size:15px;" +
                "box-shadow:0 10px 24px rgba(212,175,55,0.18),inset 0 1px 0 rgba(255,255,255,0.35);" +
                "\">" +
                "Reset Password" +
                "</a>" +

                "</td>" +
                "</tr>" +
                "</table>" +

                "<div style=\"background:#fffaf1;border:1px solid rgba(212,175,55,0.18);border-radius:18px;padding:18px 22px;margin-bottom:34px;\">" +

                "<p style=\"margin:0;font-size:14px;color:#8b6914;line-height:1.7;\">" +
                "This reset link expires in 15 minutes for security purposes." +
                "</p>" +

                "</div>" +

                "<div style=\"padding-top:24px;border-top:1px solid #f0f0f0;\">" +

                "<p style=\"margin:0 0 10px 0;font-size:13px;color:#999999;\">" +
                "If the button doesn’t work, use this link:" +
                "</p>" +

                "<p style=\"margin:0;font-size:13px;color:#666666;line-height:1.8;word-break:break-all;\">" +

                "<a href=\"" + resetLink + "\" style=\"color:#b88912;text-decoration:none;\">" +
                resetLink +
                "</a>" +

                "</p>" +
                "</div>" +

                "<div style=\"margin-top:32px;padding-top:24px;border-top:1px solid #f0f0f0;\">" +

                "<p style=\"margin:0;font-size:13px;color:#999999;line-height:1.7;\">" +
                "If this wasn't you, no action is required." +
                "</p>" +

                "</div>" +

                "</td>" +
                "</tr>" +
                "</table>" +

                "</td>" +
                "</tr>" +

                "<tr>" +
                "<td style=\"padding-top:20px;text-align:center;\">" +

                "<p style=\"margin:0;font-size:12px;color:#aaaaaa;\">" +
                "© " + currentYear + " Ledgera" +
                "</p>" +

                "</td>" +
                "</tr>" +

                "</table>" +

                "</td></tr></table></body></html>";

        return html;
    }

    private String buildWorkspaceInvitationEmailHtml(String inviterName, String workspaceName, String invitationLink) {
        int currentYear = java.time.Year.now().getValue();

        String html = "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "<title>Workspace Invitation</title>" +
                "</head>" +

                "<body style=\"margin:0;padding:0;background:linear-gradient(180deg,#faf7f2 0%,#f5f2eb 100%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;\">" +

                "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"background:linear-gradient(180deg,#faf7f2 0%,#f5f2eb 100%);\">" +

                "<tr><td style=\"padding:60px 20px;\">" +

                "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"max-width:560px;margin:0 auto;\">" +

                "<tr>" +
                "<td style=\"text-align:center;padding-bottom:38px;\">" +

                "<img src=\"https://ledgera-finance-system.vercel.app/icon.png\" alt=\"Ledgera Logo\" width=\"72\" height=\"72\" style=\"display:block;margin:0 auto 18px auto;\">" +

                "<h1 style=\"margin:0;font-size:28px;font-weight:700;color:#111111;letter-spacing:-0.5px;\">Ledgera</h1>" +

                "</td>" +
                "</tr>" +

                "<tr>" +
                "<td>" +

                "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"background:#ffffff;border-radius:24px;box-shadow:0 10px 40px rgba(0,0,0,0.05),0 2px 10px rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.10);\">" +

                "<tr>" +
                "<td style=\"padding:52px 42px;\">" +

                "<h2 style=\"margin:0 0 16px 0;font-size:30px;font-weight:700;color:#111111;line-height:1.2;letter-spacing:-1px;\">" +
                "You've been invited" +
                "</h2>" +

                "<p style=\"margin:0 0 36px 0;font-size:15px;color:#666666;line-height:1.8;\">" +
                inviterName + " has invited you to join <strong style=\"color:#111111;\">" + workspaceName + "</strong> on Ledgera." +
                "</p>" +

                "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\">" +
                "<tr>" +
                "<td style=\"text-align:center;padding:0 0 36px 0;\">" +

                "<a href=\"" + invitationLink + "\" style=\"" +
                "display:inline-block;" +
                "background:linear-gradient(135deg,#D4AF37 0%,#F4C542 100%);" +
                "color:#111111;" +
                "text-decoration:none;" +
                "padding:16px 42px;" +
                "border-radius:16px;" +
                "font-weight:700;" +
                "font-size:15px;" +
                "box-shadow:0 10px 24px rgba(212,175,55,0.18),inset 0 1px 0 rgba(255,255,255,0.35);" +
                "\">" +
                "Accept Invitation" +
                "</a>" +

                "</td>" +
                "</tr>" +
                "</table>" +

                "<div style=\"background:#fffaf1;border:1px solid rgba(212,175,55,0.18);border-radius:18px;padding:18px 22px;margin-bottom:34px;\">" +

                "<p style=\"margin:0;font-size:14px;color:#8b6914;line-height:1.7;\">" +
                "This invitation expires in 7 days." +
                "</p>" +

                "</div>" +

                "<div style=\"padding-top:24px;border-top:1px solid #f0f0f0;\">" +

                "<p style=\"margin:0 0 10px 0;font-size:13px;color:#999999;\">" +
                "If the button doesn't work, use this link:" +
                "</p>" +

                "<p style=\"margin:0;font-size:13px;color:#666666;line-height:1.8;word-break:break-all;\">" +

                "<a href=\"" + invitationLink + "\" style=\"color:#b88912;text-decoration:none;\">" +
                invitationLink +
                "</a>" +

                "</p>" +
                "</div>" +

                "<div style=\"margin-top:32px;padding-top:24px;border-top:1px solid #f0f0f0;\">" +

                "<p style=\"margin:0;font-size:13px;color:#999999;line-height:1.7;\">" +
                "If this wasn't intended for you, you can safely ignore this email." +
                "</p>" +

                "</div>" +

                "</td>" +
                "</tr>" +
                "</table>" +

                "</td>" +
                "</tr>" +

                "<tr>" +
                "<td style=\"padding-top:20px;text-align:center;\">" +

                "<p style=\"margin:0;font-size:12px;color:#aaaaaa;\">" +
                "© " + currentYear + " Ledgera" +
                "</p>" +

                "</td>" +
                "</tr>" +

                "</table>" +

                "</td></tr></table></body></html>";

        return html;
    }

    private String buildOtpEmailHtml(String userName, String otp) {
        int currentYear = java.time.Year.now().getValue();

        String html = "<!DOCTYPE html>" +
                "<html lang=\"en\">" +
                "<head>" +
                "<meta charset=\"UTF-8\">" +
                "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                "<title>Password Reset Code</title>" +
                "</head>" +

                "<body style=\"margin:0;padding:0;background:linear-gradient(180deg,#faf7f2 0%,#f5f2eb 100%);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;\">" +

                "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"background:linear-gradient(180deg,#faf7f2 0%,#f5f2eb 100%);\">" +

                "<tr><td style=\"padding:60px 20px;\">" +

                "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"max-width:560px;margin:0 auto;\">" +

                "<tr>" +
                "<td style=\"text-align:center;padding-bottom:38px;\">" +

                "<img src=\"https://ledgera-finance-system.vercel.app/icon.png\" alt=\"Ledgera Logo\" width=\"72\" height=\"72\" style=\"display:block;margin:0 auto 18px auto;\">" +

                "<h1 style=\"margin:0;font-size:28px;font-weight:700;color:#111111;letter-spacing:-0.5px;\">Ledgera</h1>" +

                "</td>" +
                "</tr>" +

                "<tr>" +
                "<td>" +

                "<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" border=\"0\" width=\"100%\" style=\"background:#ffffff;border-radius:24px;box-shadow:0 10px 40px rgba(0,0,0,0.05),0 2px 10px rgba(212,175,55,0.06);border:1px solid rgba(212,175,55,0.10);\">" +

                "<tr>" +
                "<td style=\"padding:52px 42px;\">" +

                "<h2 style=\"margin:0 0 16px 0;font-size:30px;font-weight:700;color:#111111;line-height:1.2;letter-spacing:-1px;\">" +
                "Password Reset Code" +
                "</h2>" +

                "<p style=\"margin:0 0 36px 0;font-size:15px;color:#666666;line-height:1.8;\">" +
                "Hi " + userName + ", use this code to reset your password:" +
                "</p>" +

                "<div style=\"background:linear-gradient(135deg,#fffaf1 0%,#fff8e8 100%);border:2px solid rgba(212,175,55,0.25);border-radius:20px;padding:32px;margin-bottom:36px;text-align:center;\">" +

                "<p style=\"margin:0 0 12px 0;font-size:13px;color:#8b6914;font-weight:600;text-transform:uppercase;letter-spacing:1px;\">" +
                "Your Code" +
                "</p>" +

                "<div style=\"font-size:48px;font-weight:800;color:#111111;letter-spacing:8px;font-family:'Courier New',monospace;\">" +
                otp +
                "</div>" +

                "</div>" +

                "<div style=\"background:#fffaf1;border:1px solid rgba(212,175,55,0.18);border-radius:18px;padding:18px 22px;margin-bottom:34px;\">" +

                "<p style=\"margin:0;font-size:14px;color:#8b6914;line-height:1.7;\">" +
                "This code expires in 10 minutes and can only be used once." +
                "</p>" +

                "</div>" +

                "<div style=\"margin-top:32px;padding-top:24px;border-top:1px solid #f0f0f0;\">" +

                "<p style=\"margin:0;font-size:13px;color:#999999;line-height:1.7;\">" +
                "If you didn't request this code, you can safely ignore this email." +
                "</p>" +

                "</div>" +

                "</td>" +
                "</tr>" +
                "</table>" +

                "</td>" +
                "</tr>" +

                "<tr>" +
                "<td style=\"padding-top:20px;text-align:center;\">" +

                "<p style=\"margin:0;font-size:12px;color:#aaaaaa;\">" +
                "© " + currentYear + " Ledgera" +
                "</p>" +

                "</td>" +
                "</tr>" +

                "</table>" +

                "</td></tr></table></body></html>";

        return html;
    }
}
