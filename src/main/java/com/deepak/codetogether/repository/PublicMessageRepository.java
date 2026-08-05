package com.deepak.codetogether.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.deepak.codetogether.entity.PublicMessage;

@Repository
public interface PublicMessageRepository extends JpaRepository<PublicMessage, Integer> {
}
