import React, { useState, useEffect } from 'react';
import { X, Search, UserPlus, Check } from 'lucide-react';
import { usersApi } from '@/api/usersApi';
import { workspaceMemberApi } from '@/api/workspaceMemberApi';
import type { UserListItem } from '@/types/userList';

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  existingMemberEmails: string[];
  onSuccess: () => void;
}

interface ConfirmDialogProps {
  isOpen: boolean;
  userName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmAddDialog: React.FC<ConfirmDialogProps> = ({ isOpen, userName, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-2">Add Member</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Are you sure you want to add <span className="font-medium text-foreground">{userName}</span> to this workspace?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent/80 text-foreground rounded-xl font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground rounded-xl font-medium transition-all shadow-lg shadow-primary/20"
            >
              Add Member
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface AddMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  existingMemberEmails: string[];
  onSuccess: () => void;
}

export const AddMembersModal: React.FC<AddMembersModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  existingMemberEmails,
  onSuccess,
}) => {
  const [allUsers, setAllUsers] = useState<UserListItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [addingUserId, setAddingUserId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [confirmUser, setConfirmUser] = useState<UserListItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      setSuccessMessage('');
      setError('');
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const users = await usersApi.list();
      setAllUsers(users);
    } catch (err) {
      console.error('Failed to load users:', err);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async (user: UserListItem) => {
    try {
      setAddingUserId(user.id);
      setError('');
      setSuccessMessage('');
      setConfirmUser(null);
      
      await workspaceMemberApi.inviteMember(workspaceId, {
        email: user.email,
        permission: 'EDITOR',
      });
      
      // Show success message
      setSuccessMessage(`${user.name} added successfully!`);
      setAddingUserId(null);
      
      // Refresh member list and close after delay
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccessMessage('');
      }, 1500);
    } catch (err: any) {
      let errorMessage = 'Failed to add member';
      
      // Extract clean error message
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setAddingUserId(null);
    }
  };

  const handleAddClick = (user: UserListItem) => {
    setConfirmUser(user);
  };

  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const notAlreadyMember = !existingMemberEmails.includes(user.email);
    return matchesSearch && notAlreadyMember && user.active;
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border flex-shrink-0">
          <div>
            <h2 className="text-xl font-bold text-foreground">Add Members</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Search and add registered users to your workspace
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 border-b border-border flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-muted-foreground">Loading users...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {searchQuery ? 'No users found matching your search' : 'No available users to add'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-semibold text-primary">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddClick(user)}
                    disabled={addingUserId === user.id}
                    className="flex items-center gap-2 px-4 py-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {addingUserId === user.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        Add
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {successMessage && (
          <div className="p-4 mx-6 mb-6 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 flex-shrink-0">
            <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
            <p className="text-sm text-green-600 dark:text-green-400">{successMessage}</p>
          </div>
        )}

        {error && (
          <div className="p-4 mx-6 mb-6 bg-destructive/10 border border-destructive/20 rounded-lg flex-shrink-0">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmAddDialog
        isOpen={!!confirmUser}
        userName={confirmUser?.name || ''}
        onConfirm={() => confirmUser && handleAddMember(confirmUser)}
        onCancel={() => setConfirmUser(null)}
      />
    </div>
  );
};
