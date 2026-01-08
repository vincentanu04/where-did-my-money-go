import { useHomeDate } from "@/hooks/useHomeDate"
import { DateHeader } from "@/components/DateHeader"
import { ExpenseList } from "@/components/ExpenseList"
import { usePostExpensesListMutation, type ExpensesByCategory } from '@/api/client'
import { useEffect, useState } from 'react'
import { ExportCsvButton } from '@/components/ExportCsvButton'

export default function History() {
  const { date: homeDate } = useHomeDate()
  const [date, setDate] = useState(() => new Date(homeDate))

  const prevDay = () =>
    setDate(d => new Date(d.getTime() - 86400000))
  const nextDay = () =>
    setDate(d => new Date(d.getTime() + 86400000))

  const oapiDate = {
    date: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  }

  const [getExpenses] = usePostExpensesListMutation()
  const [expenses, setExpenses] = useState<ExpensesByCategory[]>([])

  useEffect(() => {
    getExpenses({ date: oapiDate })
      .unwrap()
      .then(setExpenses)
  }, [date])

  return (
    <div className="flex flex-col h-full">
      <DateHeader
        date={date}
        onPrev={prevDay}
        onNext={nextDay}
      />
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        <ExpenseList expenses={expenses} />
      </div>
      <div className="fixed bottom-0 left-0 right-0 border-t bg-background p-4">
        <ExportCsvButton />
      </div>
    </div>
  )
}
