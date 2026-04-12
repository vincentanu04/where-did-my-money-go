import { useState } from 'react'
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
import { Check, CheckCheck, X } from 'lucide-react'

const PendingShares = () => {
  const { data: shares, isLoading, refetch } = useGetExpensesSharedPendingQuery()
  const { refetch: refetchBadge } = useGetNotificationsBadgeQuery()
  const [accept] = usePostExpensesSharedByShareIdAcceptMutation()
  const [reject] = usePostExpensesSharedByShareIdRejectMutation()
  const [isAcceptingAll, setIsAcceptingAll] = useState(false)

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

  const handleAcceptAll = async () => {
    if (!shares || shares.length === 0) return
    setIsAcceptingAll(true)
    try {
      await Promise.all(shares.map(s => accept({ shareId: s.id }).unwrap()))
      toast.success(`Accepted ${shares.length} expense${shares.length > 1 ? 's' : ''}`)
      refetch()
      refetchBadge()
    } catch {
      toast.error('Failed to accept all')
      refetch()
      refetchBadge()
    } finally {
      setIsAcceptingAll(false)
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
        <>
          {shares.length > 1 && (
            <Button
              className="w-full h-12 bg-green-600 hover:bg-green-700 text-white text-base"
              onClick={handleAcceptAll}
              disabled={isAcceptingAll}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              {isAcceptingAll ? 'Accepting…' : `Accept All (${shares.length})`}
            </Button>
          )}
          {shares.map(s => (
            <Card key={s.id}>
              <CardContent className="pt-4 pb-4 space-y-4">
                <div className="space-y-1">
                  <div className="font-semibold">{s.category}</div>
                  <div className="text-xl font-bold">
                    ¥{s.splitAmount.toLocaleString()}
                    <span className="ml-2 text-sm font-normal text-muted-foreground">
                      of ¥{s.originalTotal.toLocaleString()} total
                    </span>
                  </div>
                  {s.remark && (
                    <div className="text-sm text-muted-foreground italic">
                      "{s.remark}"
                    </div>
                  )}
                  <div className="text-sm text-muted-foreground">
                    From {s.sharedByEmail}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(s.expenseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="default"
                    className="h-12 bg-green-600 hover:bg-green-700 text-white text-base"
                    onClick={() => handleAccept(s.id)}
                    disabled={isAcceptingAll}
                  >
                    <Check className="h-4 w-4 mr-2" />
                    Accept
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12 text-base text-destructive border-destructive/30 hover:bg-destructive/5 hover:text-destructive"
                    onClick={() => handleReject(s.id)}
                    disabled={isAcceptingAll}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Decline
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </div>
  )
}

export default PendingShares
