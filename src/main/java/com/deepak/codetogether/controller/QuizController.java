package com.deepak.codetogether.controller;

import java.util.Comparator;
import java.util.HashMap;
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
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.deepak.codetogether.dto.SaveQuizScoreRequest;
import com.deepak.codetogether.entity.QuizScore;
import com.deepak.codetogether.entity.User;
import com.deepak.codetogether.repository.QuizScoreRepository;
import com.deepak.codetogether.repository.UserRepository;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api")
public class QuizController {

    @Autowired
    private QuizScoreRepository quizScoreRepository;

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/save-quiz-score")
    public QuizScore saveQuizScore(@RequestBody SaveQuizScoreRequest request) {
        if (request.getEmail() == null || request.getQuiz() == null || request.getScore() == null || request.getTotal() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "All quiz fields are required");
        }
        QuizScore score = new QuizScore();
        score.setEmail(request.getEmail().toLowerCase());
        score.setQuiz(request.getQuiz());
        score.setScore(request.getScore());
        score.setTotal(request.getTotal());
        return quizScoreRepository.save(score);
    }

    @GetMapping("/get-quiz-scores")
    public List<QuizScore> getQuizScores(@org.springframework.web.bind.annotation.RequestParam(required = false) String email) {
        if (email == null || email.isBlank()) {
            return quizScoreRepository.findAll();
        }
        return quizScoreRepository.findByEmail(email.toLowerCase());
    }

    @GetMapping("/leaderboard")
    public List<Map<String, Object>> leaderboard() {
        Map<String, Integer> topScoresByEmail = quizScoreRepository.findAll().stream()
                .filter(score -> score != null && score.getEmail() != null && score.getScore() != null)
                .collect(Collectors.toMap(
                        score -> score.getEmail().toLowerCase(),
                        score -> score.getScore(),
                        (existing, replacement) -> existing > replacement ? existing : replacement));

        return topScoresByEmail.entrySet().stream()
                .sorted(Map.Entry.<String, Integer>comparingByValue(Comparator.reverseOrder()))
                .limit(10)
                .map(entry -> {
                    Map<String, Object> item = new java.util.HashMap<>();
                    item.put("email", entry.getKey());
                    item.put("topScore", entry.getValue());
                    return item;
                })
                .collect(Collectors.toList());
    }

    @Autowired
    private org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    @GetMapping("/admin-users")
    public List<Map<String, Object>> getAdminUsers() {
        List<User> users = userRepository.findAll();

        return users.stream().map(u -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", u.getId());
            m.put("name", u.getName());
            m.put("email", u.getEmail());
            m.put("isBlocked", u.getIsBlocked() != null ? u.getIsBlocked() : false);
            m.put("isAdmin", u.getIsAdmin() != null ? u.getIsAdmin() : false);

            // compute top score and attempts from quiz scores
            List<QuizScore> scores = quizScoreRepository.findByEmail(u.getEmail() == null ? "" : u.getEmail().toLowerCase());
            int top = scores.stream()
                    .filter(score -> score != null && score.getScore() != null)
                    .map(score -> score.getScore())
                    .max((a, b) -> a.compareTo(b))
                    .orElse(0);
            int attempts = scores.size();
            m.put("topScore", top);
            m.put("attempts", attempts);

            return m;
        }).collect(Collectors.toList());
    }

    @DeleteMapping("/delete-user/{id}")
    public void deleteUser(@PathVariable int id) {
        if (!userRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
        }
        userRepository.deleteById(id);
    }

    @PostMapping("/block-user/{id}")
    public User blockUser(@PathVariable int id, @RequestParam(required = false) Boolean blocked) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setIsBlocked(blocked == null ? true : blocked);
        return userRepository.save(user);
    }

    @PostMapping("/admin-toggle-role/{id}")
    public User toggleAdminRole(@PathVariable int id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setIsAdmin(!Boolean.TRUE.equals(user.getIsAdmin()));
        return userRepository.save(user);
    }

    @PostMapping("/admin-reset-user-password/{id}")
    public Map<String, String> resetUserPassword(@PathVariable int id, @RequestBody Map<String, String> body) {
        String newPassword = body.get("newPassword");
        if (newPassword == null || newPassword.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New password is required");
        }
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        return Map.of("message", "Password reset successfully for " + user.getName());
    }

    @GetMapping("/admin-quiz-summary")
    public Map<String, Object> getAdminQuizSummary() {
        List<QuizScore> allScores = quizScoreRepository.findAll();
        int totalAttempts = allScores.size();
        double avgScore = allScores.isEmpty() ? 0.0 : allScores.stream()
                .filter(s -> s.getScore() != null)
                .mapToInt(QuizScore::getScore)
                .average().orElse(0.0);

        Map<String, List<QuizScore>> grouped = allScores.stream()
                .filter(s -> s.getQuiz() != null)
                .collect(Collectors.groupingBy(QuizScore::getQuiz));

        List<Map<String, Object>> quizDetails = grouped.entrySet().stream().map(entry -> {
            String quizName = entry.getKey();
            List<QuizScore> scores = entry.getValue();
            int attempts = scores.size();
            double avg = scores.stream().filter(s -> s.getScore() != null).mapToInt(QuizScore::getScore).average().orElse(0.0);
            int max = scores.stream().filter(s -> s.getScore() != null).mapToInt(QuizScore::getScore).max().orElse(0);

            Map<String, Object> qMap = new HashMap<>();
            qMap.put("quiz", quizName);
            qMap.put("attempts", attempts);
            qMap.put("averageScore", Math.round(avg * 100.0) / 100.0);
            qMap.put("topScore", max);
            return qMap;
        }).collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("totalAttempts", totalAttempts);
        result.put("averageScore", Math.round(avgScore * 100.0) / 100.0);
        result.put("quizzes", quizDetails);
        result.put("allScores", allScores);
        return result;
    }
}

