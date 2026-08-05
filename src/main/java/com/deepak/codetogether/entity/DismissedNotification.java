package com.deepak.codetogether.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;

@Entity
@Table(name = "dismissed_notifications")
@IdClass(DismissedNotificationId.class)
public class DismissedNotification {

    @Id
    @Column(name = "user_email")
    private String userEmail;

    @Id
    @Column(name = "notification_id")
    private Integer notificationId;

    public DismissedNotification() {}

    public String getUserEmail() {
        return userEmail;
    }

    public void setUserEmail(String userEmail) {
        this.userEmail = userEmail;
    }

    public Integer getNotificationId() {
        return notificationId;
    }

    public void setNotificationId(Integer notificationId) {
        this.notificationId = notificationId;
    }
}
