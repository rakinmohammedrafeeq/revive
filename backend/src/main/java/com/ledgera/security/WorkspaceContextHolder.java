package com.ledgera.security;

/**
 * Thread-local holder for current workspace context
 */
public class WorkspaceContextHolder {
    
    private static final ThreadLocal<Long> workspaceContext = new ThreadLocal<>();
    
    public static void setWorkspaceId(Long workspaceId) {
        workspaceContext.set(workspaceId);
    }
    
    public static Long getWorkspaceId() {
        return workspaceContext.get();
    }
    
    public static void clear() {
        workspaceContext.remove();
    }
    
    public static boolean hasWorkspaceContext() {
        return workspaceContext.get() != null;
    }
}
