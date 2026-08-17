package com.deepak.codetogether.controller;

import java.util.List;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.deepak.codetogether.dto.AdminSendMessageRequest;
import com.deepak.codetogether.dto.PrivateMessageRequest;
import com.deepak.codetogether.dto.PublicMessageRequest;
import com.deepak.codetogether.entity.AdminMessage;
import com.deepak.codetogether.entity.PrivateMessage;
import com.deepak.codetogether.entity.PublicMessage;
import com.deepak.codetogether.entity.UserBlock;
import com.deepak.codetogether.repository.AdminMessageRepository;
import com.deepak.codetogether.repository.PrivateMessageRepository;
import com.deepak.codetogether.repository.PublicMessageRepository;
import com.deepak.codetogether.repository.UserBlockRepository;
import com.deepak.codetogether.repository.UserRepository;

import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestParam;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api")
public class MessageController {

    private final Map<String, Long> userLastHeartbeat = new ConcurrentHashMap<>();

    @Autowired
    private PublicMessageRepository publicMessageRepository;

    @Autowired
    private PrivateMessageRepository privateMessageRepository;

    @Autowired
    private AdminMessageRepository adminMessageRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserBlockRepository userBlockRepository;

    @PostMapping("/heartbeat/{username}")
    public Map<String, Object> heartbeat(@PathVariable String username) {
        try {
            if (username != null && !username.trim().isEmpty() && !"null".equalsIgnoreCase(username.trim())) {
                userLastHeartbeat.put(username.trim(), System.currentTimeMillis());
            }
        } catch (Exception e) {
            // ignore safely
        }
        Map<String, Object> res = new HashMap<>();
        res.put("status", "ok");
        return res;
    }

    @GetMapping("/user-statuses")
    public Map<String, String> getUserStatuses() {
        Map<String, String> statuses = new HashMap<>();
        try {
            long now = System.currentTimeMillis();
            if (userRepository != null) {
                userRepository.findAll().forEach(u -> {
                    if (u != null) {
                        String name = u.getName();
                        if (name == null || name.trim().isEmpty()) {
                            if (u.getEmail() != null && u.getEmail().contains("@")) {
                                name = u.getEmail().split("@")[0];
                            }
                        }
                        if (name != null && !name.trim().isEmpty()) {
                            Long last = userLastHeartbeat.get(name.trim());
                            if (last != null && (now - last) <= 25000) {
                                statuses.put(name.trim(), "online");
                            } else if (last != null && (now - last) <= 180000) {
                                statuses.put(name.trim(), "away");
                            } else {
                                statuses.put(name.trim(), "offline");
                            }
                        }
                    }
                });
            }
        } catch (Exception e) {
            // catch safely
        }
        return statuses;
    }

    @PostMapping("/public-message")
    public PublicMessage sendPublicMessage(@RequestBody PublicMessageRequest request) {
        if (request.getUserName() == null || request.getMessage() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User name and message are required");
        }
        userLastHeartbeat.put(request.getUserName(), System.currentTimeMillis());
        PublicMessage message = new PublicMessage();
        message.setUserName(request.getUserName());
        message.setMessage(request.getMessage());
        return publicMessageRepository.save(message);
    }

    @GetMapping("/public-messages")
    public List<PublicMessage> getPublicMessages() {
        return publicMessageRepository.findAll();
    }

    @DeleteMapping("/public-message/{id}")
    public Map<String, String> deletePublicMessage(@PathVariable Integer id) {
        publicMessageRepository.deleteById(id);
        Map<String, String> res = new HashMap<>();
        res.put("status", "deleted");
        return res;
    }

    @DeleteMapping("/public-messages/clear")
    public Map<String, String> clearPublicMessages() {
        publicMessageRepository.deleteAll();
        Map<String, String> res = new HashMap<>();
        res.put("status", "cleared");
        return res;
    }

