import { api } from "../store/api";
export const addTagTypes = [] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
      getAuthMe: build.query<GetAuthMeApiResponse, GetAuthMeApiArg>({
        query: () => ({ url: `/auth/me` }),
        providesTags: [],
      }),
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
      postExpensesExport: build.mutation<
        PostExpensesExportApiResponse,
        PostExpensesExportApiArg
      >({
        query: (queryArg) => ({
          url: `/expenses/export`,
          method: "POST",
          body: queryArg.expenseExportRequest,
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
export type GetAuthMeApiResponse = unknown;
export type GetAuthMeApiArg = void;
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
export type PostExpensesExportApiResponse = unknown;
export type PostExpensesExportApiArg = {
  expenseExportRequest: ExpenseExportRequest;
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
  remark?: string;
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
  remark?: string;
};
export type ExpenseExportRequest = {
  type: "monthly" | "yearly" | "range";
  /** 0 = current month, 1 = previous month */
  monthOffset?: number;
  year?: number;
  from?: string;
  to?: string;
};
export type CategorySummary = {
  category: string;
  total: number;
};
export const {
  useGetAuthMeQuery,
  usePostAuthRegisterMutation,
  usePostAuthLoginMutation,
  usePostAuthLogoutMutation,
  usePostExpensesListMutation,
  usePostExpensesCreateMutation,
  usePostExpensesExportMutation,
  useGetSummaryQuery,
} = injectedRtkApi;
