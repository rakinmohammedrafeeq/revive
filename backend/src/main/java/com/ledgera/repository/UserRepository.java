package com.ledgera.repository;

import com.ledgera.entity.User;
import com.ledgera.enums.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    Optional<User> findByResetToken(String resetToken);

    List<User> findByRole(Role role);
    
    @Query("SELECT u FROM User u WHERE u.currentWorkspace.id = :workspaceId")
    List<User> findByCurrentWorkspaceId(@Param("workspaceId") Long workspaceId);
    
    // Admin user management queries
    Page<User> findByActive(Boolean active, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            @Param("search") String search, 
            @Param("search") String search2, 
            Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE (LOWER(u.name) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%'))) AND u.active = :active")
    Page<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCaseAndActive(
            @Param("search") String search, 
            @Param("search") String search2, 
            @Param("active") Boolean active, 
            Pageable pageable);
}
