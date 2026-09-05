import React, { useEffect, useState } from 'react';
import { Users, UserPlus, Crown, Edit, Eye, Trash2 } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/contexts/AuthContext';
import { workspaceMemberApi, WorkspaceMember } from '@/api/workspaceMemberApi';
import { AddMembersModal } from '@/components/workspace/AddMembersModal';
import { useNavigate } from 'react-router-dom';

export const WorkspaceMembersPage: React.FC = () => {
  const { currentWorkspace, refreshWorkspaces } = useWorkspace();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<WorkspaceMember | null>(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);

  const loadMembers = async () => {
    if (!currentWorkspace) return;

    try {
      setLoading(true);
      const data = await workspaceMemberApi.getMembers(currentWorkspace.id);
      
      // Sort: workspace owner first, then current user, then by name
      const sorted = data.sort((a, b) => {
        const aIsOwner = a.permission === 'OWNER';
        const bIsOwner = b.permission === 'OWNER';
        const aIsCurrent = a.userEmail === user?.email;
        const bIsCurrent = b.userEmail === user?.email;
        
        // Owner always first
        if (aIsOwner && !bIsOwner) return -1;
        if (!aIsOwner && bIsOwner) return 1;
        
        // If neither is owner, current user comes next
        if (!aIsOwner && !bIsOwner) {
          if (aIsCurrent && !bIsCurrent) return -1;
          if (!aIsCurrent && bIsCurrent) return 1;
        }
        
        // Otherwise sort by name
        return a.userName.localeCompare(b.userName);
      });
      
      setMembers(sorted);
    } catch (error) {
      console.error('Failed to load members:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
  }, [currentWorkspace]);

  const handleMemberAdded = async () => {
    // Refresh both members list and workspace list
    await loadMembers();
    await refreshWorkspaces();
  };

  const handleRemoveMember = async (userId: number) => {
    if (!currentWorkspace || !memberToRemove) return;

    setIsRemovingMember(true);
    try {
      await workspaceMemberApi.removeMember(currentWorkspace.id, userId);
      await loadMembers();
      setMemberToRemove(null);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to remove member');
    } finally {
      setIsRemovingMember(false);
    }
  };

  const handleUpdatePermission = async (userId: number, newPermission: 'EDITOR' | 'VIEWER') => {
    if (!currentWorkspace) return;

    try {
      await workspaceMemberApi.updatePermission(currentWorkspace.id, userId, { permission: newPermission });
      await loadMembers();
      await refreshWorkspaces();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update permission');
    }
  };

  const getPermissionBadge = (permission: string) => {
    const styles = {
      OWNER: 'bg-primary/10 text-primary border-primary/20',
      EDITOR: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      VIEWER: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20',
    };

    const icons = {
      OWNER: Crown,
      EDITOR: Edit,
      VIEWER: Eye,
    };

    const labels = {
      OWNER: 'Owner',
      EDITOR: 'Editor',
      VIEWER: 'Viewer',
    };

    const Icon = icons[permission as keyof typeof icons];
    const style = styles[permission as keyof typeof styles];
    const label = labels[permission as keyof typeof labels];

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border ${style}`}>
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  };

  const isCurrentUser = (member: WorkspaceMember) => {
    return member.userEmail === user?.email || member.userId === user?.id;
  };

  const canManageMembers = currentWorkspace?.userPermission === 'OWNER';

  // Handle no workspace selected
  if (!currentWorkspace) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
          <Users className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No Workspace Selected</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          Please select a workspace from the sidebar to view and manage members.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading members...</div>
      </div>
    );
  }

  // Handle empty members list
  if (members.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Team Members</h1>
            <p className="text-muted-foreground mt-1">
              Manage team access and member roles
            </p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center h-[50vh] bg-card border border-border rounded-2xl">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Users className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">No Additional Members Found</h3>
          <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
            Invite colleagues to collaborate on failed payment recovery and analytics.
          </p>
          {canManageMembers && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          )}
        </div>
        {currentWorkspace && (
          <AddMembersModal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            workspaceId={currentWorkspace.id}
            existingMemberEmails={members.map(m => m.userEmail)}
            onSuccess={handleMemberAdded}
          />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Members</h1>
          <p className="text-muted-foreground mt-1">
            Manage team access and member roles
          </p>
        </div>
        <div className="flex items-center gap-3">
          {canManageMembers && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          )}
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Permission
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Joined
                </th>
                {canManageMembers && (
                  <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => {
                const isCurrent = isCurrentUser(member);
                return (
                  <tr
                    key={member.id}
                    className={`hover:bg-accent/50 transition-colors ${
                      isCurrent ? 'bg-primary/[0.08] border-l-4 border-l-primary/60' : ''
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-semibold text-primary">
                            {member.userName.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className={`font-medium ${isCurrent ? 'text-primary' : 'text-foreground'}`}>
                              {member.userName}
                            </p>
                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-primary/20 text-primary text-xs font-medium rounded">
                                You
                              </span>
                            )}
                          </div>
                          <p className={`text-sm ${isCurrent ? 'text-primary/80' : 'text-muted-foreground'}`}>
                            {member.userEmail}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {member.permission === 'OWNER' ? (
                        <div className="flex items-center gap-2">
                          {getPermissionBadge(member.permission)}
                          <span className="text-xs text-muted-foreground">Team Owner</span>
                        </div>
                      ) : canManageMembers && !isCurrent ? (
                        <select
                          value={member.permission}
                          onChange={(e) =>
                            handleUpdatePermission(member.userId, e.target.value as 'EDITOR' | 'VIEWER')
                          }
                          className="px-3 py-1.5 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        >
                          <option value="EDITOR">Editor</option>
                          <option value="VIEWER">Viewer</option>
                        </select>
                      ) : (
                        getPermissionBadge(member.permission)
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {new Date(member.joinedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    {canManageMembers && (
                      <td className="px-6 py-4 text-right">
                        {isCurrent ? (
                          <span className="text-sm text-muted-foreground">Cannot modify self</span>
                        ) : member.permission === 'OWNER' ? (
                          <span className="text-sm text-muted-foreground">Team Owner</span>
                        ) : (
                          <button
                            onClick={() => setMemberToRemove(member)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {currentWorkspace && (
        <AddMembersModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          workspaceId={currentWorkspace.id}
          existingMemberEmails={members.map(m => m.userEmail)}
          onSuccess={handleMemberAdded}
        />
      )}

      {/* Remove Member Confirmation */}
      {memberToRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Remove Team Member</h3>
                  <p className="text-sm text-muted-foreground">Revoke access for this user</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                Are you sure you want to remove <span className="font-medium text-foreground">{memberToRemove.userName}</span> from this team?
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setMemberToRemove(null)}
                  disabled={isRemovingMember}
                  className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent/80 text-foreground rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRemoveMember(memberToRemove.userId)}
                  disabled={isRemovingMember}
                  className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRemovingMember ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Removing...
                    </>
                  ) : (
                    'Remove Member'
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
