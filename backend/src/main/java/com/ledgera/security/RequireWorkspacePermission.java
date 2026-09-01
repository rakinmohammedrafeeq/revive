package com.ledgera.security;

import com.ledgera.enums.WorkspacePermission;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Annotation to require specific workspace permission for endpoint access
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireWorkspacePermission {
    WorkspacePermission[] value();
}
