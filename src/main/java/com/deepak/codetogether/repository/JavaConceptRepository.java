package com.deepak.codetogether.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.deepak.codetogether.entity.JavaConcept;

@Repository
public interface JavaConceptRepository extends JpaRepository<JavaConcept, Integer> {
}
