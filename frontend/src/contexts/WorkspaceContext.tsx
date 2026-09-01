import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { workspaceApi, Workspace } from '@/api/workspaceApi';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/hooks/queryKeys';

interface WorkspaceContextType {
  currentWorkspace: Workspace | null;
  workspaces: Workspace[];
  loading: boolean;
  error: string | null;
  switchWorkspace: (workspaceId: number) => Promise<void>;
  refreshWorkspaces: () => Promise<void>;
  createWorkspace: (name: string) => Promise<Workspace>;
  updateWorkspace: (id: number, name: string) => Promise<Workspace>;
  deleteWorkspace: (id: number) => Promise<void>;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export const useWorkspace = () => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return context;
};

interface WorkspaceProviderProps {
  children: ReactNode;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({ children }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadWorkspaces = async () => {
    if (!user) {
      setWorkspaces([]);
      setCurrentWorkspace(null);
      setLoading(false);
      return;
    }

    const maxRetries = 12; // 12 retries over ~3 minutes
    const baseDelay = 5000; // Start with 5 seconds
    let attempt = 0;

    const attemptLoad = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);
        const data = await workspaceApi.getWorkspaces();
        setWorkspaces(data);
        
        // Use the workspace marked as current by the backend
        const currentFromBackend = data.find(w => w.isCurrent);
        if (currentFromBackend) {
          setCurrentWorkspace(currentFromBackend);
        } else if (data.length > 0) {
          // Fallback: if no workspace is marked as current, switch to the first one
          const firstWorkspace = data[0];
          setCurrentWorkspace(firstWorkspace);
          // Call backend to set it as current
          try {
            await workspaceApi.switchWorkspace(firstWorkspace.id);
          } catch (err) {
            console.error('Failed to set initial workspace:', err);
          }
        }
      } catch (err: any) {
        attempt++;
        console.error(`Failed to load workspaces (attempt ${attempt}/${maxRetries}):`, err);
        
        // If we haven't exceeded max retries, try again
        if (attempt < maxRetries) {
          const delay = Math.min(baseDelay * Math.pow(1.5, attempt - 1), 30000); // Max 30 seconds between retries
          console.log(`Retrying in ${delay / 1000} seconds... (Backend may be cold-starting)`);
          
          // Keep loading state active and wait before retry
          await new Promise(resolve => setTimeout(resolve, delay));
          return attemptLoad();
        } else {
          // All retries exhausted
          const errorMessage = err.message || err.response?.data?.message || 'Failed to load workspaces after multiple attempts';
          setError(errorMessage);
          throw err;
        }
      } finally {
        // Only set loading to false if we're done (success or all retries exhausted)
        if (attempt >= maxRetries || workspaces.length > 0) {
          setLoading(false);
        }
      }
    };

    try {
      await attemptLoad();
    } catch (err) {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, [user]);

  const switchWorkspace = async (workspaceId: number) => {
    try {
      setError(null);
      const workspace = await workspaceApi.switchWorkspace(workspaceId);
      setCurrentWorkspace(workspace);
      
      // Refresh workspaces list to update any changes
      await loadWorkspaces();

      // Reset workspace-scoped caches
      void queryClient.invalidateQueries({ queryKey: queryKeys.records(workspaceId) });
      void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(workspaceId) });
    } catch (err: any) {
      console.error('Failed to switch workspace:', err);
      setError(err.response?.data?.message || 'Failed to switch workspace');
      throw err;
    }
  };

  const refreshWorkspaces = async () => {
    await loadWorkspaces();
  };

  const createWorkspace = async (name: string): Promise<Workspace> => {
    try {
      setError(null);
      const workspace = await workspaceApi.createWorkspace({ name });
      await loadWorkspaces();
      return workspace;
    } catch (err: any) {
      console.error('Failed to create workspace:', err);
      setError(err.response?.data?.message || 'Failed to create workspace');
      throw err;
    }
  };

  const updateWorkspace = async (id: number, name: string): Promise<Workspace> => {
    try {
      setError(null);
      const workspace = await workspaceApi.updateWorkspace(id, { name });
      await loadWorkspaces();
      if (currentWorkspace?.id === id) {
        setCurrentWorkspace(workspace);
      }
      return workspace;
    } catch (err: any) {
      console.error('Failed to update workspace:', err);
      setError(err.response?.data?.message || 'Failed to update workspace');
      throw err;
    }
  };

  const deleteWorkspace = async (id: number): Promise<void> => {
    try {
      setError(null);
      await workspaceApi.deleteWorkspace(id);
      
      // If deleted workspace was current, switch to another
      if (currentWorkspace?.id === id) {
        const remaining = workspaces.filter(w => w.id !== id);
        setCurrentWorkspace(remaining.length > 0 ? remaining[0] : null);
      }
      
      await loadWorkspaces();
    } catch (err: any) {
      console.error('Failed to delete workspace:', err);
      setError(err.response?.data?.message || 'Failed to delete workspace');
      throw err;
    }
  };

  const value: WorkspaceContextType = {
    currentWorkspace,
    workspaces,
    loading,
    error,
    switchWorkspace,
    refreshWorkspaces,
    createWorkspace,
    updateWorkspace,
    deleteWorkspace,
  };

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
};
