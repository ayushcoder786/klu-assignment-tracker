package com.klu.assignmenttracker.repository;

import com.klu.assignmenttracker.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * Database operations for User documents.
 * MongoRepository provides save, findById, findAll, delete, etc. for free.
 */
@Repository
public interface UserRepository extends MongoRepository<User, String> {

    /** Find a user by their email address (used for login) */
    Optional<User> findByEmail(String email);

    /** Find a user by their KLU student ID */
    Optional<User> findByStudentId(String studentId);

    /** Check if an email is already registered */
    boolean existsByEmail(String email);

    /** Check if a student ID is already registered */
    boolean existsByStudentId(String studentId);
}
