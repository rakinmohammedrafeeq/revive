import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Bot, User, Zap, Loader2 } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { sendAgentMessage } from '@/api/aiApi'
import type { PendingAction } from '@/api/aiApi'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import ReactMarkdown from 'react-markdown'
import { AgentConfirmModal } from './AgentConfirmModal'

// ── Local message type ──────────────────────────────────────────────────────

type MessageRole = 'user' | 'agent' | 'notice'

interface AgentChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: Date
  /** When true, renders the agent bubble in a muted error style. */
  isError?: boolean
}

// (markdown components are inlined directly into <ReactMarkdown> to avoid
// a type mismatch with react-markdown v10's Components generic — same pattern as AdvisorChat.tsx)

// ── Quick-start questions tuned for tool-calling (read queries) ─────────────

const quickQuestions = [
  'How much did I spend this month?',
  'What are my top expense categories?',
  'Show me my 10 most recent transactions',
  'What is my income vs expenses this year?',
]

// ── Component ───────────────────────────────────────────────────────────────

export const AgentChat = () => {
  const [messages, setMessages] = useState<AgentChatMessage[]>([])
  const [input, setInput]       = useState('')

  /**
   * When non-null, the agent has proposed a write action.
   * The input is disabled and AgentConfirmModal is shown.
   * Cleared on confirm, cancel, or TTL expiry.
   */
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { currentWorkspace } = useWorkspace()

  const agentMutation = useMutation({
    mutationFn: sendAgentMessage,
  })

  // Reset chat when the user switches workspaces
  useEffect(() => {
    setMessages([])
    setInput('')
    setPendingAction(null)
  }, [currentWorkspace?.id])

  // Auto-scroll to the latest message — 100ms delay matches AdvisorChat
  useEffect(() => {
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }, 100)
    return () => clearTimeout(timer)
  }, [messages])

  // ── Helpers ───────────────────────────────────────────────────────────────

  const addMessage = useCallback((msg: Omit<AgentChatMessage, 'id'>) => {
    setMessages(prev => [...prev, { ...msg, id: crypto.randomUUID() }])
  }, [])

  /**
   * Core send logic, shared by handleSend() and handleQuickQuestion().
   * Extracts the response-type branch so it isn't duplicated.
   */
  const sendMessage = useCallback(async (text: string) => {
    if (!currentWorkspace || !text.trim()) return

    addMessage({ role: 'user', content: text, timestamp: new Date() })

    try {
      const response = await agentMutation.mutateAsync({
        message: text,
        workspaceId: currentWorkspace.id,
      })

      if (response.responseType === 'FINAL_ANSWER') {
        addMessage({
          role: 'agent',
          content: response.answer ?? '',
          timestamp: new Date(),
        })
      } else if (
        response.responseType === 'PENDING_CONFIRMATION' &&
        response.pendingAction
      ) {
        // Do NOT render as a chat bubble — show the confirmation modal instead.
        // The modal will call onConfirm/onCancel/onExpired which resolve this state.
        setPendingAction(response.pendingAction)
      }
    } catch (error: unknown) {
      const axiosMsg =
        (error as { response?: { data?: { message?: string } } })?.response?.data?.message
      const errorMsg =
        axiosMsg ??
        (error instanceof Error ? error.message : null) ??
        'Something went wrong. Please try again.'

      addMessage({
        role: 'agent',
        content: errorMsg,
        timestamp: new Date(),
        isError: true,
      })
    }
  }, [currentWorkspace, agentMutation, addMessage])

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleSend = () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    void sendMessage(text)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleQuickQuestion = (question: string) => {
    void sendMessage(question)
  }

  // ── Confirmation modal callbacks ──────────────────────────────────────────

  /** Called by AgentConfirmModal after a successful confirm + execute. */
  const handleConfirmed = (answer: string) => {
    setPendingAction(null)
    addMessage({ role: 'agent', content: answer, timestamp: new Date() })
  }

  /** Called when the user explicitly cancels the pending write. */
  const handleCancelled = () => {
    setPendingAction(null)
    addMessage({
      role: 'notice',
      content: 'Action cancelled.',
      timestamp: new Date(),
    })
  }

  /** Called when the 10-minute TTL hits zero before the user acts. */
  const handleExpired = () => {
    setPendingAction(null)
    addMessage({
      role: 'notice',
      content: 'The pending action expired — please ask again.',
      timestamp: new Date(),
    })
  }

  // ── Derived state ─────────────────────────────────────────────────────────

  const isInputDisabled =
    agentMutation.isPending || !currentWorkspace || pendingAction !== null

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <Card className="h-[800px] flex flex-col">
        {/* Header */}
        <CardHeader className="border-b py-4">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <CardTitle>AI Agent</CardTitle>
            <Badge variant="secondary" className="text-xs">Tool-Calling</Badge>
          </div>
          <CardDescription>
            Ask questions or give instructions about your finances in{' '}
            <strong>{currentWorkspace?.name ?? 'your workspace'}</strong>.
            The agent reads your real data — writes require your confirmation.
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col overflow-hidden p-0 min-h-0">
          {/* Message list */}
          <div className="flex-1 overflow-hidden px-4 pt-4">
            <ScrollArea className="h-full">
              <div className="space-y-4 pr-4 pb-4">
                {messages.length === 0 ? (
                  /* ── Empty state ── */
                  <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 text-center p-8">
                    <Bot className="h-16 w-16 text-muted-foreground" />
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        {currentWorkspace
                          ? `Ask me anything about ${currentWorkspace.name}`
                          : 'Select a workspace to get started'}
                      </h3>
                      {!currentWorkspace ? (
                        <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                          <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                            ⚠️ Please select a workspace to query your financial data
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mb-4">
                          I can search transactions, summarise spending, spot trends,
                          and record new transactions — all after your confirmation.
                        </p>
                      )}
                    </div>
                    {currentWorkspace && (
                      <div className="flex flex-col gap-2 w-full max-w-md">
                        <p className="text-xs text-muted-foreground font-medium">Try asking:</p>
                        {quickQuestions.map((q, i) => (
                          <Button
                            key={i}
                            variant="outline"
                            size="sm"
                            className="justify-start text-left h-auto py-2 whitespace-normal"
                            onClick={() => handleQuickQuestion(q)}
                            disabled={agentMutation.isPending}
                          >
                            {q}
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    {messages.map((msg) => {
                      /* ── Notice bubble (cancelled / expired) ── */
                      if (msg.role === 'notice') {
                        return (
                          <div key={msg.id} className="flex justify-center">
                            <span className="text-xs text-muted-foreground italic px-3 py-1 rounded-full bg-muted/50">
                              {msg.content}
                            </span>
                          </div>
                        )
                      }

                      /* ── User / agent chat bubbles ── */
                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${
                            msg.role === 'user' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {/* Agent avatar */}
                          {msg.role === 'agent' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Bot className="h-5 w-5 text-primary" />
                            </div>
                          )}

                          <div
                            className={`flex flex-col gap-1 max-w-[80%] ${
                              msg.role === 'user' ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div
                              className={`rounded-lg px-4 py-2 ${
                                msg.role === 'user'
                                  ? 'bg-primary text-primary-foreground'
                                  : msg.isError
                                  ? 'bg-destructive/10 border border-destructive/20 text-destructive'
                                  : 'bg-muted'
                              }`}
                            >
                              {msg.role === 'user' ? (
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              ) : (
                                <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                                  <ReactMarkdown
                                    components={{
                                      p:      ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                                      ul:     ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                                      ol:     ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                                      li:     ({children}) => <li className="ml-2">{children}</li>,
                                      strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                                      em:     ({children}) => <em className="italic">{children}</em>,
                                      h1:     ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                                      h2:     ({children}) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                                      h3:     ({children}) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                                      code:   ({children}) => <code className="bg-muted-foreground/10 px-1 py-0.5 rounded text-xs">{children}</code>,
                                    }}
                                  >
                                    {msg.content}
                                  </ReactMarkdown>
                                </div>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              {msg.timestamp.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>

                          {/* User avatar */}
                          {msg.role === 'user' && (
                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                              <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                          )}
                        </div>
                      )
                    })}

                    {/* Thinking indicator — shown while the agent is running tool iterations */}
                    {agentMutation.isPending && (
                      <div className="flex gap-3 justify-start">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-5 w-5 text-primary" />
                        </div>
                        <div className="bg-muted rounded-lg px-4 py-3 flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          <span className="text-sm text-muted-foreground">Thinking…</span>
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>
            </ScrollArea>
          </div>

          {/* Input — fixed at bottom, disabled while waiting or during pending confirmation */}
          <div className="flex gap-2 p-4 border-t bg-card shrink-0">
            <Input
              id="agent-chat-input"
              placeholder={
                !currentWorkspace
                  ? 'Select a workspace first…'
                  : pendingAction
                  ? 'Confirm or cancel the pending action first…'
                  : agentMutation.isPending
                  ? 'Waiting for response…'
                  : 'Ask about your finances or give an instruction…'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isInputDisabled}
              className="flex-1 bg-background border-input focus-visible:ring-primary h-12"
            />
            <Button
              id="agent-chat-send"
              onClick={handleSend}
              disabled={!input.trim() || isInputDisabled}
              className="h-12 w-12 shrink-0"
            >
              {agentMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/*
        Confirmation modal — rendered outside the Card so the overlay sits at
        the correct z-index. Only mounted when the agent proposes a write action.
        The modal is replaced with the full implementation in the next step.
      */}
      {pendingAction && (
        <AgentConfirmModal
          pendingAction={pendingAction}
          onConfirm={handleConfirmed}
          onCancel={handleCancelled}
          onExpired={handleExpired}
        />
      )}
    </>
  )
}
