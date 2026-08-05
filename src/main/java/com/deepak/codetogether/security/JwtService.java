package com.deepak.codetogether.security;

import java.security.Key;
import java.util.Date;

import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    private static final String SECRET =
            "deepakdeepakdeepakdeepakdeepakdeepakdeepakdeepak";

    private Key getSignKey() {
        return Keys.hmacShaKeyFor(SECRET.getBytes());
    }

    public String generateToken(String email) {

        return Jwts.builder()
                .subject(email)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + 86400000))
                .signWith(getSignKey())
                .compact();
    }

    @SuppressWarnings("deprecation")
    public String extractEmail(String token) {
        Claims claims = Jwts.parser()
                .setSigningKey(getSignKey().getEncoded())
                .build()
                .parseClaimsJws(token)
                .getBody();
        return claims.getSubject();
    }
}