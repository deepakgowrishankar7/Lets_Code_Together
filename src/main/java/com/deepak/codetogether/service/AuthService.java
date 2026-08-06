package com.deepak.codetogether.service;

import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.deepak.codetogether.dto.AdminLoginRequest;
import com.deepak.codetogether.dto.LoginRequest;
import com.deepak.codetogether.entity.User;
import com.deepak.codetogether.repository.UserRepository;
import com.deepak.codetogether.security.JwtService;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtService jwtService;

    public User register(User user) {
        if (user.getUsername() != null && !user.getUsername().trim().isEmpty()) {
            String handle = user.getUsername().trim().toLowerCase().replaceAll("^@+", "");
            
            // Block reserved handles
            if (handle.equals("admin") || handle.equals("system_admin") || handle.equals("support") || handle.equals("letscodetogether")) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This username handle is reserved by the system.");
            }
            
            if (userRepository.existsByUsername(handle)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Username handle @" + handle + " is already taken.");
            }
            user.setUsername(handle);
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepository.save(user);
    }

    public String login(LoginRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase();
        Optional<User> userOptional = userRepository.findByEmail(normalizedEmail);

        if (userOptional.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        User user = userOptional.get();
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect password");
        }

        if (Boolean.TRUE.equals(user.getIsBlocked())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "User is blocked");
        }

        return jwtService.generateToken(user.getEmail());
    }

    public String adminLogin(AdminLoginRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase();
        Optional<User> userOptional = userRepository.findByEmail(normalizedEmail);

        if (userOptional.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin user not found. Please register this account first on the main page.");
        }

        User user = userOptional.get();

        // Auto-promote Founder / Official emails to Admin
        if ("letscodetogetheredu@gmail.com".equalsIgnoreCase(normalizedEmail) || "deepakgowrishankar7@gmail.com".equalsIgnoreCase(normalizedEmail)) {
            if (!Boolean.TRUE.equals(user.getIsAdmin())) {
                user.setIsAdmin(true);
                userRepository.save(user);
            }
        }

        if (!Boolean.TRUE.equals(user.getIsAdmin())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not an admin user");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Incorrect password");
        }

        return jwtService.generateToken(user.getEmail());
    }
}