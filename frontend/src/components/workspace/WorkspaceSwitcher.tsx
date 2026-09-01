import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Plus, Check, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useNavigate } from 'react-router-dom';
import { RenameWorkspaceModal } from './RenameWorkspaceModal';

interface WorkspaceSwitcherProps {
  onCreateClick: () => void;
}

export const WorkspaceSwitcher: React.FC<WorkspaceSwitcherProps> = ({ onCreateClick }) => {
  const { currentWorkspace, workspaces, switchWorkspace, updateWorkspace, deleteWorkspace } = useWorkspace();
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const actionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (actionsMenuRef.current && !actionsMenuRef.current.contains(event.target as Node)) {
        setShowActionsMenu(false);
      }
    };

    if (showActionsMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showActionsMenu]);

  const handleSwitch = async (workspaceId: number) => {
    try {
      await switchWorkspace(workspaceId);
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to switch workspace:', error);
    }
  };

  const handleRename = async (newName: string) => {
    if (!currentWorkspace) return;
    await updateWorkspace(currentWorkspace.id, newName);
  };

  const handleDelete = async () => {
    if (!currentWorkspace) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteWorkspace(currentWorkspace.id);
      setShowDeleteConfirm(false);
      navigate('/app/dashboard');
    } catch (error: any) {
      // Extract clean error message
      let errorMessage = 'Failed to delete workspace';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setDeleteError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const isOwner = currentWorkspace?.userPermission === 'OWNER';

  if (isCollapsed) {
    return (
      <div className="px-3 py-2">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-bold text-primary">
            {currentWorkspace?.name.charAt(0).toUpperCase() || 'W'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative px-3 py-2">
      {/* Main Workspace Button */}
      <div className="w-full group relative">
        <button
          onClick={(e) => {
            e.stopPropagation(); // Keep sidebar collapsed
            setIsOpen(!isOpen);
          }}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl bg-sidebar-accent/50 hover:bg-sidebar-accent transition-all duration-200 group-hover:shadow-md"
        >
          {/* Gold accent line with glow effect */}
          <div className="relative flex-shrink-0">
            <div className="w-1 h-10 bg-gradient-to-b from-primary via-primary to-primary/60 rounded-full" />
            <div className="absolute inset-0 w-1 h-10 bg-primary/20 blur-sm rounded-full" />
          </div>
          
          {/* Workspace info */}
          <div className="flex flex-col items-start justify-center min-w-0 flex-1">
            <span className="text-sm font-bold text-sidebar-foreground break-words w-full leading-tight">
              {currentWorkspace?.name || 'Select Workspace'}
            </span>
            <span className="text-xs text-sidebar-foreground/50 whitespace-nowrap mt-1 font-medium">
              {currentWorkspace ? (
                <>
                  <span className="text-primary/80">{currentWorkspace.userPermission === 'OWNER' ? 'Owner' : currentWorkspace.userPermission === 'EDITOR' ? 'Editor' : 'Viewer'}</span>
                  <span className="mx-1.5">·</span>
                  <span>{currentWorkspace.memberCount} {currentWorkspace.memberCount === 1 ? 'member' : 'members'}</span>
                </>
              ) : (
                'No workspace selected'
              )}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {currentWorkspace && isOwner && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowActionsMenu(!showActionsMenu);
                }}
                className="p-1.5 hover:bg-sidebar-accent rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                title="Workspace actions"
              >
                <MoreVertical className="w-4 h-4 text-sidebar-foreground/60" />
              </button>
            )}
            <div className="p-1">
              <ChevronDown
                className={`w-4 h-4 text-sidebar-foreground/40 transition-all duration-300 ${
                  isOpen ? 'rotate-180 text-primary' : 'group-hover:text-sidebar-foreground/60'
                }`}
              />
            </div>
          </div>
        </button>

        {/* Actions Menu - positioned relative to the outer container */}
        {currentWorkspace && isOwner && showActionsMenu && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowActionsMenu(false)}
            />
            <div className="absolute left-3 right-3 top-full mt-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="py-2">
                {/* Rename Option */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActionsMenu(false);
                    setShowRenameModal(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/80 active:bg-accent transition-all duration-150 text-left group/item"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 group-hover/item:bg-primary/20 flex items-center justify-center transition-colors">
                    <Edit className="w-4 h-4 text-primary group-hover/item:scale-110 transition-transform" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-semibold text-foreground">Rename</span>
                    <span className="text-xs text-muted-foreground">Change workspace name</span>
                  </div>
                </button>
                
                {/* Divider */}
                <div className="my-2 mx-3 border-t border-border/50" />
                
                {/* Delete Option */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowActionsMenu(false);
                    setShowDeleteConfirm(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-red-500/10 active:bg-red-500/15 transition-all duration-150 text-left text-red-600 dark:text-red-400 group/item"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 group-hover/item:bg-red-500/20 flex items-center justify-center transition-colors">
                    <Trash2 className="w-4 h-4 group-hover/item:scale-110 group-hover/item:rotate-12 transition-all" />
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-sm font-semibold">Delete</span>
                    <span className="text-xs opacity-75">Remove workspace</span>
                  </div>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-3 right-3 mt-3 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
            {/* Workspace List */}
            <div className="max-h-80 overflow-y-auto py-2">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Your Workspaces
              </div>
              {workspaces.map((workspace, index) => (
                <button
                  key={workspace.id}
                  onClick={(e) => {
                    e.stopPropagation(); // Keep sidebar collapsed
                    handleSwitch(workspace.id);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/80 transition-all duration-150 group/workspace ${
                    currentWorkspace?.id === workspace.id ? 'bg-accent/50' : ''
                  }`}
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  {/* Checkmark for active workspace */}
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {currentWorkspace?.id === workspace.id && (
                      <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary" strokeWidth={3} />
                      </div>
                    )}
                  </div>
                  
                  {/* Workspace details */}
                  <div className="flex flex-col items-start flex-1 min-w-0">
                    <span className="text-sm font-semibold text-foreground break-words w-full text-left group-hover/workspace:text-primary transition-colors">
                      {workspace.name}
                    </span>
                    <span className="text-xs text-muted-foreground mt-0.5">
                      {workspace.userPermission === 'OWNER' ? 'Owner' : workspace.userPermission === 'EDITOR' ? 'Editor' : 'Viewer'} · {workspace.memberCount} {workspace.memberCount === 1 ? 'member' : 'members'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
            
            {/* Create Workspace Button */}
            <div className="border-t border-border/50 bg-accent/30">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Keep sidebar collapsed
                  setIsOpen(false);
                  onCreateClick();
                }}
                className="w-full flex items-center justify-center gap-2.5 px-4 py-3.5 hover:bg-primary/10 transition-all duration-200 text-primary group/create"
              >
                <div className="w-5 h-5 rounded-lg bg-primary/10 group-hover/create:bg-primary/20 flex items-center justify-center transition-colors">
                  <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
                </div>
                <span className="text-sm font-bold">Create Workspace</span>
              </button>
            </div>
          </div>
        </>
      )}

      {currentWorkspace && (
        <>
          <RenameWorkspaceModal
            isOpen={showRenameModal}
            onClose={() => setShowRenameModal(false)}
            currentName={currentWorkspace.name}
            onRename={handleRename}
          />

          {/* Delete Workspace Confirmation */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
              <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
                      <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">Delete Workspace</h3>
                      <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-6">
                    Are you sure you want to delete <span className="font-medium text-foreground">"{currentWorkspace.name}"</span>? 
                    All workspace data, members, and records will be permanently removed.
                  </p>
                  
                  {deleteError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-sm text-red-600 dark:text-red-400">{deleteError}</p>
                    </div>
                  )}
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteError(null);
                      }}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2.5 bg-accent hover:bg-accent/80 text-foreground rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isDeleting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        'Delete Workspace'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