    private Set<String> resolveUserIdentifiers(String identifier) {
        Set<String> set = new HashSet<>();
        if (identifier == null || identifier.isBlank()) return set;
        String idLower = identifier.trim().toLowerCase();
        set.add(idLower);

        userRepository.findAll().stream()
            .filter(u -> u != null && (
                (u.getName() != null && idLower.equalsIgnoreCase(u.getName().trim())) ||
                (u.getUsername() != null && idLower.equalsIgnoreCase(u.getUsername().trim())) ||
                (u.getEmail() != null && idLower.equalsIgnoreCase(u.getEmail().trim()))
            ))
            .forEach(u -> {
                if (u.getName() != null && !u.getName().isBlank()) set.add(u.getName().trim().toLowerCase());
                if (u.getUsername() != null && !u.getUsername().isBlank()) set.add(u.getUsername().trim().toLowerCase());
                if (u.getEmail() != null && !u.getEmail().isBlank()) set.add(u.getEmail().trim().toLowerCase());
            });
        return set;
    }

    private boolean isUserBlocked(String blocker, String blocked) {
        Set<String> blockerIds = resolveUserIdentifiers(blocker);
        Set<String> blockedIds = resolveUserIdentifiers(blocked);

        List<UserBlock> allBlocks = userBlockRepository.findAll();
        for (UserBlock block : allBlocks) {
            if (block.getBlockerUsername() != null && block.getBlockedUsername() != null) {
                String b1 = block.getBlockerUsername().trim().toLowerCase();
                String b2 = block.getBlockedUsername().trim().toLowerCase();
                if (blockerIds.contains(b1) && blockedIds.contains(b2)) {
                    return true;
                }
            }
        }
        return false;
    }

