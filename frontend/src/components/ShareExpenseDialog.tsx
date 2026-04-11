import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Checkbox } from '@/components/ui/checkbox'
import { toast } from 'sonner'
import { useGetFriendsQuery, usePostExpensesByIdShareMutation } from '@/api/client'
import type { Expense } from '@/api/client'
import { cn } from '@/lib/utils'

type Props = {
  expense: Expense
  onClose: () => void
  onShared: () => void
}

export function ShareExpenseDialog({ expense, onClose, onShared }: Props) {
  const { data: friends, isLoading: loadingFriends } = useGetFriendsQuery()
  const [shareExpense, { isLoading: sharing }] = usePostExpensesByIdShareMutation()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  const selectedArr = Array.from(selected)
  const splitTotal = selectedArr.reduce((sum, fid) => sum + (Number(amounts[fid]) || 0), 0)
  const yourPortion = expense.amount - splitTotal

  // Auto-fill equal split when selection changes
  useEffect(() => {
    if (selected.size === 0) return
    const equal = Math.floor(expense.amount / (selected.size + 1))
    setAmounts(prev => {
      const next = { ...prev }
      for (const fid of selected) {
        next[fid] = String(equal)
      }
      return next
    })
  }, [selected.size])

  const toggle = (friendId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(friendId)) {
        next.delete(friendId)
        setAmounts(a => { const c = { ...a }; delete c[friendId]; return c })
      } else {
        next.add(friendId)
      }
      return next
    })
  }

  const handleSubmit = async () => {
    if (selected.size === 0) {
      toast.error('Select at least one friend')
      return
    }
    if (yourPortion <= 0) {
      toast.error('Your portion must be at least ¥1')
      return
    }
    for (const fid of selectedArr) {
      if (!amounts[fid] || Number(amounts[fid]) <= 0) {
        toast.error('All selected friends need a valid amount')
        return
      }
    }

    try {
      await shareExpense({
        id: expense.id,
        shareExpenseRequest: {
          splits: selectedArr.map(fid => ({
            friendId: fid,
            amount: Number(amounts[fid]),
          })),
        },
      }).unwrap()
      toast.success('Expense shared')
      onShared()
    } catch {
      toast.error('Failed to share expense')
    }
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share expense</DialogTitle>
        </DialogHeader>

        <div className="text-sm text-muted-foreground mb-2">
          Original amount: <span className="font-medium text-foreground">¥{expense.amount.toLocaleString()}</span>
          {' · '}{expense.category}
        </div>

        {loadingFriends ? (
          <div className="flex justify-center py-6"><Spinner /></div>
        ) : !friends || friends.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">You have no friends yet. Add them on the Friends page.</p>
        ) : (
          <div className="space-y-3">
            {friends.map(f => (
              <div key={f.id} className="flex items-center gap-3">
                <Checkbox
                  id={`friend-${f.id}`}
                  checked={selected.has(f.id)}
                  onCheckedChange={() => toggle(f.id)}
                />
                <Label htmlFor={`friend-${f.id}`} className="flex-1 cursor-pointer">{f.email}</Label>
                {selected.has(f.id) && (
                  <Input
                    type="number"
                    min={1}
                    className="w-28 text-right"
                    value={amounts[f.id] ?? ''}
                    onChange={e => setAmounts(a => ({ ...a, [f.id]: e.target.value }))}
                  />
                )}
              </div>
            ))}

            <div className={cn('mt-2 text-sm font-medium', yourPortion <= 0 ? 'text-destructive' : 'text-foreground')}>
              Your portion: ¥{yourPortion.toLocaleString()}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={sharing || selected.size === 0}>
            {sharing ? <Spinner /> : 'Share'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
