import { useState, useRef } from 'react'
import { Upload, Loader2, Image as ImageIcon, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { uploadReceipt } from '@/api/aiApi'
import { toast } from 'sonner'
import { UseFormReturn } from 'react-hook-form'

interface ReceiptUploadProps {
  form: UseFormReturn<any>
  onClose: () => void
}

export function ReceiptUpload({ form, onClose }: ReceiptUploadProps) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Category mapping to handle variations from AI
  const mapCategory = (aiCategory: string, type: string): string => {
    // Normalize the category (trim, lowercase)
    const normalized = aiCategory.trim().toLowerCase()
    
    // Define category mappings
    const mappings: Record<string, string> = {
      // Food variations
      'food & dining': 'Food',
      'food and dining': 'Food',
      'dining': 'Food',
      'restaurant': 'Food',
      'cafe': 'Food',
      
      // Bills variations
      'bills & utilities': 'Bills',
      'bills and utilities': 'Bills',
      'utilities': 'Bills',
      'utility': 'Bills',
      
      // Income variations
      'salary': 'Salary',
      'business income': 'Business',
      'investment income': 'Investment',
      'rental income': 'Rental Income',
      
      // Transportation variations
      'transport': 'Transportation',
      'travel & transport': 'Transportation',
      
      // Direct mappings (case-insensitive)
      'groceries': 'Groceries',
      'shopping': 'Shopping',
      'fuel': 'Fuel',
      'rent': 'Rent',
      'emi': 'EMI',
      'entertainment': 'Entertainment',
      'healthcare': 'Healthcare',
      'education': 'Education',
      'travel': 'Travel',
      'subscription': 'Subscription',
      'insurance': 'Insurance',
      'gifts': 'Gifts',
      'taxes': 'Taxes',
      'savings': 'Savings',
      'freelance': 'Freelance',
      'bonus': 'Bonus',
      'interest': 'Interest',
      'refund': 'Refund',
    }
    
    // Check if we have a mapping
    if (mappings[normalized]) {
      return mappings[normalized]
    }
    
    // Check if the original category (with proper casing) exists in our lists
    // This handles exact matches like "Food", "Groceries", etc.
    const incomeCategories = ['Salary', 'Freelance', 'Business', 'Investment', 'Bonus', 'Interest', 'Rental Income', 'Refund', 'Other']
    const expenseCategories = ['Food', 'Groceries', 'Shopping', 'Transportation', 'Fuel', 'Bills', 'Rent', 'EMI', 'Entertainment', 'Healthcare', 'Education', 'Travel', 'Subscription', 'Insurance', 'Gifts', 'Taxes', 'Investment', 'Savings', 'Other']
    
    const categories = type === 'INCOME' ? incomeCategories : expenseCategories
    const exactMatch = categories.find(cat => cat.toLowerCase() === normalized)
    
    if (exactMatch) {
      return exactMatch
    }
    
    // Default to "Other" if no mapping found
    return 'Other'
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Invalid file type', {
        description: 'Please select an image file (JPEG or PNG)'
      })
      return
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'File size must be less than 50MB'
      })
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreview(reader.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to AI
    setLoading(true)
    try {
      const response = await uploadReceipt(file)

      if (response.success) {
        // Map the AI category to match dropdown options
        const mappedCategory = mapCategory(response.category, response.type)
        
        // Set type first, then wait a tick before setting category
        // This prevents the type onChange from clearing the category
        form.setValue('type', response.type)
        form.setValue('amount', response.amount)
        form.setValue('date', response.date)
        form.setValue('description', response.description)
        
        // Use setTimeout to ensure category is set after type's onChange completes
        setTimeout(() => {
          form.setValue('category', mappedCategory)
        }, 0)

        toast.success('Receipt processed successfully!', {
          description: `Extracted: ${response.merchant} - $${response.amount}`,
        })

        // Close the receipt upload UI after 2 seconds
        setTimeout(() => {
          setPreview(null)
          onClose()
        }, 2000)
      } else {
        // Parse error message for better UX
        const errorMsg = (response.error || '').toLowerCase()
        
        if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate limit') || errorMsg.includes('exceeded')) {
          toast.error('AI service temporarily unavailable', {
            description: 'Rate limit reached. Please try again in a few hours.'
          })
        } else if (errorMsg.includes('ai service not configured')) {
          toast.error('AI service not configured', {
            description: 'Contact your administrator to enable AI features.'
          })
        } else if (errorMsg.includes('could not read') || errorMsg.includes('unclear') || errorMsg.includes('low confidence')) {
          toast.error('Could not read receipt clearly', {
            description: 'Try taking a clearer photo with better lighting.'
          })
        } else {
          toast.error('Failed to process receipt', {
            description: response.error || 'Please try again or enter details manually.'
          })
        }
      }
    } catch (error: any) {
      // Handle network and API errors
      const errorMsg = (error.response?.data?.error || error.response?.data?.message || error.message || '').toLowerCase()
      
      if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('rate limit') || errorMsg.includes('exceeded')) {
        toast.error('AI service temporarily unavailable', {
          description: 'Rate limit reached. Please try again in a few hours.'
        })
      } else if (errorMsg.includes('network') || errorMsg.includes('timeout')) {
        toast.error('Connection error', {
          description: 'Please check your internet connection and try again.'
        })
      } else if (errorMsg.includes('unauthorized') || errorMsg.includes('forbidden')) {
        toast.error('Access denied', {
          description: 'You do not have permission to use this feature.'
        })
      } else {
        toast.error('Failed to upload receipt', {
          description: 'Please try again or enter details manually.'
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleClearPreview = () => {
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Receipt OCR</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {preview ? (
            <div className="space-y-3">
              <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                <img
                  src={preview}
                  alt="Receipt preview"
                  className="h-full w-full object-contain"
                />
              </div>
              {loading && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing receipt with AI...
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearPreview}
                disabled={loading}
                className="w-full"
              >
                Clear & Try Another
              </Button>
            </div>
          ) : (
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/jpg"
                onChange={handleFileSelect}
                className="hidden"
                id="receipt-upload"
              />
              <label htmlFor="receipt-upload">
                <div className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 bg-background p-6 transition-colors hover:border-primary/50 hover:bg-accent/50">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium text-foreground">
                    Upload receipt photo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    JPEG or PNG, max 50MB
                  </p>
                </div>
              </label>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            AI will automatically extract amount, merchant, date, category, and type from your receipt or document.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
