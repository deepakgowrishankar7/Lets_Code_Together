package com.deepak.codetogether.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.deepak.codetogether.entity.DismissedNotification;
import com.deepak.codetogether.entity.DismissedNotificationId;

@Repository
public interface DismissedNotificationRepository extends JpaRepository<DismissedNotification, DismissedNotificationId> {

    List<DismissedNotification> findByUserEmail(String userEmail);
}
