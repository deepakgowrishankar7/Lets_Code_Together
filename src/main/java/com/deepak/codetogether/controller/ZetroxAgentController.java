package com.deepak.codetogether.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.springframework.http.client.SimpleClientHttpRequestFactory;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api/zetrox")
public class ZetroxAgentController {

    private static final Logger logger = LoggerFactory.getLogger(ZetroxAgentController.class);
    private final ObjectMapper mapper;
    private final RestTemplate http;

    @Value("${gemini.api.key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.6-flash}")
    private String model;

    private static final String[] CANDIDATE_MODELS = {
        "gemini-3.6-flash",
        "gemini-3.5-flash-lite",
        "gemini-3.5-flash",
        "gemini-flash-lite-latest",
        "gemini-2.5-flash"
    };

    private final Map<String, List<Map<String,Object>>> sessions = new ConcurrentHashMap<>();

    private static final int MAX_HISTORY = 16;

    private static final String SYSTEM_INSTRUCTION = """
        You are ZETROX AI, the context-aware, autonomous AI Coding Agent & Assistant built directly inside 'Let's Code Together' (an interactive learning, 8-language compiler, visualizer, code rooms, and collaborative platform).

        PLATFORM CONTEXT MAP FOR 'LET'S CODE TOGETHER':
        - Available Navigation: Dashboard, Courses, Compiler, Visualizer, User Communication / Code Rooms, Notifications, Settings, Quiz Hub, Leaderboard.
        - Supported Languages: Java 21, Python, C++, C, JavaScript, Go, Ruby, PHP, SQL.
        - Account Settings Capabilities: Users can change display name, update password, toggle Dark/Light mode, and log out.
        - Account Settings Unsupported Features: Changing the registered system username is NOT available in user settings (managed by admins).
        - Admin Panel: Accessible at /admin for users with admin privileges.

        BEHAVIOR RULES:
        1. All answers MUST be generated dynamically by you (Gemini AI).
        2. Pay strict attention to conversation history. When the user selects a numbered option (e.g., "1", "2", "3") or asks a follow-up question (e.g. "explain the program"), look at your previous response in the history and respond directly to the selected option!
        3. Answer general questions (e.g., "what is ui", "what is cat", "samsung s25") with clear, helpful explanations.
        4. Use the supplied webpage context (active page, current editor code, compiler output, course topic, user info) to give context-aware answers.
        5. For programming requests, provide clean, runnable code with O(1)/O(N) complexity analysis (do not use raw LaTeX math dollar signs like $O(1)$).
        """;

    public ZetroxAgentController(ObjectMapper mapper) {
        this.mapper = mapper;
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(15000);
        this.http = new RestTemplate(factory);
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String,Object>> chat(@RequestBody Map<String,Object> request) {
        String message = str(request.get("message"));
        if (message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false, "reply", "Please enter a question or prompt for Zetrox AI."));
        }

        String sessionId = str(request.get("sessionId"));
        if (sessionId.isBlank()) sessionId = "guest-session";

        Map<String,Object> context = asMap(request.get("context"));

        // Parse multi-turn history from frontend JSON request
        List<Map<String,Object>> history = new ArrayList<>();
        if (request.get("history") instanceof List) {
            List<?> rawHistory = (List<?>) request.get("history");
            for (Object item : rawHistory) {
                if (item instanceof Map) {
                    history.add((Map<String,Object>) item);
                }
            }
        }

        // Fallback to server session memory if history list was not sent
        if (history.isEmpty()) {
            history = sessions.computeIfAbsent(sessionId, k -> new ArrayList<>());
        }

        try {
            String answer = callGeminiAI(message, context, history);
            if (answer != null && !answer.isBlank()) {
                List<Map<String,Object>> sessList = sessions.computeIfAbsent(sessionId, k -> new ArrayList<>());
                sessList.add(content("user", message));
                sessList.add(content("model", answer));
                trim(sessList);

                return ResponseEntity.ok(Map.of(
                        "success", true,
                        "agent", "ZETROX AI (Gemini Live)",
                        "reply", answer,
                        "sessionId", sessionId));
            }
        } catch (Exception e) {
            logger.error("[ZETROX AI] Error calling Gemini API: {}", e.getMessage(), e);
            String raw = safeError(e);
            String errMsg;
            if (raw.contains("401") || raw.contains("UNAUTHENTICATED") || raw.contains("ACCESS_TOKEN_TYPE_UNSUPPORTED")) {
                errMsg = "🔑 **Gemini API Key Required**: Please copy your API Key starting with `AIzaSy...` from Google AI Studio (https://aistudio.google.com/app/apikey) and update `gemini.api.key` in `application.properties`.";
            } else {
                errMsg = "⏳ **Gemini API Limit Exceeded**: Free tier request quota reached. Please wait **15 seconds** before asking your next question, or configure your personal API key in `application.properties`.";
            }
            return ResponseEntity.status(200).body(Map.of(
                    "success", false,
                    "reply", "⚠️ **Zetrox AI Notice**: " + errMsg
            ));
        }

