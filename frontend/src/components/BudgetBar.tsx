import { useNavigate } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useGetBudgetSummaryQuery } from '@/api/client'
import { cn } from '@/lib/utils'

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

export function BudgetBar() {
  const navigate = useNavigate()
  const { data, isLoading, isError } = useGetBudgetSummaryQuery(
    { tz },
    { refetchOnMountOrArgChange: 30 },
  )

  if (isLoading) {
    return <div className="h-6 rounded-full bg-muted animate-pulse" />
  }

  // 404 = no budget configured yet — subtle inline prompt
  if (isError || !data) {
    return (
      <button
        type="button"
        onClick={() => navigate('/budget')}
        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-0.5"
      >
        Set up a budget →
      </button>
    )
  }

  const { spentToday, todayAllowance, remainingToday, status } = data
  const percentUsed = todayAllowance > 0 ? Math.min((spentToday / todayAllowance) * 100, 100) : 100

  const barColor =
    percentUsed >= 100
      ? 'bg-destructive'
      : percentUsed >= 75
      ? 'bg-amber-500'
      : 'bg-primary'

  const amountColor =
    status === 'on_track'
      ? 'text-primary'
      : status === 'getting_close'
      ? 'text-amber-600'
      : 'text-destructive'

  return (
    <button
      type="button"
      onClick={() => navigate('/budget')}
      className="w-full select-none active:opacity-70 transition-opacity"
    >
      {/* Single info line */}
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="flex items-center gap-0.5 text-muted-foreground">
          Today's budget
          <ChevronRight className="size-3" />
        </span>
        <span>
          <span className={cn('font-semibold', amountColor)}>
            ¥{spentToday.toLocaleString()}
          </span>
          <span className="text-muted-foreground"> / ¥{todayAllowance.toLocaleString()}</span>
        </span>
      </div>
      {/* Slim progress bar */}
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', barColor)}
          style={{ width: `${percentUsed}%` }}
        />
      </div>
    </button>
  )
}
