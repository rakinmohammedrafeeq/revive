import { useEffect, useMemo, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Loader2, Pencil, Plus, Trash2, Camera } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import {
  useCreateRecordMutation,
  useDeleteRecordMutation,
  useRecordsQuery,
  useUpdateRecordMutation,
} from '@/hooks'
import type { FinancialRecordResponse } from '@/types/record'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { AiCategorySuggestion } from '@/components/records/AiCategorySuggestion'
import { ReceiptUpload } from '@/components/records/ReceiptUpload'

const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Business',
  'Investment',
  'Bonus',
  'Interest',
  'Rental Income',
  'Refund',
  'Other',
] as const

const EXPENSE_CATEGORIES = [
  'Food',
  'Groceries',
  'Shopping',
  'Transportation',
  'Fuel',
  'Bills',
  'Rent',
  'EMI',
  'Entertainment',
  'Healthcare',
  'Education',
  'Travel',
  'Subscription',
  'Insurance',
  'Gifts',
  'Taxes',
  'Investment',
  'Savings',
  'Other',
] as const

const recordSchema = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'Category is required'),
  customCategory: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  description: z.string().optional(),
}).refine((data) => {
  // If category is "Other", customCategory must be provided
  if (data.category === 'Other') {
    return data.customCategory && data.customCategory.trim().length > 0
  }
  return true
}, {
  message: 'Custom category is required when "Other" is selected',
  path: ['customCategory'],
})

type RecordForm = z.infer<typeof recordSchema>

