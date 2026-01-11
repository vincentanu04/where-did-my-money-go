import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from '@/components/ui/sonner'

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-svh flex justify-center">
      <div className="w-full max-w-md lg:max-w-4xl px-4 pb-6">
        {/* HEADER (fixed height, always present) */}
        <header className="h-14 flex items-center gap-2">
          {location.pathname !== "/" && location.pathname !== "/login" && location.pathname !== "/register" ? (
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
            {location.pathname === "/" ? "Home" : location.pathname.slice(1).charAt(0).toUpperCase() + location.pathname.slice(2)}
          </span>
        </header>

        {/* PAGE CONTENT */}
        <main className="space-y-6">
          <Outlet />
          <Toaster position="bottom-center" />
        </main>
      </div>
    </div>
  )
}
