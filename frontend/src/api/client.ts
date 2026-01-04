import { api } from "../store/api";
export const addTagTypes = [] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      postAuthRegister: build.mutation<
        PostAuthRegisterApiResponse,
        PostAuthRegisterApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/register`,
          method: "POST",
          body: queryArg.body,
        }),
        invalidatesTags: [],
      }),
      postAuthLogin: build.mutation<
        PostAuthLoginApiResponse,
        PostAuthLoginApiArg
      >({
        query: (queryArg) => ({
          url: `/auth/login`,
          method: "POST",
          body: queryArg.body,
        }),
        invalidatesTags: [],
      }),
      postAuthLogout: build.mutation<
        PostAuthLogoutApiResponse,
        PostAuthLogoutApiArg
      >({
        query: () => ({ url: `/auth/logout`, method: "POST" }),
        invalidatesTags: [],
      }),
      postExpensesList: build.mutation<
        PostExpensesListApiResponse,
        PostExpensesListApiArg
      >({
        query: (queryArg) => ({
          url: `/expenses/list`,
          method: "POST",
          body: queryArg.date,
        }),
        invalidatesTags: [],
      }),
      postExpensesCreate: build.mutation<
        PostExpensesCreateApiResponse,
        PostExpensesCreateApiArg
      >({
        query: (queryArg) => ({
          url: `/expenses/create`,
          method: "POST",
          body: queryArg.createExpense,
        }),
        invalidatesTags: [],
      }),
      getSummary: build.query<GetSummaryApiResponse, GetSummaryApiArg>({
        query: (queryArg) => ({
          url: `/summary`,
          params: {
            date: queryArg.date,
          },
        }),
        providesTags: [],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as enhancedApi };
export type PostAuthRegisterApiResponse = unknown;
export type PostAuthRegisterApiArg = {
  body: {
    email: string;
    password: string;
  };
};
export type PostAuthLoginApiResponse = unknown;
export type PostAuthLoginApiArg = {
  body: {
    email: string;
    password: string;
  };
};
export type PostAuthLogoutApiResponse = unknown;
export type PostAuthLogoutApiArg = void;
export type PostExpensesListApiResponse =
  /** status 200 Expense list */ ExpensesByCategory[];
export type PostExpensesListApiArg = {
  date: Date;
};
export type PostExpensesCreateApiResponse = /** status 201 Created */ Expense;
export type PostExpensesCreateApiArg = {
  createExpense: CreateExpense;
};
export type GetSummaryApiResponse =
  /** status 200 Summary per category */ CategorySummary[];
export type GetSummaryApiArg = {
  date: string;
};
export type Expense = {
  id: string;
  category: string;
  amount: number;
  date: string;
};
export type ExpensesByCategory = {
  category: string;
  expenses: Expense[];
};
export type Date = {
  date: number;
  month: number;
  year: number;
};
export type CreateExpense = {
  category: string;
  amount: number;
  date: Date;
};
export type CategorySummary = {
  category: string;
  total: number;
};
export const {
  usePostAuthRegisterMutation,
  usePostAuthLoginMutation,
  usePostAuthLogoutMutation,
  usePostExpensesListMutation,
  usePostExpensesCreateMutation,
  useGetSummaryQuery,
} = injectedRtkApi;
