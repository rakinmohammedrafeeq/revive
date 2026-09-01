export const queryKeys = {
  dashboard: (workspaceId: number | null) => ['dashboard', workspaceId] as const,
  records: (workspaceId: number | null, params?: unknown) =>
    ['records', workspaceId, params ?? {}] as const,
  users: ['users'] as const,
  assignableUsers: ['users', 'assignable'] as const,
}
