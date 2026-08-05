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

    @Override
    public void run(String... args) throws Exception {
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
