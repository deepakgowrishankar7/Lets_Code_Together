package com.deepak.codetogether.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.deepak.codetogether.dto.AdminLoginRequest;
import com.deepak.codetogether.dto.ChangeEmailRequest;
import com.deepak.codetogether.dto.ChangePasswordRequest;
import com.deepak.codetogether.dto.ForgotPasswordRequest;
import com.deepak.codetogether.dto.LoginRequest;
import com.deepak.codetogether.dto.RegisterRequest;
import com.deepak.codetogether.dto.ResetPasswordRequest;
import com.deepak.codetogether.dto.SendOtpRequest;
import com.deepak.codetogether.entity.User;
import com.deepak.codetogether.repository.UserRepository;
import com.deepak.codetogether.service.AuthService;
import com.deepak.codetogether.service.MailService;
import com.deepak.codetogether.service.OtpService;

import jakarta.validation.Valid;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api")
public class AuthController {

    @Autowired
    private AuthService authService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private OtpService otpService;

    @Autowired
    private MailService mailService;

    @Value("${spring.mail.username:}")
    private String mailUser;

    @PostMapping("/send-otp")
    public Map<String, String> sendOtp(@Valid @RequestBody SendOtpRequest request) {
        String email = request.getEmail().toLowerCase();
        String otp = otpService.generateOtp(email);
        try {
            mailService.sendRegistrationOtp(email, otp);
            return Map.of("message", "OTP sent successfully to your email!");
        } catch (RuntimeException ex) {
            System.out.println("[OTP LOG] Generated OTP for " + email + ": " + otp + " | Email error: " + ex.getMessage());
            return Map.of("message", "Verification OTP: " + otp, "otp", otp);
        }
    }

    @PostMapping("/register")
    public User register(@Valid @RequestBody RegisterRequest request) {
        String name = request.getName();
        String email = request.getEmail().toLowerCase();

        if (!otpService.verifyOtp(email, request.getOtp())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP");
        }

        if (userRepository.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already exists");
        }

        if (userRepository.existsByName(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Username already exists");
        }

        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(request.getPassword());

        User saved = authService.register(user);
        otpService.clearOtp(email);
        return saved;
    }

    @PostMapping("/login")
    public Map<String, String> login(@Valid @RequestBody LoginRequest request) {
        String token = authService.login(request);
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        return Map.of(
            "token", token,
            "userName", user.getName(),
            "email", user.getEmail());
    }

    @PostMapping("/forgot-password")
    public Map<String, String> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        String email = request.getEmail().toLowerCase();
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        String otp = otpService.generateOtp(email);
        if (mailUser == null || mailUser.isBlank()) {
            System.out.println("[DEV OTP LOG] Reset Password OTP for " + email + ": " + otp);
            return Map.of(
                "message", "Password reset OTP generated. (Dev mode: OTP is " + otp + ")",
                "otp", otp
            );
        }
        try {
            mailService.sendPasswordResetOtp(email, otp);
            return Map.of("message", "Password reset OTP sent to email");
        } catch (RuntimeException ex) {
            System.out.println("[DEV OTP LOG] Email send failed. Reset Password OTP for " + email + ": " + otp);
            return Map.of(
                "message", "Email service failed. (Dev mode: OTP is " + otp + ")",
                "otp", otp
            );
        }
    }


    @PostMapping("/change-password")
    public Map<String, String> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        String email = request.getEmail().toLowerCase();
        Optional<User> userOptional = userRepository.findByEmail(email);
        if (userOptional.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }

        User user = userOptional.get();
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Current password is invalid");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return Map.of("message", "Password changed successfully");
    }

    @PostMapping("/reset-password")
    public Map<String, String> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        String email = request.getEmail().toLowerCase();
        if (!otpService.verifyOtp(email, request.getOtp())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid or expired OTP");
        }
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        otpService.clearOtp(email);
        return Map.of("message", "Password reset successfully");
    }

    @PostMapping("/change-email")
    public Map<String, String> changeEmail(@Valid @RequestBody ChangeEmailRequest request) {
        String oldEmail = request.getOldEmail().toLowerCase();
        String newEmail = request.getNewEmail().toLowerCase();

        Optional<User> existing = userRepository.findByEmail(oldEmail);
        if (existing.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Old email not found");
        }

        if (userRepository.existsByEmail(newEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "New email is already in use");
        }

        User user = existing.get();
        user.setEmail(newEmail);
        userRepository.save(user);
        return Map.of("message", "Email changed successfully");
    }

    @GetMapping("/user/{email}")
    public User getUserByEmail(@PathVariable String email) {
        return userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @GetMapping("/user-details")
    public User getUserDetails(@RequestParam String email) {
        return userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    @PostMapping("/admin-login")
    public Map<String, String> adminLogin(@Valid @RequestBody AdminLoginRequest request) {
        String token = authService.adminLogin(request);
        User user = userRepository.findByEmail(request.getEmail().toLowerCase())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));
        return Map.of(
            "token", token,
            "userName", user.getName(),
            "email", user.getEmail());
    }
}
