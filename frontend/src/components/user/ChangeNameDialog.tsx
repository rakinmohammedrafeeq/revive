import { useState, useEffect } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { Loader2, User } from 'lucide-react'
import { usersApi } from '@/api/usersApi'
import { useAuth } from '@/contexts/AuthContext'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const nameSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
})

type NameForm = z.infer<typeof nameSchema>

interface ChangeNameDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ChangeNameDialog({ isOpen, onClose }: ChangeNameDialogProps) {
  const { user, refreshUser } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      name: user?.name || '',
    },
  })

  // Reset form when dialog opens with current user name
  useEffect(() => {
    if (isOpen && user) {
      form.reset({ name: user.name })
    }
  }, [isOpen, user, form])

  const onSubmit = async (values: NameForm) => {
    setIsLoading(true)
    try {
      await usersApi.updateName(values.name)
      await refreshUser()
      toast.success('Name updated successfully')
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update name')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Change Name
          </DialogTitle>
          <DialogDescription>
            Update your display name. This will be visible throughout the application.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Name <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
