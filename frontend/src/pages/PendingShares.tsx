import { toast } from 'sonner'
import {
  useGetExpensesSharedPendingQuery,
  usePostExpensesSharedByShareIdAcceptMutation,
  usePostExpensesSharedByShareIdRejectMutation,
  useGetNotificationsBadgeQuery,
} from '@/api/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { Check, X } from 'lucide-react'

const PendingShares = () => {
  const { data: shares, isLoading, refetch } = useGetExpensesSharedPendingQuery()
  const { refetch: refetchBadge } = useGetNotificationsBadgeQuery()
  const [accept] = usePostExpensesSharedByShareIdAcceptMutation()
  const [reject] = usePostExpensesSharedByShareIdRejectMutation()

  const handleAccept = async (shareId: string) => {
    try {
      await accept({ shareId }).unwrap()
      toast.success('Expense added to your ledger')
      refetch()
      refetchBadge()
    } catch {
      toast.error('Failed to accept')
    }
  }

  const handleReject = async (shareId: string) => {
    try {
      await reject({ shareId }).unwrap()
      refetch()
      refetchBadge()
    } catch {
      toast.error('Failed to reject')
    }
  }

  return (
    <div className="p-4 space-y-3 max-w-lg mx-auto">
      <h2 className="font-semibold text-lg">Pending shared expenses</h2>

      {isLoading ? (
        <div className="flex justify-center py-8"><Spinner /></div>
      ) : !shares || shares.length === 0 ? (
        <Card>
          <CardContent className="pt-6 pb-6 text-center text-sm text-muted-foreground">
            No pending shared expenses
          </CardContent>
        </Card>
      ) : (
        shares.map(s => (
          <Card key={s.id}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-0.5 min-w-0">
                  <div className="font-medium text-sm">{s.category}</div>
                  <div className="text-sm text-muted-foreground">
                    ¥{s.splitAmount.toLocaleString()}
                    <span className="mx-1">·</span>
                    shared from ¥{s.originalTotal.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    From: {s.sharedByEmail}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.expenseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="icon" variant="ghost" onClick={() => handleAccept(s.id)} title="Accept">
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => handleReject(s.id)} title="Reject">
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

export default PendingShares
