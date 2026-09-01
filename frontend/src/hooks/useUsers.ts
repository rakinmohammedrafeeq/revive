import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { usersApi } from '@/api/usersApi'
import { queryKeys } from '@/hooks/queryKeys'

export function useUsersQuery() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: () => usersApi.list(),
  })
}

export function useToggleUserMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: usersApi.toggleStatus,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.users })
    },
  })
}
