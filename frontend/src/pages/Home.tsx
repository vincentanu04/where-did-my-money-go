import { useState } from "react"
import { DateHeader } from "@/components/DateHeader"
import { CategoryGrid } from "@/components/CategoryGrid"
import { AddExpenseModal } from "@/components/AddExpenseModal"
import { FabHistory } from "@/components/FabHistory"
import { useSelectedDate } from "@/hooks/useSelectedDate"
import { useGetExpensesQuery, usePostExpensesMutation, type CreateExpense } from '@/api/client'

export default function Home() {
  const { date, prevDay, nextDay } = useSelectedDate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const { data: expensesData } = useGetExpensesQuery({
    date: date.toISOString().slice(0, 10),
  });

  const [postExpense, _postExpenseRes] =  usePostExpensesMutation();
  
  const handleAddExpense = (category: string, amount: number) => {
    const newExpense: CreateExpense = {
      category,
      amount,
      date: date.toISOString().slice(0, 10),
    };
    
    postExpense({createExpense: newExpense});
  };

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
          if (!selectedCategory) return;

          handleAddExpense(selectedCategory, amount);
        }}
      />
      <FabHistory />
    </>
  )
}
