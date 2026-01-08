import type { ExpensesByCategory } from '@/api/client'
import { Card } from "@/components/ui/card"

type Props = {
  expenses: ExpensesByCategory[]
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
    <Card className="p-4 space-y-4">
      {expenses.map(category => (
        <div key={category.category} className="space-y-2">
          {/* Category header */}
          <div className="flex justify-between font-medium">
            <span>{category.category}</span>
            <span>
              ¥
              {category.expenses.reduce(
                (sum, e) => sum + e.amount,
                0
              )}
            </span>
          </div>

          {/* Expenses */}
          <div className="space-y-1 pl-4 text-sm">
            {category.expenses.map(expense => (
              <div
                key={expense.id}
                className="flex justify-between text-muted-foreground"
              >
                <span>¥{expense.amount}</span>
                {/* Show remark */}
                <span className="italic text-gray-500">{expense.remark || ''}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </Card>
  )
}
