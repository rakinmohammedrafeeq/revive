import { ReactNode, useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ToggleUserConfirmProps {
  trigger: ReactNode
  userName: string
  userEmail: string
  isActive: boolean
  onConfirm: () => void
}

export function ToggleUserConfirm({
  trigger,
  userName,
  userEmail,
  isActive,
  onConfirm,
}: ToggleUserConfirmProps) {
  const [open, setOpen] = useState(false)

  const handleConfirm = () => {
    onConfirm()
    setOpen(false)
  }

  const action = isActive ? 'deactivate' : 'activate'
  const actionTitle = isActive ? 'Deactivate' : 'Activate'

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{actionTitle} user account?</AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to {action} <strong>{userName}</strong>?
            </p>
            <p className="text-xs text-muted-foreground">{userEmail}</p>
            {isActive ? (
              <p className="text-sm text-amber-600 dark:text-amber-500 mt-3">
                This user will lose access to the workspace and won't be able to sign in.
              </p>
            ) : (
              <p className="text-sm text-emerald-600 dark:text-emerald-500 mt-3">
                This user will regain access to the workspace and be able to sign in.
              </p>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className={
              isActive
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }
          >
            {actionTitle}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
