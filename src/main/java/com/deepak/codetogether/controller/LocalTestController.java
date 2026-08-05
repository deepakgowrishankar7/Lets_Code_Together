package com.deepak.codetogether.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Profile;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.deepak.codetogether.entity.User;
import com.deepak.codetogether.service.AuthService;

/**
 * Local-only test utilities to help smoke-test registration/login without email.
 * This controller is active only when the 'local' profile is enabled.
 */
@Profile("local")
@RestController
@RequestMapping("/api/test")
public class LocalTestController {

    @Autowired
    private AuthService authService;

    @PostMapping("/create-user")
    public User createUser(@RequestBody java.util.Map<String, String> req) {
        String name = req.getOrDefault("name", req.get("username"));
        String email = req.get("email");
        String password = req.get("password");
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(password);
        return authService.register(user);
    }
}
