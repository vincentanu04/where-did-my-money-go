import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState } from "react"
import { downloadBlob } from "@/utils/download"
import { fetchExpensesCsv } from '@/utils/api'
import { toast } from 'sonner'

export function RangeExport({ onDone }: { onDone: () => void }) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  const handleExport = async () => {
    if (!from || !to) return

    try {
      const blob = await fetchExpensesCsv({
        type: "range",
        from,
        to,
      })

      const fromLabel = from.replaceAll('-', '')
      const toLabel = to.replaceAll('-', '')

      downloadBlob(
        blob as any,
        `expenses-${fromLabel}-to-${toLabel}.csv`
      )
      onDone()
    } catch (err) {
      toast.error("Failed to export CSV");
    }
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
        disabled={!from || !to}
      >
        Export CSV
      </Button>
    </div>
  )
}
