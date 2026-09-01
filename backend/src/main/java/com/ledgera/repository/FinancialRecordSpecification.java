package com.ledgera.repository;

import com.ledgera.entity.FinancialRecord;
import com.ledgera.enums.TransactionType;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class FinancialRecordSpecification {

    private FinancialRecordSpecification() {
    }

    public static Specification<FinancialRecord> withFilters(
            LocalDate startDate,
            LocalDate endDate,
            String category,
            TransactionType type,
            Long workspaceId) {

        return (root, query, criteriaBuilder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (startDate != null) {
                predicates.add(criteriaBuilder.greaterThanOrEqualTo(root.get("date"), startDate));
            }
            if (endDate != null) {
                predicates.add(criteriaBuilder.lessThanOrEqualTo(root.get("date"), endDate));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(criteriaBuilder.equal(root.get("category"), category));
            }
            if (type != null) {
                predicates.add(criteriaBuilder.equal(root.get("type"), type));
            }
            if (workspaceId != null) {
                predicates.add(criteriaBuilder.equal(root.get("workspace").get("id"), workspaceId));
            }

            return criteriaBuilder.and(predicates.toArray(new Predicate[0]));
        };
    }

    public static Specification<FinancialRecord> withFilters(
            LocalDate startDate,
            LocalDate endDate,
            String category,
            TransactionType type) {
        return withFilters(startDate, endDate, category, type, null);
    }
}
