package com.deepak.codetogether.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.deepak.codetogether.entity.UserBlock;

@Repository
public interface UserBlockRepository extends JpaRepository<UserBlock, Long> {

    boolean existsByBlockerUsernameAndBlockedUsername(String blockerUsername, String blockedUsername);

    Optional<UserBlock> findByBlockerUsernameAndBlockedUsername(String blockerUsername, String blockedUsername);

    List<UserBlock> findByBlockerUsername(String blockerUsername);

    @Transactional
    void deleteByBlockerUsernameAndBlockedUsername(String blockerUsername, String blockedUsername);
}
