package com.deepak.codetogether.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import com.deepak.codetogether.entity.PrivateMessage;

@Repository
public interface PrivateMessageRepository extends JpaRepository<PrivateMessage, Integer> {

    @Query("SELECT m FROM PrivateMessage m WHERE (m.senderName = :sender AND m.receiverName = :receiver) OR (m.senderName = :receiver AND m.receiverName = :sender) ORDER BY m.createdAt ASC")
    List<PrivateMessage> findConversation(@Param("sender") String senderName, @Param("receiver") String receiverName);

    @Query("SELECT m FROM PrivateMessage m WHERE LOWER(m.receiverName) = LOWER(:receiver)")
    List<PrivateMessage> findByReceiverName(@Param("receiver") String receiverName);

    @Modifying
    @Transactional
    @Query("DELETE FROM PrivateMessage m WHERE (m.senderName = :sender AND m.receiverName = :receiver) OR (m.senderName = :receiver AND m.receiverName = :sender)")
    void deleteConversation(@Param("sender") String senderName, @Param("receiver") String receiverName);
}
