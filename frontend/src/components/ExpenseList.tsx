import { useState } from 'react'
import type { ExpensesByCategory, Expense } from '@/api/client'
import {
  usePutExpensesByIdMutation,
  useDeleteExpensesByIdMutation,
} from '@/api/client'
import { Card } from '@/components/ui/card'
import { Spinner } from './ui/spinner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Pencil, Trash2, Share2, Clock } from 'lucide-react'
import { ShareExpenseDialog } from '@/components/ShareExpenseDialog'
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

type Props = {
  expenses: ExpensesByCategory[]
  isLoading: boolean
  onChanged: () => void
}

export const ExpenseList = ({ expenses, isLoading, onChanged }: Props) => {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [sharingExpense, setSharingExpense] = useState<Expense | null>(null)
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null)
  const [amount, setAmount] = useState<string>('')
  const [remark, setRemark] = useState('')

  const [updateExpense, { isLoading: isUpdating }] =
    usePutExpensesByIdMutation()

  const [deleteExpense, { isLoading: isDeleting }] =
    useDeleteExpensesByIdMutation()

  const startEdit = (expense: Expense) => {
    if (expense.pendingShareCount && expense.pendingShareCount > 0) {
      toast.error(`Can't edit — ${expense.pendingShareCount} pending share${expense.pendingShareCount > 1 ? 's' : ''} must be resolved first`)
      return
    }
    setEditingId(expense.id)
    setAmount(String(expense.amount))
    setRemark(expense.remark ?? '')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setAmount('')
    setRemark('')
  }

  const saveEdit = async (expense: Expense) => {
    const parsedAmount = Number(amount)

    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await updateExpense({
        id: expense.id,
        updateExpense: {
          amount: parsedAmount, // 👈 convert here
          remark,
        },
      }).unwrap()

      toast.success('Expense updated')
      cancelEdit()
      onChanged()
    } catch {
      toast.error('Failed to update expense')
    }
  }

  const onDelete = (expense: Expense) => {
    setDeletingExpense(expense)
  }

  const confirmDelete = async () => {
    if (!deletingExpense) return
    try {
      await deleteExpense({ id: deletingExpense.id }).unwrap()
      toast.success('Expense deleted')
      setDeletingExpense(null)
      onChanged()
    } catch {
      toast.error('Failed to delete expense')
    }
  }

  if (isLoading) {
    return (
      <Card className="p-4 flex justify-center">
        <Spinner />
      </Card>
    )
  }

  if (expenses.length === 0) {
    return (
      <Card className="p-4 text-center text-sm text-muted-foreground">
        No expenses for this day
      </Card>
    )
  }

  return (
    <>
    <Card className="p-4 space-y-4">
      {expenses.map(category => (
        <div key={category.category} className="space-y-2">
          <div className="flex justify-between font-medium">
            <span>{category.category}</span>
            <span>
              ¥{category.expenses.reduce((s, e) => s + e.amount, 0)}
            </span>
          </div>

          <div className="space-y-1 pl-4 text-sm">
            {category.expenses.map(expense => {
              const isEditing = editingId === expense.id

              return (
                <div
                  key={expense.id}
                  className="flex items-center justify-between gap-2"
                >
                  {isEditing ? (
                    /* ===== Edit mode (stacked) ===== */
                    <div className="flex flex-col gap-2 w-full">
                      <div className="flex items-center gap-2">
                        <span>¥</span>
                        <Input
                          type="number"
                          inputMode="numeric"
                          value={amount}
                          onChange={e => setAmount(e.target.value)}
                          className="flex-1"
                        />
                      </div>

                      <Input
                        value={remark}
                        onChange={e => setRemark(e.target.value)}
                        placeholder="Remark"
                      />

                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => saveEdit(expense)}
                          disabled={isUpdating}
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* ===== View mode (always one row) ===== */
                    <>
                      <div className="flex flex-col flex-1 min-w-0 gap-0.5">
                        <div className="flex items-center gap-2">
                          <span>¥{expense.amount}</span>
                          <span className="italic text-gray-500 truncate">
                            {expense.remark || ''}
                          </span>
                        </div>
                        {expense.pendingShareCount != null && expense.pendingShareCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-amber-600">
                            <Clock className="h-3 w-3" />
                            {expense.pendingShareCount} pending acceptance
                          </span>
                        )}
                        {expense.sharedFromEmail && (
                          <span className="text-xs text-muted-foreground">
                            ↙ from {expense.sharedFromEmail}
                          </span>
                        )}
                      </div>

                      <div className="flex gap-1 shrink-0">
                        {!expense.sharedFromEmail && !expense.pendingShareCount && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setSharingExpense(expense)}
                            title="Share expense"
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => startEdit(expense)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => onDelete(expense)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      <div className="pt-2 border-t font-medium">
        Total: ¥
        {expenses.reduce(
          (catSum, cat) =>
            catSum +
            cat.expenses.reduce(
              (expSum, exp) => expSum + exp.amount,
              0
            ),
          0
        )}
      </div>
    </Card>

    {sharingExpense && (
      <ShareExpenseDialog
        expense={sharingExpense}
        onClose={() => setSharingExpense(null)}
        onShared={() => {
          setSharingExpense(null)
          onChanged()
        }}
      />
    )}

    <AlertDialog open={!!deletingExpense} onOpenChange={open => { if (!open) setDeletingExpense(null) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete expense?</AlertDialogTitle>
          <AlertDialogDescription>
            {deletingExpense?.pendingShareCount && deletingExpense.pendingShareCount > 0
              ? `This will also cancel ${deletingExpense.pendingShareCount} pending share${deletingExpense.pendingShareCount > 1 ? 's' : ''}.`
              : 'This action cannot be undone.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmDelete}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  )
}
