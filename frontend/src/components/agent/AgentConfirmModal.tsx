import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, Loader2, Timer, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { confirmAgentAction, cancelAgentAction } from '@/api/aiApi'
import type { PendingAction } from '@/api/aiApi'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

/**
 * Props interface for the confirmation modal.
 * Kept in this file because it is the single source of truth for the modal contract.
 */
export interface AgentConfirmModalProps {
  pendingAction: PendingAction
  /** Called with the agent's FINAL_ANSWER text after the write executes successfully. */
  onConfirm: (answer: string) => void
  /** Called when the user explicitly dismisses without confirming. */
  onCancel: () => void
  /** Called when the 10-minute TTL reaches zero before the user acts. */
  onExpired: () => void
}

// ── Constants ──────────────────────────────────────────────────────────────

/** Tick interval for the countdown in milliseconds. */
const TICK_MS = 1000

// ── Helpers ────────────────────────────────────────────────────────────────

/** Formats remaining seconds as "m:ss". */
function formatCountdown(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/** Computes seconds remaining from an ISO-8601 expiresAt string. */
function secondsUntil(isoDatetime: string): number {
  const remaining = Math.floor((new Date(isoDatetime).getTime() - Date.now()) / 1000)
  return Math.max(0, remaining)
}

// ── Component ───────────────────────────────────────────────────────────────

/**
 * Modal displayed when the agent proposes a write action (create_transaction or
 * update_transaction) that requires explicit user confirmation before executing.
 *
 * IMPORTANT: `pendingAction.toolArguments` is raw JSON from the LLM and is
 * intentionally excluded from this component entirely. Only `pendingAction.summary`
 * is ever rendered. Do not add toolArguments to the UI in future passes.
 */
export const AgentConfirmModal = ({
  pendingAction,
  onConfirm,
  onCancel,
  onExpired,
}: AgentConfirmModalProps) => {
  const queryClient = useQueryClient()
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    secondsUntil(pendingAction.expiresAt)
  )

  // ── Countdown timer ───────────────────────────────────────────────────────

  useEffect(() => {
    // Recalculate from the actual expiresAt on each mount in case of clock drift
    setSecondsLeft(secondsUntil(pendingAction.expiresAt))

    const interval = setInterval(() => {
      const remaining = secondsUntil(pendingAction.expiresAt)
      setSecondsLeft(remaining)

      if (remaining <= 0) {
        clearInterval(interval)
        // Auto-close and notify the parent — do NOT call confirm endpoint on an
        // expired action (it will 404 server-side anyway).
        onExpired()
      }
    }, TICK_MS)

    return () => clearInterval(interval)
  }, [pendingAction.expiresAt, pendingAction.actionId, onExpired])

  // ── Mutations ─────────────────────────────────────────────────────────────

  const confirmMutation = useMutation({
    mutationFn: () => confirmAgentAction({ actionId: pendingAction.actionId }),
    onSuccess: (response) => {
      // Invalidate all records and dashboard queries to refresh data
      void queryClient.invalidateQueries({ queryKey: ['records'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      
      toast.success('Done', { description: 'Transaction saved successfully.' })
      onConfirm(response.answer ?? 'Action completed successfully.')
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        (error instanceof Error ? error.message : null) ??
        'Failed to execute the action. Please try again.'
      toast.error('Action failed', { description: msg })
      // Keep the modal open so the user can retry or cancel
    },
  })

  const cancelMutation = useMutation({
    mutationFn: () => cancelAgentAction(pendingAction.actionId),
    onSuccess: () => {
      onCancel()
    },
    onError: () => {
      // Even if the server-side cancel fails (e.g. already expired), treat it
      // as cancelled from the user's perspective — the action won't execute.
      onCancel()
    },
  })

  // ── Derived state ─────────────────────────────────────────────────────────

  const isBusy = confirmMutation.isPending || cancelMutation.isPending
  const isExpired = secondsLeft <= 0

  /** Countdown turns amber at ≤60s, red at ≤15s. */
  const countdownColor =
    secondsLeft <= 15
      ? 'text-destructive'
      : secondsLeft <= 60
      ? 'text-yellow-600 dark:text-yellow-400'
      : 'text-muted-foreground'

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog
      open={true}
      // onOpenChange fires for Escape key and the explicit close button — both are
      // deliberate actions and are treated as Cancel. Overlay (pointer) clicks are
      // blocked separately via onPointerDownOutside below.
      onOpenChange={(open) => {
        if (!open && !isBusy) cancelMutation.mutate()
      }}
    >
      <DialogContent
        showCloseButton={!isBusy}
        className="sm:max-w-md"
        // Block overlay (pointer-down outside) unconditionally — an accidental
        // mis-click must not silently cancel a real write action.
        // Escape key is intentionally left unblocked: it fires through onOpenChange,
        // not through this event, and is a deliberate keyboard action.
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
            <DialogTitle>Confirm Action</DialogTitle>
          </div>
          <DialogDescription>
            The agent wants to make the following change to your workspace.
            Review it carefully before confirming — this will be saved immediately.
          </DialogDescription>
        </DialogHeader>

        {/* Action summary — the ONLY field from pendingAction shown to the user */}
        <div className="rounded-lg border bg-muted/50 px-4 py-3">
          <p className="text-sm font-medium leading-relaxed">{pendingAction.summary}</p>
        </div>

        {/* Countdown timer */}
        <div className={`flex items-center gap-1.5 text-xs ${countdownColor}`}>
          <Timer className="h-3.5 w-3.5 flex-shrink-0" />
          {isExpired ? (
            <span>Expired — please ask again</span>
          ) : (
            <span>Expires in {formatCountdown(secondsLeft)}</span>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {/* Cancel */}
          <Button
            id="agent-confirm-cancel"
            variant="outline"
            onClick={() => cancelMutation.mutate()}
            disabled={isBusy || isExpired}
          >
            {cancelMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Cancel
          </Button>

          {/* Confirm */}
          <Button
            id="agent-confirm-proceed"
            onClick={() => confirmMutation.mutate()}
            disabled={isBusy || isExpired}
          >
            {confirmMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
