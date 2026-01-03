import { api } from "../store/api";
export const addTagTypes = [] as const;
const injectedRtkApi = api
  .enhanceEndpoints({
    addTagTypes,
  })
  .injectEndpoints({
    endpoints: (build) => ({
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
  useGetExpensesQuery,
  usePostExpensesMutation,
  useGetSummaryQuery,
} = injectedRtkApi;
