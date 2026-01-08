// auth/RequireAuth.tsx
import { Navigate, Outlet, useLocation } from "react-router-dom"
import { useSelector } from "react-redux"
import type { RootState } from "@/store"

export default function RequireAuth() {
  const { isAuthenticated, isBootstrapped } = useSelector(
    (state: RootState) => state.auth
  )

  const location = useLocation()

  // ⛔️ WAIT until bootstrap is done
  if (!isBootstrapped) {
    return null // or spinner if you want
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
