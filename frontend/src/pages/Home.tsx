import { useState } from "react"
import { DateHeader } from "@/components/DateHeader"
import { CategoryGrid } from "@/components/CategoryGrid"
import { AddExpenseModal } from "@/components/AddExpenseModal"
import { FabHistory } from "@/components/FabHistory"
import { useHomeDate } from "@/hooks/useHomeDate"
import { usePostExpensesCreateMutation, type CreateExpense } from '@/api/client'
import { toast } from 'sonner'

export default function Home() {
  const { date, oapiDate, prevDay, nextDay } = useHomeDate()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const [postExpense, _postExpenseRes] =  usePostExpensesCreateMutation();
  
  const handleAddExpense = async (category: string, amount: number, remark?: string) => {
    const newExpense: CreateExpense = {
      category,
      amount,
      date: oapiDate,
      remark,
    };
    
    try {
      await postExpense({ createExpense: newExpense }).unwrap();
      toast.success('Expense added successfully');
    } catch (err) {
      toast.error('Failed to add expense');
    }
  };

  return (
    <>
      <DateHeader
        date={date}
        onPrev={prevDay}
        onNext={nextDay}
      />
      <CategoryGrid onSelect={setSelectedCategory} />
      {selectedCategory && <AddExpenseModal
        category={selectedCategory}
        onClose={() => setSelectedCategory(null)}
        onSubmit={(amount, remark) => {
          if (!selectedCategory) return;

          handleAddExpense(selectedCategory, amount, remark);
        }}
      />}
      <FabHistory />
    </>
  )
}
