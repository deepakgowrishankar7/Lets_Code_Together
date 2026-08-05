package com.deepak.codetogether.entity;

import java.io.Serializable;
import java.util.Objects;

public class DismissedNotificationId implements Serializable {
    private String userEmail;
    private Integer notificationId;

    public DismissedNotificationId() {}

    public DismissedNotificationId(String userEmail, Integer notificationId) {
        this.userEmail = userEmail;
        this.notificationId = notificationId;
    }

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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        DismissedNotificationId that = (DismissedNotificationId) o;
        return Objects.equals(userEmail, that.userEmail) && Objects.equals(notificationId, that.notificationId);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userEmail, notificationId);
    }
}
