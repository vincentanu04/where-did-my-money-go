import { BrowserRouter, Routes, Route } from "react-router-dom"
import AppLayout from "@/layouts/AppLayout"
import Home from "@/pages/Home"
import History from "@/pages/History"
import Login from './pages/Login'
import RequireAuth from './layouts/RequireAuth'
import Register from './pages/Register'
import Friends from './pages/Friends'
import PendingShares from './pages/PendingShares'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<RequireAuth />}>
              <Route path="/" element={<Home />} />
              <Route path="/history" element={<History />} />
              <Route path="/friends" element={<Friends />} />
              <Route path="/pending-shares" element={<PendingShares />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
