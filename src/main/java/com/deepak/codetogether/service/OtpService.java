package com.deepak.codetogether.service;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;

@Service
public class OtpService {

    private final Map<String, String> otpStore = new ConcurrentHashMap<>();

    public String generateOtp(String email) {
        String otp = String.valueOf((int) (100000 + Math.random() * 900000));
        otpStore.put(email.toLowerCase(), otp);
        return otp;
    }

    public boolean verifyOtp(String email, String otp) {
        if (email == null || otp == null) {
            return false;
        }
        String stored = otpStore.get(email.toLowerCase());
        return otp.equals(stored);
    }

    public void clearOtp(String email) {
        if (email != null) {
            otpStore.remove(email.toLowerCase());
        }
    }
}
