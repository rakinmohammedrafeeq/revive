import * as React from 'react'

import { useAuth } from '@/contexts/AuthContext'
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

interface LogoutConfirmProps {
  /** The element the user clicks to start the logout flow (e.g. a Button or DropdownMenuItem). */
  trigger: React.ReactNode
  title?: string
  description?: string
  cancelText?: string
  confirmText?: string
  /** Optional side-effect to run after logout (e.g. close a mobile sidebar). */
  onLoggedOut?: () => void
}

export function LogoutConfirm({
  trigger,
  title = 'Log out?',
  description = 'You will be signed out of your account.',
  cancelText = 'Cancel',
  confirmText = 'Log out',
  onLoggedOut,
}: LogoutConfirmProps) {
  const { logout } = useAuth()

  const handleConfirm = () => {
    logout()
    onLoggedOut?.()
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

