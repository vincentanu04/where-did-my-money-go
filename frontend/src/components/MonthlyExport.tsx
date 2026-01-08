import { Button } from "@/components/ui/button"
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"
import { useState } from "react"
import { downloadBlob } from '@/utils/download'
import { fetchExpensesCsv } from '@/utils/api'

export function MonthlyExport({ onDone }: { onDone: () => void }) {
  const [offset, setOffset] = useState("0")
  const monthOptions = getMonthOptions(24);

  const handleExport = async () => {
    const blob = await fetchExpensesCsv({
      type: "monthly",
      monthOffset: Number(offset),
    })

    downloadBlob(blob, "expenses.csv")
    onDone()
  }

  return (
    <div className="space-y-4">
      <Select value={offset} onValueChange={setOffset}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-24">
          {monthOptions.map(m => (
            <SelectItem
              key={m.offset}
              value={String(m.offset)}
            >
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button className="w-full" onClick={handleExport}>
        Export CSV
      </Button>
    </div>
  )
}


type MonthOption = {
  label: string
  offset: number
}

const getMonthOptions = (count = 24): MonthOption[]  => {
  const now = new Date()

  return Array.from({ length: count }, (_, offset) => {
    const date = new Date(
      now.getFullYear(),
      now.getMonth() - offset,
      1
    )

    return {
      offset,
      label: date.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      }),
    }
  })
}