        return ResponseEntity.ok(Map.of(
                "success", false,
                "reply", "⚠️ Gemini AI returned an empty response."
        ));
    }

    private String callGeminiAI(String message, Map<String,Object> context, List<Map<String,Object>> history) throws Exception {
        List<Map<String,Object>> contentsList = new ArrayList<>();

        // Process past turns into valid Gemini contents structure
        if (history != null && !history.isEmpty()) {
            for (Map<String,Object> turn : history) {
                String role = str(turn.get("role"));
                if ("user".equals(role) || "model".equals(role)) {
                    Object partsObj = turn.get("parts");
                    if (partsObj instanceof List) {
                        contentsList.add(Map.of("role", role, "parts", partsObj));
                    } else if (turn.containsKey("text")) {
                        contentsList.add(content(role, str(turn.get("text"))));
                    }
                }
            }
        }

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("=== WEBPAGE CONTEXT ===\n");
        promptBuilder.append(buildContext(context));
        promptBuilder.append("\n=== USER CURRENT PROMPT ===\n");
        promptBuilder.append(message);

        contentsList.add(content("user", promptBuilder.toString()));

        Map<String,Object> payload = new LinkedHashMap<>();
        payload.put("systemInstruction", Map.of("parts", List.of(Map.of("text", SYSTEM_INSTRUCTION))));
        payload.put("contents", contentsList);
        payload.put("generationConfig", Map.of(
                "temperature", 0.3,
                "maxOutputTokens", 1200
        ));

        JsonNode root = callGeminiWithFailover(payload);
        JsonNode candidate = root.path("candidates").path(0);
        JsonNode parts = candidate.path("content").path("parts");

        return extractText(parts);
    }

    private JsonNode callGeminiWithFailover(Map<String,Object> payload) throws Exception {
        String effectiveKey = (apiKey != null) ? apiKey.trim() : "";
        List<String> modelsToTry = new ArrayList<>();
        if (model != null && !model.isBlank()) modelsToTry.add(model);
        for (String m : CANDIDATE_MODELS) {
            if (!modelsToTry.contains(m)) modelsToTry.add(m);
        }

        Exception rateLimitException = null;
        Exception lastException = null;
        for (String modelName : modelsToTry) {
            String url = "https://generativelanguage.googleapis.com/v1beta/models/" + modelName + ":generateContent?key=" + effectiveKey;
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);

            try {
                ResponseEntity<String> response = http.exchange(
                        url, HttpMethod.POST,
                        new HttpEntity<>(mapper.writeValueAsString(payload), headers),
                        String.class);

                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    JsonNode root = mapper.readTree(response.getBody());
                    if (!root.has("error")) {
                        return root;
                    }
                }
            } catch (Exception e) {
                lastException = e;
                if (e.getMessage() != null && (e.getMessage().contains("429") || e.getMessage().contains("RESOURCE_EXHAUSTED"))) {
                    rateLimitException = e;
                }
                logger.warn("[ZETROX AI] Model {} failed: {}", modelName, e.getMessage());
            }
        }
        if (rateLimitException != null) throw rateLimitException;
        throw lastException != null ? lastException : new IllegalStateException("All Gemini candidate models failed.");
    }

    private String buildContext(Map<String,Object> c) {
        return """
            Active Page: %s
            Active Section: %s
            Active Course: %s
            Active Lesson Topic: %s
            Active Language: %s
            User Name: %s
            Editor Code:
            %s
            Compiler Stdout/Stderr Output:
            %s
            """.formatted(
                str(c.get("page")), str(c.get("section")),
                str(c.get("course")), str(c.get("courseTopic")), str(c.get("language")),
                str(c.get("user")),
                limit(str(c.get("code")), 10000), limit(str(c.get("output")), 4000));
    }

    private Map<String,Object> content(String role, String text) {
        return Map.of("role", role, "parts", List.of(Map.of("text", text)));
    }

    private String extractText(JsonNode parts) {
        StringBuilder out = new StringBuilder();
        if (parts.isArray()) {
            for (JsonNode p : parts) {
                if (p.has("text")) out.append(p.path("text").asText());
            }
        }
        return out.toString().trim();
    }

    @SuppressWarnings("unchecked")
    private Map<String,Object> asMap(Object v) {
        return v instanceof Map ? (Map<String,Object>) v : new HashMap<>();
    }

    private void trim(List<Map<String,Object>> h) {
        while (h.size() > MAX_HISTORY) h.remove(0);
    }

    private String str(Object v) {
        return v == null ? "" : String.valueOf(v);
    }

    private String limit(String s, int n) {
        return s.length() <= n ? s : s.substring(0, n);
    }

    private String safeError(Exception e) {
        String s = e.getMessage();
        if (s == null) return "Unexpected error.";
        return limit(s.replaceAll("(?i)(key=)[^&\\s]+", "$1[redacted]"), 300);
    }
}
