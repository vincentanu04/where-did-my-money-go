import { ChevronLeft, ChevronRight, History } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDate } from "@/utils/formatDate"
import { useLocation, useNavigate } from "react-router-dom"

type Props = {
  date: Date
  onPrev: () => void
  onNext: () => void
}

export function TopBar({ date, onPrev, onNext }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const isHistory = location.pathname === "/history"

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b">
      {isHistory ? (
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ChevronLeft />
        </Button>
      ) : (
        <Button variant="ghost" size="icon" onClick={onPrev}>
          <ChevronLeft />
        </Button>
      )}

      <div className="flex items-center gap-2 text-sm font-medium">
        {formatDate(date)}
        {isToday(date) && (
          <span className="text-xs text-muted-foreground">(Today)</span>
        )}
      </div>

      {!isHistory ? (
        <Button variant="ghost" size="icon" onClick={onNext}>
          <ChevronRight />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/")}
        >
          <History />
        </Button>
      )}
    </div>
  )
}

function isToday(date: Date) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date.getTime() === today.getTime()
}
