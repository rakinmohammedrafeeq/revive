package com.revive.entity;

import com.revive.enums.ExportStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Type;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;

import java.time.LocalDateTime;

/**
 * Tracks training data exports for model retraining.
 * Records which data was exported, when, and where.
 */
@Entity
@Table(name = "training_data_exports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TrainingDataExport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Workspace this export belongs to
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id", nullable = false)
    private Workspace workspace;

    /**
     * Human-readable export name
     */
    @Column(name = "export_name", nullable = false)
    private String exportName;

    /**
     * File path or S3 URL where data was exported
     */
    @Column(name = "export_path", length = 500)
    private String exportPath;

    /**
     * Start date of data range
     */
    @Column(name = "data_start_date", nullable = false)
    private LocalDateTime dataStartDate;

    /**
     * End date of data range
     */
    @Column(name = "data_end_date", nullable = false)
    private LocalDateTime dataEndDate;

    /**
     * Total records exported
     */
    @Column(name = "total_records", nullable = false)
    private Integer totalRecords;

    /**
     * Number of recovered records
     */
    @Column(name = "recovered_records", nullable = false)
    private Integer recoveredRecords;

    /**
     * Number of failed records
     */
    @Column(name = "failed_records", nullable = false)
    private Integer failedRecords;

    /**
     * Export format (CSV, PARQUET, JSON)
     */
    @Column(name = "export_format", nullable = false, length = 50)
    @Builder.Default
    private String exportFormat = "CSV";

    /**
     * Feature columns included in export (JSONB array)
     */
    @Type(JsonBinaryType.class)
    @Column(name = "feature_columns", columnDefinition = "jsonb", nullable = false)
    private String featureColumns;

    /**
     * Export filters applied (JSONB)
     */
    @Type(JsonBinaryType.class)
    @Column(name = "export_filters", columnDefinition = "jsonb")
    private String exportFilters;

    /**
     * Export status (INITIATED, COMPLETED, FAILED)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    @Builder.Default
    private ExportStatus status = ExportStatus.INITIATED;

    /**
     * Error message if export failed
     */
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    /**
     * When export was initiated
     */
    @Column(name = "exported_at", nullable = false)
    private LocalDateTime exportedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.exportedAt == null) {
            this.exportedAt = LocalDateTime.now();
        }
    }
}
