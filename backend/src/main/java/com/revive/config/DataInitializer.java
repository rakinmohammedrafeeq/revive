package com.revive.config;

import com.revive.entity.User;
import com.revive.enums.Role;
import com.revive.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger logger = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${revive.seed-admin:true}")
    private boolean seedAdmin;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!seedAdmin) {
            logger.info("ℹ️  Admin seed disabled, skipping initialization.");
            return;
        }
        if (!userRepository.existsByEmail("rakinmohammedrafeeq@gmail.com")) {
            User admin = User.builder()
                    .name("Rakin Mohammed Rafeeq")
                    .email("rakinmohammedrafeeq@gmail.com")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ADMIN)
                    .active(true)
                    .build();

            userRepository.save(admin);
            logger.info("✅ Default admin user created: rakinmohammedrafeeq@gmail.com");
        } else {
            // User exists - check if they're ADMIN and update name if needed
            userRepository.findByEmail("rakinmohammedrafeeq@gmail.com").ifPresent(user -> {
                boolean changed = false;
                if (user.getRole() != Role.ADMIN) {
                    user.setRole(Role.ADMIN);
                    changed = true;
                    logger.info("✅ Upgraded existing user to ADMIN: {}", user.getEmail());
                }
                if (user.getName() == null || user.getName().equalsIgnoreCase("Admin") || user.getName().isBlank()) {
                    user.setName("Rakin Mohammed Rafeeq");
                    changed = true;
                    logger.info("✅ Updated admin name to 'Rakin Mohammed Rafeeq': {}", user.getEmail());
                }
                if (changed) {
                    userRepository.save(user);
                } else {
                    logger.info("ℹ️  Admin user already exists with ADMIN role and updated name.");
                }
            });
        }
    }
}
