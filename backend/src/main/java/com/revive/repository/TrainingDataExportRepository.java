package com.revive.repository;

import com.revive.entity.TrainingDataExport;
import com.revive.enums.ExportStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TrainingDataExportRepository extends JpaRepository<TrainingDataExport, Long> {

    /**
     * Find all exports for a workspace, ordered by export date
     */
    List<TrainingDataExport> findByWorkspaceIdOrderByExportedAtDesc(Long workspaceId);

    /**
     * Find exports by status
     */
    List<TrainingDataExport> findByWorkspaceIdAndStatusOrderByExportedAtDesc(
        Long workspaceId, ExportStatus status
    );

    /**
     * Count exports by status
     */
    long countByWorkspaceIdAndStatus(Long workspaceId, ExportStatus status);
}
