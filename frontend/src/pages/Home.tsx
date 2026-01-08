import { useState } from "react"
import { DateHeader } from "@/components/DateHeader"
import { CategoryGrid } from "@/components/CategoryGrid"
import { AddExpenseModal } from "@/components/AddExpenseModal"
import { FabHistory } from "@/components/FabHistory"
import { useHomeDate } from "@/hooks/useHomeDate"
import { usePostExpensesCreateMutation, type CreateExpense } from '@/api/client'

export default function Home() {
  const { date, oapiDate, prevDay, nextDay } = useHomeDate()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const [postExpense, _postExpenseRes] =  usePostExpensesCreateMutation();
  
  const handleAddExpense = (category: string, amount: number) => {
    const newExpense: CreateExpense = {
      category,
      amount,
      date: oapiDate,
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
