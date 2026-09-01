package com.ledgera.enums;

public enum WorkspacePermission {
    OWNER,    // Full access: manage workspace, members, settings, all data
    EDITOR,   // Can create/edit/delete records, view all data
    VIEWER    // Read-only access to workspace data
}
