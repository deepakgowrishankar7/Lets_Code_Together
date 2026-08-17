package com.deepak.codetogether.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.deepak.codetogether.entity.CoursePdf;

@Repository
public interface CoursePdfRepository extends JpaRepository<CoursePdf, Long> {

    List<CoursePdf> findByCourseIdOrderByUploadedAtDesc(String courseId);

    List<CoursePdf> findAllByOrderByUploadedAtDesc();
}
