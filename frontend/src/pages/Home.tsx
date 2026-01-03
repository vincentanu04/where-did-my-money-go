import { useState } from "react"
import { DateHeader } from "@/components/DateHeader"
import { CategoryGrid } from "@/components/CategoryGrid"
import { AddExpenseModal } from "@/components/AddExpenseModal"
import { FabHistory } from "@/components/FabHistory"
import { useSelectedDate } from "@/hooks/useSelectedDate"
import type { Expense } from "@/types/expense"
import { useGetExpensesQuery } from '@/api/client'

export default function Home() {
  const { date, prevDay, nextDay } = useSelectedDate()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [expenses, setExpenses] = useState<Expense[]>([])
  const { data: expensesData } = useGetExpensesQuery({
    date: date.toISOString().slice(0, 10),
  });

  console.log(expensesData)

  return (
    <>
      <DateHeader
        date={date}
        onPrev={prevDay}
        onNext={nextDay}
      />
      <CategoryGrid onSelect={setSelectedCategory} />
      <AddExpenseModal
        category={selectedCategory}
        onClose={() => setSelectedCategory(null)}
        onSubmit={(amount) => {
          setExpenses(e => [
            ...e,
            {
              id: crypto.randomUUID(),
              category: selectedCategory!,
              amount,
              date,
            },
          ])
        }}
      />
      <FabHistory />
    </>
  )
}
