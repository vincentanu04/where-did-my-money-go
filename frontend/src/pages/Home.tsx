import { useState } from "react"
import { DateHeader } from "@/components/DateHeader"
import { CategoryGrid } from "@/components/CategoryGrid"
import { AddExpenseModal, type SplitEntry } from "@/components/AddExpenseModal"
import { FabHistory } from "@/components/FabHistory"
import { useHomeDate } from "@/hooks/useHomeDate"
import { usePostExpensesCreateMutation, usePostExpensesByIdShareMutation, type CreateExpense } from '@/api/client'
import { toast } from 'sonner'

export default function Home() {
  const { date, oapiDate, prevDay, nextDay } = useHomeDate()
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const [postExpense] = usePostExpensesCreateMutation()
  const [shareExpense] = usePostExpensesByIdShareMutation()

  const handleAddExpense = async (category: string, amount: number, remark?: string, splits?: SplitEntry[]) => {
    const newExpense: CreateExpense = {
      category,
      amount,
      date: oapiDate,
      remark,
    }

    try {
      const created = await postExpense({ createExpense: newExpense }).unwrap()
      if (splits && splits.length > 0) {
        await shareExpense({
          id: created.id,
          shareExpenseRequest: { splits },
        }).unwrap()
      }
      toast.success('Expense added')
    } catch {
      toast.error('Failed to add expense')
    }
  }

  return (
    <>
      <DateHeader
        date={date}
        onPrev={prevDay}
        onNext={nextDay}
      />
      <CategoryGrid onSelect={setSelectedCategory} />
      {selectedCategory && (
        <AddExpenseModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
          onSubmit={(amount, remark, splits) => {
            if (!selectedCategory) return
            handleAddExpense(selectedCategory, amount, remark, splits)
          }}
        />
      )}
      <FabHistory />
    </>
  )
}
