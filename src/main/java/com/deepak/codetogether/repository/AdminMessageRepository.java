package com.deepak.codetogether.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.deepak.codetogether.entity.AdminMessage;

@Repository
public interface AdminMessageRepository extends JpaRepository<AdminMessage, Integer> {

    List<AdminMessage> findByUserNameOrderByCreatedAtAsc(String userName);
}
