/**
 * Wire RTK Query cache tags between expense mutations and budget queries.
 * This file must be imported before any hooks are used (imported in main.tsx).
 *
 * Do NOT edit client.ts (auto-generated). Add all tag wiring here instead.
 */
import { api } from '@/store/api'

api.enhanceEndpoints({
  endpoints: {
    // Budget queries provide the Budget tag
    getBudgetSummary: { providesTags: ['Budget'] },
    getBudgetHistory: { providesTags: ['Budget'] },
    getBudgetSettings: { providesTags: ['Budget'] },

    // Expense mutations invalidate Budget so summary/history refetch
    postExpensesCreate: { invalidatesTags: ['Budget'] },
    putExpensesById: { invalidatesTags: ['Budget'] },
    deleteExpensesById: { invalidatesTags: ['Budget'] },
    // Accepting a shared expense adds spend to the period too
    postExpensesSharedByShareIdAccept: { invalidatesTags: ['Budget'] },

    // Saving budget settings should refetch summary and history
    putBudgetSettings: { invalidatesTags: ['Budget'] },
  },
})
