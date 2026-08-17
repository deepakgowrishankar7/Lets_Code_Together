package com.deepak.codetogether.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

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

import com.deepak.codetogether.entity.CoursePdf;
import com.deepak.codetogether.repository.CoursePdfRepository;

@CrossOrigin(origins = "*", allowedHeaders = "*")
@RestController
@RequestMapping("/api/course-pdfs")
public class CoursePdfController {

    @Autowired
    private CoursePdfRepository coursePdfRepository;

    @GetMapping
    public List<CoursePdf> getCoursePdfs(@RequestParam(required = false) String courseId) {
        if (courseId != null && !courseId.isBlank() && !"all".equalsIgnoreCase(courseId)) {
            return coursePdfRepository.findByCourseIdOrderByUploadedAtDesc(courseId.trim().toLowerCase());
        }
        return coursePdfRepository.findAllByOrderByUploadedAtDesc();
    }

    @PostMapping
    public CoursePdf uploadCoursePdf(@RequestBody Map<String, String> body) {
        String courseId = body.get("courseId");
        String title = body.get("title");
        String description = body.get("description");
        String fileData = body.get("fileData");
        String fileName = body.get("fileName");
        String fileSize = body.get("fileSize");

        if (courseId == null || courseId.isBlank() || title == null || title.isBlank() || fileData == null || fileData.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "courseId, title, and fileData are required");
        }

        CoursePdf pdf = new CoursePdf(
            courseId.trim().toLowerCase(),
            title.trim(),
            description != null ? description.trim() : "",
            fileData,
            fileName != null ? fileName.trim() : "resource.pdf",
            fileSize != null ? fileSize.trim() : "1.0 MB"
        );

        return coursePdfRepository.save(pdf);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> deleteCoursePdf(@PathVariable Long id) {
        if (!coursePdfRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "PDF resource not found");
        }
        coursePdfRepository.deleteById(id);
        Map<String, String> res = new HashMap<>();
        res.put("status", "deleted");
        res.put("message", "Course PDF resource deleted successfully.");
        return res;
    }
}
