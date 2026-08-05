package com.deepak.codetogether.controller;

import java.util.List;

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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.deepak.codetogether.dto.JavaConceptRequest;
import com.deepak.codetogether.entity.JavaConcept;
import com.deepak.codetogether.repository.JavaConceptRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api/java-concepts")
public class JavaConceptController {

    @Autowired
    private JavaConceptRepository javaConceptRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @GetMapping
    public List<JavaConcept> getJavaConcepts() {
        return javaConceptRepository.findAll();
    }

    @PostMapping
    public JavaConcept createJavaConcept(@RequestBody JavaConceptRequest request) {
        JavaConcept concept = new JavaConcept();
        concept.setTitle(request.getTitle());
        concept.setTheory(request.getTheory());
        try {
            concept.setVideoUrls(objectMapper.writeValueAsString(request.getVideoUrls()));
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid video URL format");
        }
        concept.setPdfLink(request.getPdfLink());
        return javaConceptRepository.save(concept);
    }

    @PutMapping("/{id}")
    public JavaConcept updateJavaConcept(@PathVariable int id, @RequestBody JavaConceptRequest request) {
        JavaConcept concept = javaConceptRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Concept not found"));
        concept.setTitle(request.getTitle());
        concept.setTheory(request.getTheory());
        try {
            concept.setVideoUrls(objectMapper.writeValueAsString(request.getVideoUrls()));
        } catch (JsonProcessingException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid video URL format");
        }
        concept.setPdfLink(request.getPdfLink());
        return javaConceptRepository.save(concept);
    }

    @DeleteMapping("/{id}")
    public void deleteJavaConcept(@PathVariable int id) {
        if (!javaConceptRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Concept not found");
        }
        javaConceptRepository.deleteById(id);
    }
}
