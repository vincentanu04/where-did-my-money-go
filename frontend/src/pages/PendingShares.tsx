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
    <div className="space-y-3">
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
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="font-semibold text-sm">{s.category}</div>
                  <div className="text-base font-medium">
                    ¥{s.splitAmount.toLocaleString()}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      of ¥{s.originalTotal.toLocaleString()} total
                    </span>
                  </div>
                  {s.remark && (
                    <div className="text-xs text-muted-foreground truncate italic">
                      "{s.remark}"
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground truncate">
                    From {s.sharedByEmail}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(s.expenseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => handleAccept(s.id)} className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700">
                    <Check className="h-3.5 w-3.5 mr-1" />
                    Accept
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleReject(s.id)} className="text-muted-foreground">
                    <X className="h-3.5 w-3.5 mr-1" />
                    Decline
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
