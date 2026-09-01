import React, { useState, useMemo } from 'react';
import { Shield, Search, CheckCircle, XCircle, Users, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, AdminUser } from '@/api/adminApi';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const AdminUsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [sort, setSort] = useState('createdAt:desc');
  const [confirmAction, setConfirmAction] = useState<{ user: AdminUser; action: 'activate' | 'deactivate' } | null>(null);

  const sortBy = sort.split(':')[0] as string;
  const direction = sort.split(':')[1] as 'asc' | 'desc';

  const queryParams = useMemo(
    () => ({
      page,
      size: 15,
      sortBy,
      direction,
      ...(search.trim() ? { search: search.trim() } : {}),
      ...(statusFilter !== 'all' ? { active: statusFilter === 'active' } : {}),
    }),
    [page, sortBy, direction, search, statusFilter],
  );

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-users', queryParams],
    queryFn: () => adminApi.getUsers(queryParams),
  });

  // Sort users to put current user at the top
  const sortedUsers = useMemo(() => {
    if (!data?.content || !currentUser) return data?.content ?? [];
    
    const users = [...data.content];
    return users.sort((a, b) => {
      if (a.email === currentUser.email) return -1;
      if (b.email === currentUser.email) return 1;
      return 0;
    });
  }, [data?.content, currentUser]);

  const updateStatusMutation = useMutation({
    mutationFn: ({ userId, active }: { userId: number; active: boolean }) =>
      adminApi.updateUserStatus(userId, active),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast.success(variables.active ? 'User activated successfully' : 'User deactivated successfully');
      setConfirmAction(null);
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to update user status';
      toast.error(message);
    },
  });

  const handleStatusToggle = (user: AdminUser, newStatus: boolean) => {
    setConfirmAction({
      user,
      action: newStatus ? 'activate' : 'deactivate',
    });
  };

  const confirmStatusChange = () => {
    if (!confirmAction) return;
    updateStatusMutation.mutate({
      userId: confirmAction.user.id,
      active: confirmAction.action === 'activate',
    });
  };

  const users = sortedUsers;
  const totalPages = data?.totalPages ?? 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">User Management</h1>
              <p className="text-muted-foreground mt-1">Platform-wide user administration</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/20 rounded-xl">
          <Users className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-primary">
            {data?.totalElements || 0} Total Users
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as 'all' | 'active' | 'inactive');
              setPage(0);
            }}
            className="px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
            className="px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="createdAt:desc">Newest First</option>
            <option value="createdAt:asc">Oldest First</option>
            <option value="name:asc">Name A-Z</option>
            <option value="name:desc">Name Z-A</option>
            <option value="email:asc">Email A-Z</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <XCircle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Access Denied</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              You don't have permission to access user management. Only platform administrators can view this page.
            </p>
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No users found matching your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Workspaces
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {users.map((user) => {
                    const isCurrentUserRow = currentUser?.email === user.email;
                    return (
                      <tr 
                        key={user.id} 
                        className={`hover:bg-accent/50 transition-colors ${
                          isCurrentUserRow ? 'bg-primary/[0.08] border-l-4 border-l-primary/60' : ''
                        }`}
                      >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-semibold text-primary">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-foreground">{user.name}</p>
                              {currentUser?.email === user.email && (
                                <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded">
                                  You
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.role === 'ADMIN' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">
                            ADMIN
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-foreground">{user.workspaceCount} workspace{user.workspaceCount !== 1 ? 's' : ''}</p>
                          {user.currentWorkspaceName && (
                            <p className="text-xs text-muted-foreground">Current: {user.currentWorkspaceName}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.active ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            <XCircle className="w-3.5 h-3.5" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isCurrentUserRow ? (
                          <span className="text-sm text-muted-foreground">Cannot modify self</span>
                        ) : (
                          <button
                            onClick={() => handleStatusToggle(user, !user.active)}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                              user.active
                                ? 'text-red-600 dark:text-red-400 hover:bg-red-500/10'
                                : 'text-green-600 dark:text-green-400 hover:bg-green-500/10'
                            }`}
                          >
                            {user.active ? 'Deactivate' : 'Activate'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 border-t border-border p-4">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page <= 0}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="text-sm text-muted-foreground">
                  Page {page + 1} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  confirmAction.action === 'activate'
                    ? 'bg-green-500/10'
                    : 'bg-red-500/10'
                }`}>
                  {confirmAction.action === 'activate' ? (
                    <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {confirmAction.action === 'activate' ? 'Activate User' : 'Deactivate User'}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {confirmAction.action === 'activate' ? 'Restore user access' : 'Suspend user access'}
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {confirmAction.action === 'activate' ? (
                  <>
                    Are you sure you want to activate <span className="font-medium text-foreground">{confirmAction.user.name}</span>? 
                    They will be able to log in and access their workspaces.
                  </>
                ) : (
                  <>
                    Are you sure you want to deactivate <span className="font-medium text-foreground">{confirmAction.user.name}</span>? 
                    They will not be able to log in or access any workspaces. Their data will remain intact.
                  </>
                )}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  disabled={updateStatusMutation.isPending}
                  className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent/80 text-foreground rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmStatusChange}
                  disabled={updateStatusMutation.isPending}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                    confirmAction.action === 'activate'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {updateStatusMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    confirmAction.action === 'activate' ? 'Activate User' : 'Deactivate User'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
