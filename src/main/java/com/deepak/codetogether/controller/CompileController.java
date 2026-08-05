package com.deepak.codetogether.controller;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.TimeUnit;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.deepak.codetogether.dto.CompileRequest;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api")
public class CompileController {

    @Autowired
    private RestTemplate restTemplate;

    @Value("${jdoodle.client-id:}")
    private String jdoodleClientId;

    @Value("${jdoodle.client-secret:}")
    private String jdoodleClientSecret;

    @Value("${compile.mode:local}")
    private String compileMode;

    @PostMapping("/compile")
    public ResponseEntity<Object> compile(@RequestBody CompileRequest request) {
        if ("jdoodle".equalsIgnoreCase(compileMode)
                && !jdoodleClientId.isBlank()
                && !jdoodleClientSecret.isBlank()) {
            return compileWithJdoodle(request);
        }
        return compileLocally(request);
    }

    private ResponseEntity<Object> compileWithJdoodle(CompileRequest request) {
        Map<String, Object> body = new HashMap<>();
        body.put("clientId", jdoodleClientId);
        body.put("clientSecret", jdoodleClientSecret);
        body.put("script", request.getCode());
        body.put("language", mapLanguage(request.getLanguage()));
        body.put("versionIndex", "0");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ResponseEntity<Object> response = restTemplate.postForEntity(
                "https://api.jdoodle.com/v1/execute", entity, Object.class);
        return response;
    }

    private ResponseEntity<Object> compileLocally(CompileRequest request) {
        if (request == null || request.getCode() == null || request.getCode().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Source code is required"));
        }

        try {
            String output = runLocalCompilation(request.getLanguage(), request.getCode(), request.getStdin());
            return ResponseEntity.ok(Map.of("output", output));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    private String runLocalCompilation(String language, String code, String stdin) throws Exception {
        String normalizedLang = language == null || language.isBlank() ? "python" : language.trim().toLowerCase(Locale.ROOT);
        Path tempDir = Files.createTempDirectory("local-compile-");
        try {
            return switch (normalizedLang) {
                case "python" -> runPython(tempDir, code, stdin);
                case "java" -> runJava(tempDir, code, stdin);
                case "cpp", "c++" -> runNative(tempDir, code, stdin, "g++", "Main.cpp", "Main");
                case "c" -> runNative(tempDir, code, stdin, "gcc", "Main.c", "Main");
                case "javascript" -> runNode(tempDir, code, stdin);
                case "go" -> runGo(tempDir, code, stdin);
                case "ruby" -> runInterpreter(tempDir, code, stdin, "ruby", "script.rb");
                case "php" -> runInterpreter(tempDir, code, stdin, "php", "script.php");
                default -> throw new IllegalArgumentException("Unsupported language: " + language);
            };
        } finally {
            deleteDirectoryRecursively(tempDir);
        }
    }

    private String runPython(Path tempDir, String code, String stdin) throws Exception {
        Path source = tempDir.resolve("script.py");
        Files.writeString(source, code, StandardCharsets.UTF_8);
        String pythonCmd = isExecutableAvailable("python3") ? "python3" : "python";
        return runProcess(tempDir, List.of(pythonCmd, source.toString()), stdin, 20);
    }

    private boolean isExecutableAvailable(String cmd) {
        try {
            Process p = new ProcessBuilder(cmd, "--version").start();
            return p.waitFor() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private String runNode(Path tempDir, String code, String stdin) throws Exception {
        Path source = tempDir.resolve("script.js");
        Files.writeString(source, code, StandardCharsets.UTF_8);
        return runProcess(tempDir, List.of("node", source.toString()), stdin, 20);
    }

    private String runGo(Path tempDir, String code, String stdin) throws Exception {
        Path source = tempDir.resolve("script.go");
        Files.writeString(source, code, StandardCharsets.UTF_8);
        return runProcess(tempDir, List.of("go", "run", source.toString()), stdin, 30);
    }

    private String runInterpreter(Path tempDir, String code, String stdin, String executable, String fileName) throws Exception {
        Path source = tempDir.resolve(fileName);
        Files.writeString(source, code, StandardCharsets.UTF_8);
        return runProcess(tempDir, List.of(executable, source.toString()), stdin, 20);
    }

    private String runNative(Path tempDir, String code, String stdin, String compiler, String fileName, String outputName)
            throws Exception {
        Path source = tempDir.resolve(fileName);
        Files.writeString(source, code, StandardCharsets.UTF_8);
        Path output = tempDir.resolve(outputName + (System.getProperty("os.name").toLowerCase(Locale.ROOT).contains("win") ? ".exe" : ""));
        runProcess(tempDir, List.of(compiler, source.toString(), "-o", output.toString()), stdin, 30);
        return runProcess(tempDir, List.of(output.toString()), stdin, 20);
    }

    private String runJava(Path tempDir, String code, String stdin) throws Exception {
        String runClass = extractJavaClassName(code);
        Path source;

        if (runClass != null) {
            source = tempDir.resolve(runClass + ".java");
            Files.writeString(source, code, StandardCharsets.UTF_8);
        } else {
            runClass = "Main";
            source = tempDir.resolve("Main.java");
            String wrapped = """
                    public class Main {
                        public static void main(String[] args) throws Exception {
                    """
                    + code + "\n"
                    + """
                        }
                    }
                    """;
            Files.writeString(source, wrapped, StandardCharsets.UTF_8);
        }

        runProcess(tempDir, List.of("javac", source.toString()), stdin, 30);
        return runProcess(tempDir, List.of("java", "-cp", tempDir.toString(), runClass), stdin, 20);
    }

    private String extractJavaClassName(String code) {
        Pattern pattern = Pattern.compile("public\\s+class\\s+(\\w+)");
        Matcher matcher = pattern.matcher(code);
        if (matcher.find()) {
            return matcher.group(1);
        }
        return null;
    }

    private String runProcess(Path workingDir, List<String> command, String stdin, int timeoutSeconds) throws Exception {
        ProcessBuilder builder = new ProcessBuilder(command);
        builder.directory(workingDir.toFile());
        builder.redirectErrorStream(true);
        Process process;
        try {
            process = builder.start();
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to start local runtime for command: " + String.join(" ", command), ex);
        }

        if (stdin != null) {
            process.getOutputStream().write(stdin.getBytes(StandardCharsets.UTF_8));
        }
        process.getOutputStream().close();

        boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
        if (!finished) {
            process.destroyForcibly();
            throw new IllegalStateException("Execution timed out after " + timeoutSeconds + " seconds");
        }

        String output = readStream(process.getInputStream());
        if (process.exitValue() != 0) {
            throw new IllegalStateException(output.isBlank() ? "Execution failed" : output);
        }

        return output.isBlank() ? "(no output)" : output;
    }

    private String readStream(InputStream stream) throws IOException {
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(stream, StandardCharsets.UTF_8))) {
            return reader.lines().collect(Collectors.joining("\n"));
        }
    }

    private void deleteDirectoryRecursively(Path directory) {
        try {
            if (Files.exists(directory)) {
                Files.walk(directory)
                        .sorted((a, b) -> b.compareTo(a))
                        .forEach(path -> {
                            try {
                                Files.deleteIfExists(path);
                            } catch (IOException ignored) {
                            }
                        });
            }
        } catch (IOException ignored) {
        }
    }

    private String mapLanguage(String language) {
        return switch (language.toLowerCase()) {
            case "python" -> "python3";
            case "java" -> "java";
            case "cpp", "c++" -> "cpp17";
            case "c" -> "c";
            default -> language.toLowerCase();
        };
    }
}
