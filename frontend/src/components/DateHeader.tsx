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
        <div className="text-sm text-muted-foreground">
          {date.toLocaleDateString("en-GB", {
            weekday: "long",
          })}
        </div>
        <div className="font-semibold">
          {date.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </div>

        {isToday(date) && (
          <div className="text-xs text-muted-foreground">Today</div>
        )}
      </div>

      <Button variant="ghost" size="icon" onClick={onNext}>
        <ChevronRight />
      </Button>
    </div>
  )
}
