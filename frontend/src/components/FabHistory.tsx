import { Button } from "@/components/ui/button"
import { History } from "lucide-react"
import { useNavigate } from "react-router-dom"

export function FabHistory() {
  const navigate = useNavigate()

  return (
    <Button
      size="icon"
      className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg"
      onClick={() => navigate("/history")}
    >
      <History />
    </Button>
  )
}
