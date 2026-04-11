import { useHomeDate } from "@/hooks/useHomeDate"
import { DateHeader } from "@/components/DateHeader"
import { ExpenseList } from "@/components/ExpenseList"
import { CalendarView } from "@/components/CalendarView"
import { usePostExpensesListMutation, useGetExpensesDailyTotalsQuery, type ExpensesByCategory } from '@/api/client'
import { useEffect, useState } from 'react'
import { ExportCsvButton } from '@/components/ExportCsvButton'
import { toast } from 'sonner'
import { LayoutList, CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
    useGetExpensesDailyTotalsQuery({ month: date.getMonth() + 1, year: date.getFullYear() })

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

      {/* View toggle */}
      <div className="flex justify-end gap-1 px-4 pt-2">
        <Button
          variant={view === 'list' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setView('list')}
          title="List view"
        >
          <LayoutList className="h-4 w-4" />
        </Button>
        <Button
          variant={view === 'calendar' ? 'default' : 'ghost'}
          size="icon"
          onClick={() => setView('calendar')}
          title="Calendar view"
        >
          <CalendarDays className="h-4 w-4" />
        </Button>
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
