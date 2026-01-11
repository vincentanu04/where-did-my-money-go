// store/authSlice.ts
import type { User } from '@/api/client'
import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type AuthState = {
  user: User | null
  isAuthenticated: boolean
  isBootstrapped: boolean
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isBootstrapped: false,
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    loggedIn: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true
      state.isBootstrapped = true
    },
    loggedOut: (state) => {
      state.user = null;
      state.isAuthenticated = false
      state.isBootstrapped = true
    },
  },
})

export const { loggedIn, loggedOut } = authSlice.actions
export default authSlice.reducer
