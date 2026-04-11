import { useHomeDate } from "@/hooks/useHomeDate"
import { DateHeader } from "@/components/DateHeader"
import { ExpenseList } from "@/components/ExpenseList"
import { CalendarView } from "@/components/CalendarView"
import { usePostExpensesListMutation, useGetExpensesDailyTotalsQuery, type ExpensesByCategory } from '@/api/client'
import { useEffect, useState } from 'react'
import { ExportCsvButton } from '@/components/ExportCsvButton'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export default function History() {
  const { date: homeDate } = useHomeDate()
  const [date, setDate] = useState(() => new Date(homeDate))
  const [view, setView] = useState<'list' | 'calendar'>('list')

  const prevMonth = () =>
    setDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () =>
    setDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))

  const prevDay = () =>
    setDate(d => new Date(d.getTime() - 86400000))
  const nextDay = () =>
    setDate(d => new Date(d.getTime() + 86400000))

  const oapiDate = {
    date: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  }

  const [getExpenses, { isLoading }] = usePostExpensesListMutation()
  const [expenses, setExpenses] = useState<ExpensesByCategory[]>([])

  const { data: dailyTotals, isFetching: calFetching, refetch: refetchTotals } =
    useGetExpensesDailyTotalsQuery(
      { month: date.getMonth() + 1, year: date.getFullYear() },
      { refetchOnMountOrArgChange: true },
    )

  const fetchExpenses = () => {
    getExpenses({ date: oapiDate })
      .unwrap()
      .then(setExpenses)
      .catch(() => toast.error('Failed to fetch expenses'))
  }

  const onChanged = () => {
    fetchExpenses()
    refetchTotals()
  }

  useEffect(() => {
    if (view === 'list') fetchExpenses()
    if (view === 'calendar') refetchTotals()
  }, [date, view])

  const handleDayClick = (day: number) => {
    setDate(new Date(date.getFullYear(), date.getMonth(), day))
    setView('list')
  }

  return (
    <div className="flex flex-col h-full">
      {view === 'list' ? (
        <DateHeader date={date} onPrev={prevDay} onNext={nextDay} />
      ) : null}

      {/* View toggle — pill segmented control */}
      <div className="flex justify-center px-4 pt-2">
        <div className="inline-flex rounded-full bg-muted p-1 gap-0">
          <button
            type="button"
            onClick={() => setView('list')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              view === 'list'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => setView('calendar')}
            className={cn(
              'flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition-colors',
              view === 'calendar'
                ? 'bg-background shadow-sm text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            Calendar
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {view === 'list' ? (
          <ExpenseList expenses={expenses} isLoading={isLoading} onChanged={onChanged} />
        ) : (
          <CalendarView
            date={date}
            onPrev={prevMonth}
            onNext={nextMonth}
            onDayClick={handleDayClick}
            totals={dailyTotals ?? []}
            isFetching={calFetching}
          />
        )}
      </div>
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
        <ExportCsvButton />
      </div>
    </div>
  )
}
