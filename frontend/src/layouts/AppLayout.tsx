import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { ArrowLeft, LogOut, Users, Bell, Wallet } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSelector, useDispatch } from "react-redux"
import type { RootState } from "@/store"
import { loggedOut } from "@/store/authSlice"
import { usePostAuthLogoutMutation } from "@/api/client"
import { useGetNotificationsBadgeQuery } from "@/api/client"

function getInitials(email: string) {
  return email.split("@")[0].slice(0, 2).toUpperCase()
}

const PAGE_TITLES: Record<string, string> = {
  "/": "Home",
  "/history": "History",
  "/friends": "Friends",
  "/pending-shares": "Pending Shares",
  "/budget": "Budget",
}

export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth)

  const [logout] = usePostAuthLogoutMutation()
  const { data: badge } = useGetNotificationsBadgeQuery(undefined, { skip: !user })

  const pageTitle = PAGE_TITLES[location.pathname] ?? ""

  const handleLogout = async () => {
    try {
      await logout().unwrap()
    } finally {
      // Always reset local state
      dispatch(loggedOut())
      navigate("/login")
    }
  }

  return (
    <div className="min-h-svh flex justify-center">
      <div className="w-full max-w-md lg:max-w-4xl px-4 pb-6">
        {/* HEADER */}
        <header className="h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {location.pathname !== "/" &&
            location.pathname !== "/login" &&
            location.pathname !== "/register" ? (
              <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                <ArrowLeft />
              </Button>
            ) : (
              <div className="w-9 h-9" />
            )}

            <span className="font-semibold text-base">
              {pageTitle}
            </span>
          </div>

          {user && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/pending-shares")}
                title="Pending shares"
                className="relative"
              >
                <Bell className="h-5 w-5" />
                {badge && badge.pendingShares > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-medium">
                    {badge.pendingShares > 9 ? '9+' : badge.pendingShares}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/friends")}
                title="Friends"
                className="relative"
              >
                <Users className="h-5 w-5" />
                {badge && badge.friendRequests > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-medium">
                    {badge.friendRequests > 9 ? '9+' : badge.friendRequests}
                  </span>
                )}
              </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarFallback>
                    {getInitials(user.email)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <div className="px-2 py-1 text-sm text-muted-foreground">
                  {user.email}
                </div>
                <DropdownMenuItem
                  onClick={() => navigate('/budget')}
                  className="cursor-pointer"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  Budget
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-destructive cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          )}
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
