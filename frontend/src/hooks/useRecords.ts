import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { recordsApi, type RecordsQueryParams } from '@/api/recordsApi'
import { usersApi } from '@/api/usersApi'
import { queryKeys } from '@/hooks/queryKeys'
import { useWorkspace } from '@/contexts/WorkspaceContext'

export function useRecordsQuery(params: RecordsQueryParams) {
  const { currentWorkspace } = useWorkspace()
  return useQuery({
    queryKey: queryKeys.records(currentWorkspace?.id ?? null, params),
    queryFn: () => recordsApi.list(params),
    enabled: Boolean(currentWorkspace),
    // Always refetch when component mounts to ensure fresh data
    refetchOnMount: 'always',
    // Refetch when window regains focus
    refetchOnWindowFocus: true,
    // Keep previous data while fetching new data for better UX
    placeholderData: (previousData) => previousData,
  })
}

export function useAssignableQuery(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.assignableUsers,
    queryFn: () => usersApi.assignable(),
    enabled,
  })
}

export function useCreateRecordMutation() {
  const qc = useQueryClient()
  const { currentWorkspace } = useWorkspace()
  return useMutation({
    mutationFn: recordsApi.create,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['records'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      if (currentWorkspace) {
        void qc.invalidateQueries({ queryKey: queryKeys.records(currentWorkspace.id) })
        void qc.invalidateQueries({ queryKey: queryKeys.dashboard(currentWorkspace.id) })
      }
    },
  })
}

export function useUpdateRecordMutation() {
  const qc = useQueryClient()
  const { currentWorkspace } = useWorkspace()
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: Parameters<typeof recordsApi.update>[1] }) =>
      recordsApi.update(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['records'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      if (currentWorkspace) {
        void qc.invalidateQueries({ queryKey: queryKeys.records(currentWorkspace.id) })
        void qc.invalidateQueries({ queryKey: queryKeys.dashboard(currentWorkspace.id) })
      }
    },
  })
}

export function useDeleteRecordMutation() {
  const qc = useQueryClient()
  const { currentWorkspace } = useWorkspace()
  return useMutation({
    mutationFn: recordsApi.remove,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['records'] })
      void qc.invalidateQueries({ queryKey: ['dashboard'] })
      if (currentWorkspace) {
        void qc.invalidateQueries({ queryKey: queryKeys.records(currentWorkspace.id) })
        void qc.invalidateQueries({ queryKey: queryKeys.dashboard(currentWorkspace.id) })
      }
    },
  })
}
