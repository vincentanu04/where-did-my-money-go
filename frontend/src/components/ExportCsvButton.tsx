import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useState } from "react"
import { ExportCsvModal } from "@/components/ExportCsvModal"

export function ExportCsvButton() {
  const [open, setOpen] = useState(false)

  return (
    <div className="w-full">
      <Button
        onClick={() => setOpen(true)}
        className="w-full gap-2 h-10"
      >
        <Download className="h-4 w-4" />
        Export CSV
      </Button>

      <ExportCsvModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
