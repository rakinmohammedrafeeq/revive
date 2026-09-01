import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { categorizeTransaction } from '@/api/aiApi'
import { toast } from 'sonner'
import { UseFormReturn } from 'react-hook-form'

interface AiCategorySuggestionProps {
  form: UseFormReturn<any>
  description: string
  amount: string
}

export function AiCategorySuggestion({ form, description, amount }: AiCategorySuggestionProps) {
  const [loading, setLoading] = useState(false)
  const hasDescription = description && description.trim().length > 0

  const handleAiSuggest = async () => {
    if (!hasDescription) {
      toast.error('Description required', {
        description: 'Please enter a transaction description first'
      })
      return
    }

    setLoading(true)
    try {
      const response = await categorizeTransaction({
        description,
        amount: amount || undefined,
      })

      if (response.success) {
        // Set the AI-suggested values
        // Set type first to enable category dropdown
        form.setValue('type', response.type, { shouldValidate: true, shouldDirty: true })
        
        // Small delay to ensure type is set before category
        setTimeout(() => {
          form.setValue('category', response.category, { shouldValidate: true, shouldDirty: true })
        }, 50)
        
        toast.success(`AI suggested: ${response.category} (${response.type})`, {
          description: response.reasoning,
        })
      } else {
        // Parse error message for better UX
        const errorMsg = (response.error || '').toLowerCase()
        
        if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate limit') || errorMsg.includes('exceeded')) {
          toast.error('AI service temporarily unavailable', {
            description: 'Rate limit reached. Please select category manually.'
          })
        } else if (errorMsg.includes('ai service not configured')) {
          toast.error('AI service not configured', {
            description: 'Please select category manually.'
          })
        } else {
          toast.error('AI categorization failed', {
            description: response.error || 'Please select category manually.'
          })
        }
      }
    } catch (error: any) {
      // Handle network and API errors
      const errorMsg = (error.response?.data?.error || error.response?.data?.message || error.message || '').toLowerCase()
      
      if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate limit') || errorMsg.includes('exceeded')) {
        toast.error('AI service temporarily unavailable', {
          description: 'Rate limit reached. Please select category manually.'
        })
      } else if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
        toast.error('Connection error', {
          description: 'Please check your internet connection.'
        })
      } else if (errorMsg.includes('unauthorized') || errorMsg.includes('forbidden')) {
        toast.error('Access denied', {
          description: 'You do not have permission to use this feature.'
        })
      } else {
        toast.error('Failed to get AI suggestion', {
          description: 'Please select category manually.'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
      <div className="flex items-start gap-2">
        <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">AI Suggestions</p>
          <p className="text-xs text-muted-foreground mt-1">
            AI analyzes your description to recommend the transaction type and category.
          </p>
        </div>
      </div>
      <Button
        type="button"
        variant="default"
        size="sm"
        className="w-full gap-2"
        onClick={handleAiSuggest}
        disabled={loading || !hasDescription}
      >
        {loading ? (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5" />
            AI Suggest
          </>
        )}
      </Button>
    </div>
  )
}
