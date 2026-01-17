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
        className="w-full gap-2 h-12"
      >
        <Download className="h-8 w-8" />
        Export CSV
      </Button>

      <ExportCsvModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
