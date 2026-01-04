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
      getExpenses: build.query<GetExpensesApiResponse, GetExpensesApiArg>({
        query: (queryArg) => ({
          url: `/expenses`,
          params: {
            date: queryArg.date,
          },
        }),
        providesTags: [],
      }),
      postExpenses: build.mutation<PostExpensesApiResponse, PostExpensesApiArg>(
        {
          query: (queryArg) => ({
            url: `/expenses`,
            method: "POST",
            body: queryArg.createExpense,
          }),
          invalidatesTags: [],
        },
      ),
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
export type GetExpensesApiResponse = /** status 200 Expense list */ Expense[];
export type GetExpensesApiArg = {
  date: string;
};
export type PostExpensesApiResponse = /** status 201 Created */ Expense;
export type PostExpensesApiArg = {
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
export type CreateExpense = {
  category: string;
  amount: number;
  date: string;
};
export type CategorySummary = {
  category: string;
  total: number;
};
export const {
  usePostAuthRegisterMutation,
  usePostAuthLoginMutation,
  usePostAuthLogoutMutation,
  useGetExpensesQuery,
  usePostExpensesMutation,
  useGetSummaryQuery,
} = injectedRtkApi;
