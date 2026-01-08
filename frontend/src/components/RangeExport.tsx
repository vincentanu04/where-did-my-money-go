// components/export/RangeExport.tsx
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
// import { usePostExpensesExportMutation } from "@/api/client"
import { downloadBlob } from "@/utils/download"

export function RangeExport({ onDone }: { onDone: () => void }) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  // const [exportCsv, { isLoading }] = usePostExpensesExportMutation()

  const handleExport = async () => {
    // if (!from || !to) return

    // const blob = await exportCsv({
    //   expenseExportRequest: {
    //     type: "range",
    //     from,
    //     to,
    //   },
    // }).unwrap()

    // downloadBlob(blob, "expenses-range.csv")
    // onDone()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">From</label>
          <Input
            type="date"
            value={from}
            onChange={e => setFrom(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-sm text-muted-foreground">To</label>
          <Input
            type="date"
            value={to}
            onChange={e => setTo(e.target.value)}
          />
        </div>
      </div>

      <Button
        className="w-full"
        onClick={handleExport}
        // disabled={!from || !to || isLoading}
      >
        Export CSV
      </Button>
    </div>
  )
}
