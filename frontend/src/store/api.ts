import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"
import { loggedOut } from "@/store/authSlice"

const baseQuery = fetchBaseQuery({
  baseUrl: import.meta.env.VITE_API_URL,
  credentials: "include",
})

const baseQueryWithAuth = async (args: any, api: any, extraOptions: any) => {
  const result = await baseQuery(args, api, extraOptions)

  if (result.error?.status === 401) {
    api.dispatch(loggedOut())
  }

  return result
}

export const api = createApi({
  reducerPath: "api",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Expenses"],
  endpoints: () => ({}),
})
