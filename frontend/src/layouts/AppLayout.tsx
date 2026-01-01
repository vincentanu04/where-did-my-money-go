import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  const isHistory = location.pathname === "/history"

  return (
    <div className="min-h-svh flex justify-center">
      <div className="w-full max-w-md lg:max-w-4xl px-4 pb-6">
        {/* HEADER (fixed height, always present) */}
        <header className="h-14 flex items-center gap-2">
          {isHistory ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft />
            </Button>
          ) : (
            /* Placeholder keeps layout identical */
            <div className="w-9 h-9" />
          )}

          <span className="text-sm text-muted-foreground">
            {isHistory ? "History" : "Home"}
          </span>
        </header>

        {/* PAGE CONTENT */}
        <main className="space-y-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
