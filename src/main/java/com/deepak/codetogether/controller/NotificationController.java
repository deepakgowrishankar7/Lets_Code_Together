package com.deepak.codetogether.controller;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.deepak.codetogether.dto.AdminNotificationRequest;
import com.deepak.codetogether.dto.DismissNotificationRequest;
import com.deepak.codetogether.dto.NotificationRequest;
import com.deepak.codetogether.entity.DismissedNotification;
import com.deepak.codetogether.entity.Notification;
import com.deepak.codetogether.entity.User;
import com.deepak.codetogether.repository.DismissedNotificationRepository;
import com.deepak.codetogether.repository.NotificationRepository;
import com.deepak.codetogether.repository.UserRepository;
import com.deepak.codetogether.service.MailService;
import com.deepak.codetogether.service.SseService;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api")
public class NotificationController {

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private DismissedNotificationRepository dismissedNotificationRepository;

    @Autowired
    private SseService sseService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private MailService mailService;

    @PostMapping("/add-notification")
    public Notification addNotification(@RequestBody NotificationRequest request) {
        Notification notification = new Notification();
        notification.setContentTitle(request.getContentTitle());
        notification.setContent(request.getContent());
        Notification saved = notificationRepository.save(notification);
        sseService.sendEvent("new-notification", saved);
        return saved;
    }

    @GetMapping("/notifications")
    public List<Notification> getNotifications() {
        return notificationRepository.findAllByOrderByCreatedAtDesc();
    }

    @GetMapping("/dismissed-notifications")
    public List<Integer> getDismissedNotifications(@RequestParam String email) {
        return dismissedNotificationRepository.findByUserEmail(email.toLowerCase()).stream()
                .filter(d -> d != null)
                .map(d -> d.getNotificationId())
                .filter(id -> id != null)
                .collect(Collectors.toList());
    }

    @PostMapping("/notifications/dismiss")
    public DismissedNotification dismissNotification(@RequestBody DismissNotificationRequest request) {
        String email = request.getEmail().toLowerCase();
        Integer notificationId = request.getNotificationId();
        if (notificationId == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Notification id is required");
        }

        if (!notificationRepository.existsById(notificationId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
        }

        DismissedNotification dismissed = new DismissedNotification();
        dismissed.setUserEmail(email);
        dismissed.setNotificationId(notificationId);
        return dismissedNotificationRepository.save(dismissed);
    }

    @PostMapping("/admin-notifications/create")
    public Notification createAdminNotification(@RequestBody AdminNotificationRequest request) {
        Notification notification = new Notification();
        notification.setContentTitle(request.getContentTitle());
        notification.setContent(request.getContent());
        return notificationRepository.save(notification);
    }

    @PutMapping("/admin-notifications/{id}")
    public Notification updateAdminNotification(@PathVariable int id,
            @RequestBody AdminNotificationRequest request) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found"));
        notification.setContentTitle(request.getContentTitle());
        notification.setContent(request.getContent());
        return notificationRepository.save(notification);
    }

    @DeleteMapping("/admin-notifications/{id}")
    public void deleteAdminNotification(@PathVariable int id) {
        if (!notificationRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Notification not found");
        }
        notificationRepository.deleteById(id);
    }

    @PostMapping("/admin-bulk-email")
    public Map<String, Object> bulkEmail(@RequestBody Map<String, String> request) {
        String subject = request.getOrDefault("subject", "Announcement from Let's Code Together");
        String message = request.getOrDefault("message", "");
        if (message.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message is required");
        }
        List<User> users = userRepository.findAll();
        int sent = 0;
        int failed = 0;
        for (User user : users) {
            try {
                if (user.getEmail() != null && !user.getEmail().isBlank()) {
                    mailService.sendEmail(user.getEmail(), subject, message);
                    sent++;
                }
            } catch (Exception e) {
                failed++;
                System.err.println("[BULK EMAIL] Failed for " + user.getEmail() + ": " + e.getMessage());
            }
        }
        return Map.of("message", "Bulk email sent to " + sent + " users", "sent", sent, "failed", failed);
    }
}
