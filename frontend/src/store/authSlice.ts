// store/authSlice.ts
import { createSlice } from "@reduxjs/toolkit"

type AuthState = {
  isAuthenticated: boolean
  isBootstrapped: boolean
}

const initialState: AuthState = {
  isAuthenticated: false,
  isBootstrapped: false,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loggedIn(state) {
      state.isAuthenticated = true
      state.isBootstrapped = true
    },
    loggedOut(state) {
      state.isAuthenticated = false
      state.isBootstrapped = true
    },
  },
})

export const { loggedIn, loggedOut } = authSlice.actions
export default authSlice.reducer
