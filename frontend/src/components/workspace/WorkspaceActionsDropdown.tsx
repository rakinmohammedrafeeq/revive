import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical, Edit, UserPlus, Users, LogOut, Trash2 } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';

interface WorkspaceActionsDropdownProps {
  onRename: () => void;
  onInvite: () => void;
  onManageMembers: () => void;
  onLeave: () => void;
  onDelete: () => void;
  canDelete: boolean;
  canLeave: boolean;
  isOwner: boolean;
}

export const WorkspaceActionsDropdown: React.FC<WorkspaceActionsDropdownProps> = ({
  onRename,
  onInvite,
  onManageMembers,
  onLeave,
  onDelete,
  canDelete,
  canLeave,
  isOwner,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 hover:bg-accent rounded-lg transition-colors"
      >
        <MoreVertical className="w-4 h-4 text-muted-foreground" />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="py-1">
            {isOwner && (
              <button
                onClick={() => handleAction(onRename)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left"
              >
                <Edit className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Rename Workspace</span>
              </button>
            )}

            {isOwner && (
              <button
                onClick={() => handleAction(onInvite)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left"
              >
                <UserPlus className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Invite Members</span>
              </button>
            )}

            <button
              onClick={() => handleAction(onManageMembers)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left"
            >
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Manage Members</span>
            </button>

            {canLeave && (
              <>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => handleAction(onLeave)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left text-orange-600 dark:text-orange-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Leave Workspace</span>
                </button>
              </>
            )}

            {canDelete && isOwner && (
              <>
                <div className="my-1 border-t border-border" />
                <button
                  onClick={() => handleAction(onDelete)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-red-500/10 transition-colors text-left text-red-600 dark:text-red-400"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Delete Workspace</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
