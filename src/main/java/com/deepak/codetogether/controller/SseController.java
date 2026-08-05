package com.deepak.codetogether.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import com.deepak.codetogether.service.SseService;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/events")
public class SseController {

    @Autowired
    private SseService sseService;

    @GetMapping
    public SseEmitter streamEvents() {
        return sseService.createEmitter();
    }
}
