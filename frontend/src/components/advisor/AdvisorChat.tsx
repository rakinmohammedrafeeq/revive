import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { useAdvisorChat } from '../../hooks/useAdvisor';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import type { ConversationMessage } from '../../types/advisor';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import ReactMarkdown from 'react-markdown';

export const AdvisorChat = () => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { currentWorkspace } = useWorkspace();
  const chatMutation = useAdvisorChat();

  // Reset chat when workspace changes
  useEffect(() => {
    setMessages([]);
    setSessionId(undefined);
    setInput('');
  }, [currentWorkspace?.id]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    // Small delay to ensure content is rendered before scrolling
    const timer = setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    if (!currentWorkspace) {
      const errorMessage: ConversationMessage = {
        role: 'assistant',
        message: 'Please select a workspace first to get personalized financial advice.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      return;
    }

    const userMessage: ConversationMessage = {
      role: 'user',
      message: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    const messageToSend = input;
    setInput('');

    try {
      const response = await chatMutation.mutateAsync({
        message: messageToSend,
        sessionId,
        workspaceId: currentWorkspace.id,
      });

      if (response.success) {
        const assistantMessage: ConversationMessage = {
          role: 'assistant',
          message: response.response,
          timestamp: new Date(),
          contextUsed: response.contextUsed,
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setSessionId(response.sessionId);
      } else {
        const errorMessage: ConversationMessage = {
          role: 'assistant',
          message: `Sorry, I encountered an error: ${response.error}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      const errorMessage: ConversationMessage = {
        role: 'assistant',
        message: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleQuickQuestion = (question: string) => {
    setInput(question);
    // Trigger send after input is set
    if (currentWorkspace) {
      // Manually create and send the message
      const userMessage: ConversationMessage = {
        role: 'user',
        message: question,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      chatMutation.mutateAsync({
        message: question,
        sessionId,
        workspaceId: currentWorkspace.id,
      }).then((response) => {
        if (response.success) {
          const assistantMessage: ConversationMessage = {
            role: 'assistant',
            message: response.response,
            timestamp: new Date(),
            contextUsed: response.contextUsed,
          };

          setMessages((prev) => [...prev, assistantMessage]);
          setSessionId(response.sessionId);
        } else {
          const errorMessage: ConversationMessage = {
            role: 'assistant',
            message: `Sorry, I encountered an error: ${response.error}`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, errorMessage]);
        }
      }).catch(() => {
        const errorMessage: ConversationMessage = {
          role: 'assistant',
          message: 'Sorry, I encountered an error. Please try again.',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    "What investment opportunities do you recommend for me?",
    "Should I invest in stocks or real estate?",
    "How can I build wealth with my current income?",
    "Suggest a portfolio allocation for my savings",
  ];

  return (
    <Card className="h-[800px] flex flex-col">
      <CardHeader className="border-b py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
          <CardTitle>AI Financial Advisor</CardTitle>
        </div>
        <CardDescription>
          Ask me about investments, portfolio allocation, wealth building strategies, and financial planning for <strong>{currentWorkspace?.name || 'your workspace'}</strong>.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col overflow-hidden p-0 min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-hidden px-4 pt-4">
        <ScrollArea className="h-full">
          <div className="space-y-4 pr-4 pb-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center min-h-[500px] gap-4 text-center p-8">
                <Bot className="h-16 w-16 text-muted-foreground" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">
                    Hi! I'm your Financial Advisor for {currentWorkspace?.name || 'this workspace'}
                  </h3>
                  {!currentWorkspace ? (
                    <div className="bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                        ⚠️ Please select a workspace to start analyzing your finances
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">
                      I analyze your financial records to provide personalized investment advice and wealth-building strategies.
                    </p>
                  )}
                </div>
                {currentWorkspace && (
                  <div className="flex flex-col gap-2 w-full max-w-md">
                    <p className="text-xs text-muted-foreground font-medium">Try asking:</p>
                    {quickQuestions.map((question, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        className="justify-start text-left h-auto py-2 whitespace-normal"
                        onClick={() => handleQuickQuestion(question)}
                        disabled={!currentWorkspace || chatMutation.isPending}
                      >
                        {question}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <>
                {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${
                    msg.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {msg.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                      <Bot className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
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
                          : 'bg-muted'
                      }`}
                    >
                      {msg.role === 'user' ? (
                        <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                      ) : (
                        <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
                          <ReactMarkdown
                            components={{
                              // Style markdown elements
                              p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({children}) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                              ol: ({children}) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                              li: ({children}) => <li className="ml-2">{children}</li>,
                              strong: ({children}) => <strong className="font-semibold">{children}</strong>,
                              em: ({children}) => <em className="italic">{children}</em>,
                              h1: ({children}) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                              h2: ({children}) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                              h3: ({children}) => <h3 className="text-sm font-bold mb-1">{children}</h3>,
                              code: ({children}) => <code className="bg-muted-foreground/10 px-1 py-0.5 rounded text-xs">{children}</code>,
                            }}
                          >
                            {msg.message}
                          </ReactMarkdown>
                        </div>
                      )}
                    </div>
                    
                    {msg.contextUsed && msg.contextUsed.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {msg.contextUsed.map((context, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">
                            {context}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <span className="text-xs text-muted-foreground">
                      {msg.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {msg.role === 'user' && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                  )}
                </div>
              ))}
              {chatMutation.isPending && (
                <div className="flex gap-3 justify-start">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                    <Bot className="h-5 w-5 text-yellow-600 dark:text-yellow-500" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
            )}
          </div>
        </ScrollArea>
        </div>

        {/* Input - Fixed at bottom */}
        <div className="flex gap-2 p-4 border-t bg-card shrink-0">
          <Input
            placeholder="Ask about investments, stocks, real estate, or wealth building strategies..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={chatMutation.isPending || !currentWorkspace}
            className="flex-1 bg-background border-input focus-visible:ring-primary h-12"
          />
          <Button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending || !currentWorkspace}
            className="h-12 w-12 shrink-0"
          >
            {chatMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
