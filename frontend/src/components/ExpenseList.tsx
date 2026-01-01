import { Card } from "@/components/ui/card"
import type { Expense } from "@/types/expense"

type Props = {
  expenses: Expense[]
}

export const ExpenseList = ({ expenses }: Props) => {
  if (expenses.length === 0) {
    return (
      <Card className="p-4 text-center text-sm text-muted-foreground">
        No expenses for this day
      </Card>
    )
  }

  return (
    <Card className="p-4 space-y-3">
      {expenses.map(e => (
        <div key={e.id} className="flex justify-between">
          <span>{e.category}</span>
          <span>¥{e.amount}</span>
        </div>
      ))}
    </Card>
  )
}
