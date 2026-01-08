import { configureStore } from "@reduxjs/toolkit"
import { api } from "./api"
import authReducer from "@/store/authSlice.ts"
import homeDateReducer from "@/store/homeDateSlice.ts"

export const store = configureStore({
  reducer: {
    [api.reducerPath]: api.reducer,
    auth: authReducer,
    homeDate: homeDateReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(api.middleware),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
