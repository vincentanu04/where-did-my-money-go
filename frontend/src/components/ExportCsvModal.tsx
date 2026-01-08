import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { MonthlyExport } from './MonthlyExport'
import { YearlyExport } from './YearlyExport'
import { RangeExport } from './RangeExport'

type Props = {
  open: boolean
  onClose: () => void
}

export function ExportCsvModal({ open, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent
       onPointerDownOutside={(e) => {
          e.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>Export expenses as CSV</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="monthly">
          <TabsList className="grid grid-cols-3">
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
            <TabsTrigger value="range">Range</TabsTrigger>
          </TabsList>

          <TabsContent value="monthly">
            <MonthlyExport onDone={onClose} />
          </TabsContent>

          <TabsContent value="yearly">
            <YearlyExport onDone={onClose} />
          </TabsContent>

          <TabsContent value="range">
            <RangeExport onDone={onClose} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
