package com.deepak.codetogether.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.deepak.codetogether.entity.User;
import com.deepak.codetogether.repository.UserRepository;

@Component
public class AdminDataInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired(required = false)
    private org.springframework.jdbc.core.JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) throws Exception {
        if (jdbcTemplate != null) {
            try {
                // Ensure MySQL tables support full 4-byte UTF-8 emojis (utf8mb4)
                jdbcTemplate.execute("ALTER TABLE public_messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                jdbcTemplate.execute("ALTER TABLE private_messages CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
            } catch (Exception e) {
                // Safely ignored if tables not yet created or running on PostgreSQL/H2
            }
        }

        String adminEmail = "admin@example.com";
        if (userRepository.findByEmail(adminEmail).isEmpty()) {
            User admin = new User();
            admin.setName("System Admin");
            admin.setEmail(adminEmail);
            admin.setPassword(passwordEncoder.encode("admin123"));
            admin.setIsAdmin(true);
            admin.setIsBlocked(false);
            userRepository.save(admin);
            System.out.println("[ADMIN INITIALIZER] Default admin created: admin@example.com / admin123");
        }
    }
}
