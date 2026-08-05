package com.deepak.codetogether.controller;

import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/room")
@CrossOrigin(origins = "*")
public class RoomController {

    private final Map<String, Map<String, Object>> roomStore = new ConcurrentHashMap<>();

    @PostMapping("/sync")
    public Map<String, Object> syncRoomState(@RequestBody Map<String, Object> payload) {
        String roomId = (String) payload.get("roomId");
        if (roomId == null || roomId.isBlank()) {
            return Map.of("status", "error", "message", "Room ID is required");
        }

        Map<String, Object> state = new ConcurrentHashMap<>(payload);
        state.put("updatedAt", System.currentTimeMillis());
        roomStore.put(roomId, state);

        return Map.of("status", "success", "roomId", roomId);
    }

    @GetMapping("/sync")
    public Map<String, Object> getRoomState(@RequestParam("roomId") String roomId) {
        if (roomId == null || !roomStore.containsKey(roomId)) {
            return Map.of("status", "empty");
        }
        return roomStore.get(roomId);
    }
}