export function RecordsPage() {
  const { currentWorkspace } = useWorkspace()
  
  // Check workspace permission instead of platform role
  const canCreate = currentWorkspace?.userPermission === 'OWNER' || currentWorkspace?.userPermission === 'EDITOR'
  const canMutate = currentWorkspace?.userPermission === 'OWNER' || currentWorkspace?.userPermission === 'EDITOR'

  const [page, setPage] = useState(0)
  const [sort, setSort] = useState('date:desc')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [category, setCategory] = useState('')
  const [typeFilter, setTypeFilter] = useState<'INCOME' | 'EXPENSE' | ''>('')

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<FinancialRecordResponse | null>(null)
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [showReceiptUpload, setShowReceiptUpload] = useState(false)

  // Auto-open modal if navigating from dashboard with ?add=true
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('add') === 'true' && canCreate) {
      openNew()
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [canCreate])

  const sortBy = sort.split(':')[0] as 'date' | 'amount'
  const direction = sort.split(':')[1] as 'asc' | 'desc'

  const queryParams = useMemo(
    () => ({
      page,
      size: 12,
      sortBy,
      direction,
      ...(startDate ? { startDate } : {}),
      ...(endDate ? { endDate } : {}),
      ...(category.trim() ? { category: category.trim() } : {}),
      ...(typeFilter ? { type: typeFilter } : {}),
    }),
    [page, sortBy, direction, startDate, endDate, category, typeFilter],
  )

  const { data, isLoading, error } = useRecordsQuery(queryParams)

  const createMut = useCreateRecordMutation()
  const updateMut = useUpdateRecordMutation()
  const deleteMut = useDeleteRecordMutation()

  const form = useForm<RecordForm>({
    resolver: zodResolver(recordSchema),
    defaultValues: {
      type: '' as any, // Start empty to show placeholder
      category: '',
      customCategory: '',
      date: '', // Start empty
      description: '',
      amount: '' as any, // Start empty instead of 0
    },
  })

  const selectedType = form.watch('type')
  const selectedCategory = form.watch('category')
  const isOtherCategory = selectedCategory === 'Other'
  const watchedDescription = form.watch('description')
  const watchedAmount = form.watch('amount')

  // Don't show categories until type is selected
  const availableCategories = selectedType === 'INCOME' ? INCOME_CATEGORIES : 
                               selectedType === 'EXPENSE' ? EXPENSE_CATEGORIES : []

  const openNew = () => {
    setEditing(null)
    setShowReceiptUpload(false)
    form.reset({
      type: '' as any, // Empty to show placeholder
      category: '',
      customCategory: '',
      date: '', // Empty date
      description: '',
      amount: '' as any, // Empty instead of 0
    })
    setDialogOpen(true)
  }

  const openEdit = (row: FinancialRecordResponse) => {
    setEditing(row)
    setShowReceiptUpload(false)
    const isOther = ![...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES].includes(row.category as any)
    form.reset({
      amount: Number(row.amount),
      type: row.type as 'INCOME' | 'EXPENSE',
      category: isOther ? 'Other' : row.category,
      customCategory: isOther ? row.category : '',
      date: row.date,
      description: row.description ?? '',
    })
    setDialogOpen(true)
  }

  const onSubmit = (values: RecordForm) => {
    // Use custom category if "Other" is selected
    const finalCategory = values.category === 'Other' ? values.customCategory! : values.category
    
    const payload = {
      amount: values.amount,
      type: values.type,
      category: finalCategory,
      date: values.date,
      description: values.description || undefined,
    }
    if (editing) {
      updateMut.mutate(
        { id: editing.id, body: payload },
        {
          onSuccess: () => {
            toast.success('Record updated')
            setDialogOpen(false)
          },
          onError: () => toast.error('Could not update record'),
        },
      )
    } else {
      createMut.mutate(payload, {
        onSuccess: () => {
          toast.success('Record created')
          setDialogOpen(false)
        },
        onError: () => toast.error('Could not create record'),
      })
    }
  }

  const rows = data?.content ?? []
  const totalPages = data?.totalPages ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Records</h1>
          <p className="text-muted-foreground">Track and filter transactions</p>
        </div>
        {canCreate ? (
          <Button onClick={openNew} className="gap-2">
            <Plus className="h-4 w-4" />
            Add record
          </Button>
        ) : null}
      </div>

      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-base">Filters</CardTitle>
          <CardDescription>Filter by date, category, or type</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Input
            type="date"
            className="w-auto"
            value={startDate}
            onChange={(e) => {
              setPage(0)
              setStartDate(e.target.value)
            }}
          />
          <Input
            type="date"
            className="w-auto"
            value={endDate}
            onChange={(e) => {
              setPage(0)
              setEndDate(e.target.value)
            }}
          />
          <Input
            placeholder="Category"
            className="max-w-xs"
            value={category}
            onChange={(e) => {
              setPage(0)
              setCategory(e.target.value)
            }}
          />
          <Select
            value={typeFilter || 'ALL'}
            onValueChange={(v) => {
              setPage(0)
              setTypeFilter(v === 'ALL' ? '' : (v as 'INCOME' | 'EXPENSE'))
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All types</SelectItem>
              <SelectItem value="INCOME">Income</SelectItem>
              <SelectItem value="EXPENSE">Expense</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(v) => { setPage(0); setSort(v) }}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date:desc">Date · newest</SelectItem>
              <SelectItem value="date:asc">Date · oldest</SelectItem>
              <SelectItem value="amount:desc">Amount · high</SelectItem>
              <SelectItem value="amount:asc">Amount · low</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card className="border-border/60 bg-card/60 backdrop-blur-sm">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Loader2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No records found</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md">
                No records in this workspace yet.
              </p>
            </div>
          ) : rows.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">No matches</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  {canMutate ? <TableHead className="w-[120px]" /> : null}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-muted-foreground">{r.date}</TableCell>
                    <TableCell className="font-medium">{r.category}</TableCell>
                    <TableCell>
                      <Badge variant={r.type === 'INCOME' ? 'default' : 'secondary'}>{r.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {r.description || '—'}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{r.userName ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{r.userEmail}</div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(Number(r.amount))}</TableCell>
                    {canMutate ? (
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(r)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    ) : null}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {totalPages > 1 ? (
            <div className="flex items-center justify-center gap-2 border-t p-4">
              <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages - 1}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit record' : 'Add record'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update record details.' : 'Add a new transaction to your workspace.'}
            </DialogDescription>
          </DialogHeader>
          
          {/* AI Receipt Upload Section */}
          {!editing && !showReceiptUpload && (
            <div className="pb-4">
              <Button
                type="button"
                variant="outline"
                className="w-full gap-2"
                onClick={() => setShowReceiptUpload(true)}
              >
                <Camera className="h-4 w-4" />
                Upload Receipt (AI OCR)
              </Button>
            </div>
          )}
          
          {showReceiptUpload && !editing && (
            <ReceiptUpload 
              form={form} 
              onClose={() => setShowReceiptUpload(false)}
            />
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Amount <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="Enter amount" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Type <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value)
                        // Reset category when type changes
                        form.setValue('category', '')
                        form.setValue('customCategory', '')
                      }} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="INCOME">Income</SelectItem>
                        <SelectItem value="EXPENSE">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Category <span className="text-red-500">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedType}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={selectedType ? "Select a category" : "Select type first"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isOtherCategory && (
                <FormField
                  control={form.control}
                  name="customCategory"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Custom Category <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Pet Care, Gaming, Wedding" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Date <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        {...field}
                        onClick={(e) => {
                          // Show date picker on click
                          e.currentTarget.showPicker?.()
                        }}
                        onFocus={(e) => {
                          // Show date picker on focus instead of allowing manual text input
                          e.target.showPicker?.()
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormDescription className="text-xs">
                      Describe the transaction. AI uses this to suggest the type and category.
                    </FormDescription>
                    <FormControl>
                      <Textarea 
                        rows={2} 
                        placeholder="e.g. Coffee at Starbucks, Monthly salary, Uber ride" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* AI Category Suggestion - Always visible when adding new record */}
              {!editing && (
                <AiCategorySuggestion 
                  form={form}
                  description={watchedDescription || ''}
                  amount={String(watchedAmount || '')}
                />
              )}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMut.isPending || updateMut.isPending}>
                  {(createMut.isPending || updateMut.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editing ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId != null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete record?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId == null) return
                deleteMut.mutate(deleteId, {
                  onSuccess: () => {
                    toast.success('Deleted')
                    setDeleteId(null)
                  },
                  onError: () => toast.error('Delete failed'),
                })
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
