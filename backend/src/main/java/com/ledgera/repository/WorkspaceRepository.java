package com.ledgera.repository;

import com.ledgera.entity.Workspace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WorkspaceRepository extends JpaRepository<Workspace, Long> {
    
    Optional<Workspace> findBySlug(String slug);
    
    List<Workspace> findByOwnerId(Long ownerId);
    
    @Query("SELECT w FROM Workspace w JOIN w.members m WHERE m.user.id = :userId AND m.isActive = true AND w.isActive = true")
    List<Workspace> findWorkspacesByUserId(@Param("userId") Long userId);
    
    @Query("SELECT CASE WHEN COUNT(w) > 0 THEN true ELSE false END FROM Workspace w WHERE w.slug = :slug")
    boolean existsBySlug(@Param("slug") String slug);
}
