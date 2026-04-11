import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'
import type { DailyTotal } from '@/api/client'

type Props = {
  date: Date
  onPrev: () => void
  onNext: () => void
  onDayClick: (day: number) => void
  totals: DailyTotal[]
  isFetching: boolean
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

// ISO weekday: Monday = 0 … Sunday = 6
function startWeekday(year: number, month: number) {
  const d = new Date(year, month - 1, 1).getDay()
  return (d + 6) % 7 // convert Sun=0..Sat=6 → Mon=0..Sun=6
}

export function CalendarView({ date, onPrev, onNext, onDayClick, totals, isFetching }: Props) {
  const month = date.getMonth() + 1
  const year = date.getFullYear()

  const totalsByDay = (totals ?? []).reduce<Record<number, number>>((acc, t) => {
    acc[t.date] = t.total
    return acc
  }, {})

  const today = new Date()
  const isCurrentMonth =
    today.getFullYear() === year && today.getMonth() + 1 === month

  const daysInMonth = getDaysInMonth(year, month)
  const offset = startWeekday(year, month)

  // Build grid cells: nulls for padding, then 1..daysInMonth
  const cells: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]
  // Pad to a multiple of 7
  while (cells.length % 7 !== 0) cells.push(null)

  const maxTotal = Math.max(0, ...Object.values(totalsByDay))
  const monthlyTotal = Object.values(totalsByDay).reduce((s, v) => s + v, 0)

  const daysElapsed = isCurrentMonth
    ? today.getDate()
    : year < today.getFullYear() || (year === today.getFullYear() && month < today.getMonth() + 1)
      ? daysInMonth
      : 0
  const avgPerDay = daysElapsed > 0 && monthlyTotal > 0 ? Math.round(monthlyTotal / daysElapsed) : null

  return (
    <div className="flex flex-col gap-3">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={onPrev}>
          <ChevronLeft />
        </Button>
        <div className="text-center">
          <div className="font-semibold">
            {date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
          </div>
          {monthlyTotal > 0 && (
            <div className="text-sm text-muted-foreground">
              Total: <span className="font-medium text-foreground">¥{monthlyTotal.toLocaleString()}</span>
            </div>
          )}
          {avgPerDay !== null && (
            <div className="text-sm text-muted-foreground">
              Avg/day: <span className="font-medium text-foreground">¥{avgPerDay.toLocaleString()}</span>
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={onNext}>
          <ChevronRight />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground">
        {WEEKDAYS.map(d => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      {isFetching ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, i) => {
            if (day === null) {
              return <div key={`pad-${i}`} />
            }

            const total = totalsByDay[day]
            const isToday = isCurrentMonth && today.getDate() === day
            // heat colour: higher spend → more red-tinted, low spend → green
            const intensity = maxTotal > 0 && total ? total / maxTotal : 0
            const hasExpense = total !== undefined && total > 0

            return (
              <button
                key={day}
                onClick={() => onDayClick(day)}
                className={cn(
                  'flex flex-col items-center rounded-lg py-1.5 text-xs transition-colors hover:bg-accent',
                  isToday && 'ring-2 ring-primary',
                )}
              >
                <span
                  className={cn(
                    'font-medium',
                    isToday && 'text-primary',
                  )}
                >
                  {day}
                </span>
                {hasExpense ? (
                  <span
                    className={cn(
                      'mt-0.5 font-semibold tabular-nums',
                      intensity > 0.6
                        ? 'text-red-500'
                        : intensity > 0.3
                          ? 'text-orange-400'
                          : 'text-green-600',
                    )}
                  >
                    ¥{total}
                  </span>
                ) : (
                  <span className="mt-0.5 text-muted-foreground">–</span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
