import { Button } from "@/components/ui/button"
import { Select, SelectItem, SelectTrigger, SelectValue, SelectContent } from "@/components/ui/select"
import { useState } from "react"
import { downloadBlob } from '@/utils/download'
import { fetchExpensesCsv } from '@/utils/api'
import { toast } from 'sonner'

export function MonthlyExport({ onDone }: { onDone: () => void }) {
  const [offset, setOffset] = useState("0")
  const monthOptions = getMonthOptions(24);

  const handleExport = async () => {
    const offsetNum = Number(offset)

    const date = new Date()
    date.setMonth(date.getMonth() - offsetNum)

    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')

    try {
      const blob = await fetchExpensesCsv({
        type: "monthly",
        monthOffset: offsetNum,
      })

      downloadBlob(blob, `expenses-${yyyy}-${mm}.csv`)
      onDone()
    } catch (error) {
      toast.error("Failed to export CSV");
    }
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
