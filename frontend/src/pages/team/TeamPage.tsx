import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { useToggleUserMutation, useUsersQuery } from '@/hooks'
import { getRoleLabel } from '@/lib/roleUtils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ToggleUserConfirm } from '@/components/team/ToggleUserConfirm'

export function TeamPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'ADMIN'
  const { data = [], isLoading } = useUsersQuery()
  const toggle = useToggleUserMutation()

  const onToggle = (id: number) => {
    toggle.mutate(id, {
      onSuccess: () => toast.success('Member updated'),
      onError: () => toast.error('Could not update member'),
    })
  }

  // Sort users: current user first, then by name
  const sortedData = [...data].sort((a, b) => {
    const aIsCurrent = a.id === user?.id || a.email === user?.email
    const bIsCurrent = b.id === user?.id || b.email === user?.email
    
    if (aIsCurrent) return -1
    if (bIsCurrent) return 1
    return a.name.localeCompare(b.name)
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team</h1>
        <p className="text-muted-foreground">Workspace members and roles</p>
      </div>

      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base">Members</CardTitle>
          <CardDescription>
            {isAdmin
              ? 'You can activate or deactivate accounts.'
              : 'Administrators control activation; you have full visibility of the roster.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : data.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No members yet</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Joined</TableHead>
                  {isAdmin ? <TableHead className="text-right">Actions</TableHead> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((u) => {
                  const isCurrentUser = u.id === user?.id || u.email === user?.email
                  return (
                    <TableRow 
                      key={u.id}
                      className={isCurrentUser ? 'bg-primary/[0.08] border-l-4 border-l-primary/60' : ''}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span className={isCurrentUser ? 'text-primary' : ''}>{u.name}</span>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-[10px] font-medium px-1.5 py-0">
                              You
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={isCurrentUser ? 'text-primary/80' : ''}>
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{getRoleLabel(u.role)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.active ? 'default' : 'secondary'}>
                          {u.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{u.createdAt}</TableCell>
                      {isAdmin ? (
                        <TableCell className="text-right">
                          {isCurrentUser ? (
                            <span className="text-xs text-muted-foreground/60 italic select-none">
                              Cannot modify self
                            </span>
                          ) : (
                            <ToggleUserConfirm
                              userName={u.name}
                              userEmail={u.email}
                              isActive={u.active}
                              onConfirm={() => onToggle(u.id)}
                              trigger={
                                <Button
                                  variant="outline"
                                  size="sm"
                                  disabled={toggle.isPending}
                                >
                                  {u.active ? 'Deactivate' : 'Activate'}
                                </Button>
                              }
                            />
                          )}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