    @PostMapping("/user-blocks/block")
    public Map<String, String> blockUser(@RequestBody Map<String, String> body) {
        String blocker = body.get("blockerUsername");
        String blocked = body.get("blockedUsername");
        if (blocker == null || blocked == null || blocker.isBlank() || blocked.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "blockerUsername and blockedUsername are required");
        }
        String b1 = blocker.trim().toLowerCase();
        String b2 = blocked.trim().toLowerCase();
        if (b1.equalsIgnoreCase(b2)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You cannot block yourself");
        }
        if (!isUserBlocked(b1, b2)) {
            userBlockRepository.save(new UserBlock(b1, b2));
        }
        return Map.of("status", "blocked", "message", "User has been blocked successfully.");
    }

    @PostMapping("/user-blocks/unblock")
    public Map<String, String> unblockUser(@RequestBody Map<String, String> body) {
        String blocker = body.get("blockerUsername");
        String blocked = body.get("blockedUsername");
        if (blocker == null || blocked == null || blocker.isBlank() || blocked.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "blockerUsername and blockedUsername are required");
        }
        Set<String> blockerIds = resolveUserIdentifiers(blocker);
        Set<String> blockedIds = resolveUserIdentifiers(blocked);

        List<UserBlock> allBlocks = userBlockRepository.findAll();
        for (UserBlock block : allBlocks) {
            if (block.getBlockerUsername() != null && block.getBlockedUsername() != null) {
                String b1 = block.getBlockerUsername().trim().toLowerCase();
                String b2 = block.getBlockedUsername().trim().toLowerCase();
                if (blockerIds.contains(b1) && blockedIds.contains(b2)) {
                    userBlockRepository.deleteById(block.getId());
                }
            }
        }
        return Map.of("status", "unblocked", "message", "User has been unblocked.");
    }

    @GetMapping("/user-blocks/is-blocked")
    public Map<String, Boolean> checkIsBlocked(@RequestParam String blockerUsername, @RequestParam String blockedUsername) {
        if (blockerUsername == null || blockedUsername == null) {
            return Map.of("isBlocked", false);
        }
        boolean blocked = isUserBlocked(blockerUsername, blockedUsername);
        return Map.of("isBlocked", blocked);
    }

    @PostMapping("/private-message")
    public PrivateMessage sendPrivateMessage(@RequestBody PrivateMessageRequest request) {
        if (request.getSenderName() == null || request.getReceiverName() == null || request.getMessage() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sender, receiver, and message are required");
        }
        String s = request.getSenderName().trim();
        String r = request.getReceiverName().trim();

        // Check if receiver blocked sender
        if (isUserBlocked(r, s)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot send messages to this user because they have blocked you.");
        }
        // Check if sender blocked receiver
        if (isUserBlocked(s, r)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You have blocked this user. Unblock them to send messages.");
        }

        userLastHeartbeat.put(request.getSenderName(), System.currentTimeMillis());
        PrivateMessage message = new PrivateMessage();
        message.setSenderName(request.getSenderName());
        message.setReceiverName(request.getReceiverName());
        message.setMessage(request.getMessage());
        return privateMessageRepository.save(message);
    }

    @GetMapping("/private-messages")
    public List<PrivateMessage> getPrivateMessages(@RequestParam String senderName,
                                                   @RequestParam String receiverName) {
        if (senderName == null || receiverName == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "senderName and receiverName query parameters are required");
        }
        return privateMessageRepository.findConversation(senderName, receiverName);
    }

    @GetMapping("/private-messages/unread-count")
    public Map<String, Integer> getUnreadMessageCount(@RequestParam String receiverName) {
        if (receiverName == null || receiverName.trim().isEmpty()) {
            return Map.of("count", 0);
        }
        List<PrivateMessage> messages = privateMessageRepository.findByReceiverName(receiverName.trim());
        return Map.of("count", messages != null ? messages.size() : 0);
    }

    @GetMapping("/private-messages/received")
    public List<PrivateMessage> getReceivedPrivateMessages(@RequestParam String receiverName) {
        if (receiverName == null || receiverName.trim().isEmpty()) {
            return List.of();
        }
        return privateMessageRepository.findByReceiverName(receiverName.trim());
    }

    @DeleteMapping("/private-message/{id}")
    public Map<String, String> deletePrivateMessage(@PathVariable Integer id) {
        privateMessageRepository.deleteById(id);
        Map<String, String> res = new HashMap<>();
        res.put("status", "deleted");
        return res;
    }

    @DeleteMapping("/private-messages/clear")
    public Map<String, String> clearPrivateConversation(@RequestParam(required = false) String senderName,
                                                        @RequestParam(required = false) String receiverName) {
        if (senderName != null && !senderName.trim().isEmpty() && receiverName != null && !receiverName.trim().isEmpty()) {
            privateMessageRepository.deleteConversation(senderName.trim(), receiverName.trim());
        } else if (receiverName != null && !receiverName.trim().isEmpty()) {
            String r = receiverName.trim();
            privateMessageRepository.findAll().stream()
                .filter(m -> r.equals(m.getReceiverName()) || r.equals(m.getSenderName()))
                .forEach(m -> privateMessageRepository.deleteById(m.getId()));
        } else {
            privateMessageRepository.deleteAll();
        }
        Map<String, String> res = new HashMap<>();
        res.put("status", "cleared");
        return res;
    }

    @GetMapping("/users")
    public List<Map<String, String>> getUsers() {
        return userRepository.findAll().stream()
                .filter(u -> u != null && u.getName() != null)
                .map(u -> {
                    Map<String, String> map = new HashMap<>();
                    map.put("name", u.getName());
                    map.put("username", u.getUsername() != null ? u.getUsername() : u.getName().toLowerCase().replaceAll("\\s+", ""));
                    map.put("email", u.getEmail());
                    return map;
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/favicon.ico")
    public org.springframework.http.ResponseEntity<Void> returnFavicon() {
        return org.springframework.http.ResponseEntity.noContent().build();
    }


    @PostMapping("/admin-send-message")
    public AdminMessage sendAdminMessage(@RequestBody AdminSendMessageRequest request) {
        if (request.getUserName() == null || request.getMessage() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User and message are required");
        }
        AdminMessage adminMessage = new AdminMessage();
        adminMessage.setUserName(request.getUserName());
        adminMessage.setMessage(request.getMessage());
        return adminMessageRepository.save(adminMessage);
    }

    @GetMapping("/get-admin-messages/{name}")
    public List<AdminMessage> getAdminMessages(@PathVariable String name) {
        return adminMessageRepository.findByUserNameOrderByCreatedAtAsc(name);
    }
}
