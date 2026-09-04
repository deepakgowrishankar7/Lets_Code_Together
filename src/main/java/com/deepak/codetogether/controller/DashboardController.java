package com.deepak.codetogether.controller;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.deepak.codetogether.entity.QuizScore;
import com.deepak.codetogether.entity.User;
import com.deepak.codetogether.repository.QuizScoreRepository;
import com.deepak.codetogether.repository.UserRepository;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final UserRepository userRepository;
    private final QuizScoreRepository quizScoreRepository;

    public DashboardController(UserRepository userRepository, QuizScoreRepository quizScoreRepository) {
        this.userRepository = userRepository;
        this.quizScoreRepository = quizScoreRepository;
    }

    @GetMapping("/stats")
    public Map<String, Object> stats(@RequestParam(required = false) String email) {
        String normalizedEmail = normalize(email);
        List<User> users = userRepository.findAll();
        List<QuizScore> allScores = quizScoreRepository.findAll();
        List<QuizScore> userScores = normalizedEmail.isBlank()
                ? List.of()
                : quizScoreRepository.findByEmail(normalizedEmail);

        Map<String, User> usersByEmail = users.stream()
                .filter(user -> user.getEmail() != null && !user.getEmail().isBlank())
                .collect(Collectors.toMap(
                        user -> normalize(user.getEmail()),
                        user -> user,
                        (first, ignored) -> first));

        List<Map<String, Object>> leaderboard = buildLeaderboard(allScores, usersByEmail, normalizedEmail);
        Map<String, Object> currentUser = leaderboard.stream()
                .filter(row -> normalizedEmail.equals(row.get("email")))
                .findFirst()
                .orElse(null);

        Map<String, Object> result = new LinkedHashMap<>();
        User user = usersByEmail.get(normalizedEmail);
        result.put("userName", displayName(user, normalizedEmail));
        result.put("userEmail", normalizedEmail);
        result.put("totalUsers", users.size());
        result.put("totalQuizAttempts", validScores(allScores).size());
        result.put("activeMasterclassesCount", 0);
        result.put("interactiveVisualizersCount", 0);
        result.put("dsaQuestionsSolvedCount", 0);
        result.put("quizzesCompletedCount", userScores.size());
        result.put("averageAccuracy", averageAccuracy(userScores));
        result.put("bestScore", userScores.stream()
                .map(QuizScore::getScore)
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0));
        result.put("userRank", currentUser == null ? 0 : currentUser.get("rank"));
        result.put("userXp", currentUser == null ? 0 : currentUser.get("score"));
        result.put("userLevel", currentUser == null ? 0 : levelFor(asInt(currentUser.get("score"))));
        result.put("quizLogs", buildQuizLogs(userScores));
        result.put("leaderboard", leaderboard);
        return result;
    }

    private List<Map<String, Object>> buildLeaderboard(
            List<QuizScore> allScores, Map<String, User> usersByEmail, String currentEmail) {
        Map<String, List<QuizScore>> grouped = validScores(allScores).stream()
                .collect(Collectors.groupingBy(score -> normalize(score.getEmail())));

        List<Map<String, Object>> rows = new ArrayList<>();
        grouped.forEach((email, scores) -> {
            int totalScore = scores.stream()
                    .map(QuizScore::getScore)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .sum();
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("email", email);
            row.put("name", displayName(usersByEmail.get(email), email));
            row.put("username", usersByEmail.containsKey(email)
                    ? valueOrEmpty(usersByEmail.get(email).getUsername()) : "");
            row.put("score", totalScore);
            row.put("attempts", scores.size());
            row.put("averageAccuracy", averageAccuracy(scores));
            row.put("currentUser", email.equals(currentEmail));
            rows.add(row);
        });

        rows.sort(Comparator.comparingInt(row -> -asInt(row.get("score"))));
        for (int index = 0; index < rows.size(); index++) {
            rows.get(index).put("rank", index + 1);
        }
        return rows;
    }

    private List<Map<String, Object>> buildQuizLogs(List<QuizScore> scores) {
        return scores.stream()
                .filter(score -> score.getQuiz() != null)
                .sorted(Comparator.comparing(QuizScore::getCreatedAt,
                        Comparator.nullsLast(Comparator.reverseOrder())))
                .map(score -> {
                    int total = score.getTotal() == null ? 0 : score.getTotal();
                    int points = score.getScore() == null ? 0 : score.getScore();
                    Map<String, Object> log = new LinkedHashMap<>();
                    log.put("quizTitle", score.getQuiz());
                    log.put("score", points);
                    log.put("totalQuestions", total);
                    log.put("percentage", percentage(points, total));
                    log.put("completedAt", score.getCreatedAt());
                    return log;
                })
                .toList();
    }

    private List<QuizScore> validScores(List<QuizScore> scores) {
        return scores.stream()
                .filter(score -> score != null && score.getEmail() != null && !score.getEmail().isBlank())
                .toList();
    }

    private int averageAccuracy(List<QuizScore> scores) {
        if (scores.isEmpty()) return 0;
        double average = scores.stream()
                .mapToDouble(score -> percentage(score.getScore(), score.getTotal()))
                .average()
                .orElse(0);
        return (int) Math.round(average);
    }

    private int percentage(Integer score, Integer total) {
        if (score == null || total == null || total <= 0) return 0;
        return BigDecimal.valueOf(score * 100.0 / total)
                .setScale(0, RoundingMode.HALF_UP)
                .intValue();
    }

    private String displayName(User user, String email) {
        if (user != null) {
            if (user.getName() != null && !user.getName().isBlank()) return user.getName();
            if (user.getUsername() != null && !user.getUsername().isBlank()) return user.getUsername();
        }
        return email.contains("@") ? email.substring(0, email.indexOf('@')) : valueOrEmpty(email);
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    private String valueOrEmpty(String value) {
        return value == null ? "" : value;
    }

    private int asInt(Object value) {
        return value instanceof Number number ? number.intValue() : 0;
    }

    private int levelFor(int score) {
        return score <= 0 ? 0 : (score / 100) + 1;
    }
}