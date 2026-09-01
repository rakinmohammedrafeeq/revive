import React, { useState } from 'react';
import { X } from 'lucide-react';
import { workspaceMemberApi } from '@/api/workspaceMemberApi';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceId: number;
  onSuccess: () => void;
}

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  onSuccess,
}) => {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState<'OWNER' | 'EDITOR' | 'VIEWER'>('EDITOR');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      await workspaceMemberApi.inviteMember(workspaceId, { email: email.trim(), permission });
      setSuccess('Invitation sent successfully!');
      setEmail('');
      setTimeout(() => {
        onSuccess();
        onClose();
        setSuccess('');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Invite Member</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="member-email" className="block text-sm font-medium text-foreground mb-2">
              Email Address
            </label>
            <input
              id="member-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="colleague@company.com"
              className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="member-permission" className="block text-sm font-medium text-foreground mb-2">
              Permission Level
            </label>
            <select
              id="member-permission"
              value={permission}
              onChange={(e) => setPermission(e.target.value as 'OWNER' | 'EDITOR' | 'VIEWER')}
              className="w-full px-4 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              disabled={loading}
            >
              <option value="EDITOR">Editor - Can create and edit records</option>
              <option value="VIEWER">Read Only - Can view records</option>
              <option value="OWNER">Owner - Full access</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent/80 text-foreground rounded-xl font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground rounded-xl font-medium transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Invitation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
