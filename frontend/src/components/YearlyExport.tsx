// components/export/YearlyExport.tsx
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react"
import { downloadBlob } from "@/utils/download"
import { fetchExpensesCsv } from '@/utils/api'

export function YearlyExport({ onDone }: { onDone: () => void }) {
  const [offset, setOffset] = useState("0")
  const yearOptions = getYearOptions(10)

  const handleExport = async () => {
    const blob = await fetchExpensesCsv({
      type: "yearly",
      year: new Date().getFullYear() - Number(offset),
    })

    downloadBlob(blob as any, "expenses-year.csv")
    onDone()
  }

  return (
    <div className="space-y-4">
      <Select value={offset} onValueChange={setOffset}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-64">
          {yearOptions.map(y => (
            <SelectItem
              key={y.offset}
              value={String(y.offset)}
            >
              {y.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        className="w-full"
        onClick={handleExport}
      >
        Export CSV
      </Button>
    </div>
  )
}

type YearOption = {
  label: string
  offset: number
}

const getYearOptions = (count = 10): YearOption[] => {
  const currentYear = new Date().getFullYear()

  return Array.from({ length: count }, (_, offset) => ({
    offset,
    label: String(currentYear - offset),
  }))
}