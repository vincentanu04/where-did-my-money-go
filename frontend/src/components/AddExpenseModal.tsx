import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"

type Props = {
  category: string | null
  onClose: () => void
  onSubmit: (amount: number) => void
}

export function AddExpenseModal({ category, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState("")

  if (!category) return null

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            type="number"
            placeholder="JPY"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />

          <Button
            className="w-full"
            onClick={() => {
              onSubmit(Number(amount))
              onClose()
            }}
          >
            Enter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
