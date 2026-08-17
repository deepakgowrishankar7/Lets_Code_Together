package com.deepak.codetogether.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "user_blocks")
public class UserBlock {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String blockerUsername;
    private String blockedUsername;

    private LocalDateTime createdAt = LocalDateTime.now();

    public UserBlock() {}

    public UserBlock(String blockerUsername, String blockedUsername) {
        this.blockerUsername = blockerUsername != null ? blockerUsername.trim().toLowerCase() : "";
        this.blockedUsername = blockedUsername != null ? blockedUsername.trim().toLowerCase() : "";
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getBlockerUsername() {
        return blockerUsername;
    }

    public void setBlockerUsername(String blockerUsername) {
        this.blockerUsername = blockerUsername != null ? blockerUsername.trim().toLowerCase() : "";
    }

    public String getBlockedUsername() {
        return blockedUsername;
    }

    public void setBlockedUsername(String blockedUsername) {
        this.blockedUsername = blockedUsername != null ? blockedUsername.trim().toLowerCase() : "";
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
