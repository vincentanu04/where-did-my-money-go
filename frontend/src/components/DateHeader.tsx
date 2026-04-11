import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

type Props = {
  date: Date
  onPrev: () => void
  onNext: () => void
}

function isToday(date: Date) {
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

export function DateHeader({ date, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between gap-2">
      <Button variant="ghost" size="icon" onClick={onPrev}>
        <ChevronLeft />
      </Button>

      <div className="text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wide">
          {date.toLocaleDateString("en-GB", { weekday: "long" })}
        </div>
        <div className="text-2xl font-bold leading-tight">
          {date.toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
        </div>
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString("en-GB", { year: "numeric" })}
        </div>

        {isToday(date) && (
          <div className="inline-flex mt-0.5 items-center rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Today</div>
        )}
      </div>

      <Button variant="ghost" size="icon" onClick={onNext}>
        <ChevronRight />
      </Button>
    </div>
  )
}
