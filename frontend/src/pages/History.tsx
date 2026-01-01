import { useSelectedDate } from "@/hooks/useSelectedDate"
import { DateHeader } from "@/components/DateHeader"
import { ExpenseList } from "@/components/ExpenseList"
import type { Expense } from "@/types/expense"

export default function History() {
  const { date, prevDay, nextDay } = useSelectedDate()

  const expenses: Expense[] = [] // wire later

  return (
    <>
      <DateHeader
        date={date}
        onPrev={prevDay}
        onNext={nextDay}
      />

      <ExpenseList expenses={expenses} />
    </>
  )
}
