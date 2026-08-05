package com.deepak.codetogether.dto;

import com.fasterxml.jackson.annotation.JsonAlias;

public class AdminSendMessageRequest {

    @JsonAlias({"receiver", "receiverName", "user"})
    private String userName;

    private String message;

    public String getUserName() {
        return userName;
    }

    public void setUserName(String userName) {
        this.userName = userName;
    }

    public void setReceiver(String receiver) {
        this.userName = receiver;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}

