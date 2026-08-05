package com.deepak.codetogether.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.deepak.codetogether.entity.QuizScore;

@Repository
public interface QuizScoreRepository extends JpaRepository<QuizScore, Integer> {

    List<QuizScore> findByEmail(String email);
}
