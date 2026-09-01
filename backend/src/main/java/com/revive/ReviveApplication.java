package com.revive;

import io.github.cdimascio.dotenv.Dotenv;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ReviveApplication {

    public static void main(String[] args) {

        try {
            // Load .env file if it exists (local dev), otherwise use system environment variables (production)
            Dotenv dotenv = Dotenv.configure().ignoreIfMissing().load();
            
            System.out.println("=".repeat(60));
            System.out.println("Loading environment variables (.env file or system env)");
            System.out.println("=".repeat(60));

            // =========================
            // DATABASE
            // =========================
            String dbUrl = dotenv.get("DB_URL", "");
            System.setProperty("spring.datasource.url", dbUrl);
            System.out.println("✓ DB_URL loaded: " + (dbUrl.isEmpty() ? "MISSING" : "OK"));

            String dbUsername = dotenv.get("DB_USERNAME", "");
            System.setProperty("spring.datasource.username", dbUsername);
            System.out.println("✓ DB_USERNAME loaded: " + (dbUsername.isEmpty() ? "MISSING" : "OK"));

            String dbPassword = dotenv.get("DB_PASSWORD", "");
            System.setProperty("spring.datasource.password", dbPassword);
            System.out.println("✓ DB_PASSWORD loaded: " + (dbPassword.isEmpty() ? "MISSING" : "OK"));

            // =========================
            // JWT
            // =========================
            String jwtSecret = dotenv.get("JWT_SECRET", "");
            System.setProperty("jwt.secret", jwtSecret);
            System.out.println("✓ JWT_SECRET loaded: " + (jwtSecret.isEmpty() ? "MISSING" : "OK"));

            String jwtExpiration = dotenv.get("JWT_EXPIRATION", "86400000");
            System.setProperty("jwt.expiration", jwtExpiration);
            System.out.println("✓ JWT_EXPIRATION loaded: " + jwtExpiration);

            // =========================
            // RESEND EMAIL
            // =========================
            String resendApiKey = dotenv.get("RESEND_API_KEY", "");
            System.setProperty("resend.api.key", resendApiKey);
            System.out.println("✓ RESEND_API_KEY loaded: " + (resendApiKey.isEmpty() ? "MISSING" : resendApiKey.substring(0, Math.min(10, resendApiKey.length())) + "..."));

            String resendFromEmail = dotenv.get("RESEND_FROM_EMAIL", "onboarding@resend.dev");
            System.setProperty("resend.from.email", resendFromEmail);
            System.out.println("✓ RESEND_FROM_EMAIL loaded: " + resendFromEmail);

            String resendFromName = dotenv.get("RESEND_FROM_NAME", "Revive");
            System.setProperty("resend.from.name", resendFromName);
            System.out.println("✓ RESEND_FROM_NAME loaded: " + resendFromName);

            // =========================
            // APP URL
            // =========================
            String appBaseUrl = dotenv.get("APP_BASE_URL", "http://localhost:5173");
            System.setProperty("app.base.url", appBaseUrl);
            System.out.println("✓ APP_BASE_URL loaded: " + appBaseUrl);
            
            System.out.println("=".repeat(60));
            System.out.println("All environment variables loaded successfully!");
            System.out.println("=".repeat(60));

        } catch (Exception e) {
            System.err.println("ERROR: Could not load .env file");
            System.err.println("Error details: " + e.getMessage());
            e.printStackTrace();
        }

        SpringApplication.run(ReviveApplication.class, args);
    }
}