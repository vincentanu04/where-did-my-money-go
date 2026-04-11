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
      putExpensesById: build.mutation<
        PutExpensesByIdApiResponse,
        PutExpensesByIdApiArg
      >({
        query: (queryArg) => ({
          url: `/expenses/${queryArg.id}`,
          method: "PUT",
          body: queryArg.updateExpense,
        }),
        invalidatesTags: [],
      }),
      deleteExpensesById: build.mutation<
        DeleteExpensesByIdApiResponse,
        DeleteExpensesByIdApiArg
      >({
        query: (queryArg) => ({
          url: `/expenses/${queryArg.id}`,
          method: "DELETE",
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
      getExpensesDailyTotals: build.query<
        GetExpensesDailyTotalsApiResponse,
        GetExpensesDailyTotalsApiArg
      >({
        query: (queryArg) => ({
          url: `/expenses/daily-totals`,
          params: {
            month: queryArg.month,
            year: queryArg.year,
          },
        }),
        providesTags: [],
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
      getFriends: build.query<GetFriendsApiResponse, GetFriendsApiArg>({
        query: () => ({ url: `/friends` }),
        providesTags: [],
      }),
      postFriendsRequest: build.mutation<
        PostFriendsRequestApiResponse,
        PostFriendsRequestApiArg
      >({
        query: (queryArg) => ({
          url: `/friends/request`,
          method: "POST",
          body: queryArg.body,
        }),
        invalidatesTags: [],
      }),
      getFriendsRequests: build.query<
        GetFriendsRequestsApiResponse,
        GetFriendsRequestsApiArg
      >({
        query: () => ({ url: `/friends/requests` }),
        providesTags: [],
      }),
      postFriendsByIdAccept: build.mutation<
        PostFriendsByIdAcceptApiResponse,
        PostFriendsByIdAcceptApiArg
      >({
        query: (queryArg) => ({
          url: `/friends/${queryArg.id}/accept`,
          method: "POST",
        }),
        invalidatesTags: [],
      }),
      postFriendsByIdReject: build.mutation<
        PostFriendsByIdRejectApiResponse,
        PostFriendsByIdRejectApiArg
      >({
        query: (queryArg) => ({
          url: `/friends/${queryArg.id}/reject`,
          method: "POST",
        }),
        invalidatesTags: [],
      }),
      deleteFriendsById: build.mutation<
        DeleteFriendsByIdApiResponse,
        DeleteFriendsByIdApiArg
      >({
        query: (queryArg) => ({
          url: `/friends/${queryArg.id}`,
          method: "DELETE",
        }),
        invalidatesTags: [],
      }),
      postExpensesByIdShare: build.mutation<
        PostExpensesByIdShareApiResponse,
        PostExpensesByIdShareApiArg
      >({
        query: (queryArg) => ({
          url: `/expenses/${queryArg.id}/share`,
          method: "POST",
          body: queryArg.shareExpenseRequest,
        }),
        invalidatesTags: [],
      }),
      getExpensesSharedPending: build.query<
        GetExpensesSharedPendingApiResponse,
        GetExpensesSharedPendingApiArg
      >({
        query: () => ({ url: `/expenses/shared/pending` }),
        providesTags: [],
      }),
      postExpensesSharedByShareIdAccept: build.mutation<
        PostExpensesSharedByShareIdAcceptApiResponse,
        PostExpensesSharedByShareIdAcceptApiArg
      >({
        query: (queryArg) => ({
          url: `/expenses/shared/${queryArg.shareId}/accept`,
          method: "POST",
        }),
        invalidatesTags: [],
      }),
      postExpensesSharedByShareIdReject: build.mutation<
        PostExpensesSharedByShareIdRejectApiResponse,
        PostExpensesSharedByShareIdRejectApiArg
      >({
        query: (queryArg) => ({
          url: `/expenses/shared/${queryArg.shareId}/reject`,
          method: "POST",
        }),
        invalidatesTags: [],
      }),
      getNotificationsBadge: build.query<
        GetNotificationsBadgeApiResponse,
        GetNotificationsBadgeApiArg
      >({
        query: () => ({ url: `/notifications/badge` }),
        providesTags: [],
      }),
    }),
    overrideExisting: false,
  });
export { injectedRtkApi as enhancedApi };
export type GetAuthMeApiResponse = /** status 200 Authenticated user */ User;
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
export type PutExpensesByIdApiResponse = unknown;
export type PutExpensesByIdApiArg = {
  id: string;
  updateExpense: UpdateExpense;
};
export type DeleteExpensesByIdApiResponse = unknown;
export type DeleteExpensesByIdApiArg = {
  id: string;
};
export type PostExpensesExportApiResponse = unknown;
export type PostExpensesExportApiArg = {
  expenseExportRequest: ExpenseExportRequest;
};
export type GetExpensesDailyTotalsApiResponse =
  /** status 200 Daily totals */ DailyTotal[];
export type GetExpensesDailyTotalsApiArg = {
  month: number;
  year: number;
};
export type GetSummaryApiResponse =
  /** status 200 Summary per category */ CategorySummary[];
export type GetSummaryApiArg = {
  date: string;
};
export type GetFriendsApiResponse = /** status 200 List of friends */ Friend[];
export type GetFriendsApiArg = void;
export type PostFriendsRequestApiResponse = unknown;
export type PostFriendsRequestApiArg = {
  body: {
    email: string;
  };
};
export type GetFriendsRequestsApiResponse =
  /** status 200 Pending incoming requests */ FriendRequest[];
export type GetFriendsRequestsApiArg = void;
export type PostFriendsByIdAcceptApiResponse = unknown;
export type PostFriendsByIdAcceptApiArg = {
  id: string;
};
export type PostFriendsByIdRejectApiResponse = unknown;
export type PostFriendsByIdRejectApiArg = {
  id: string;
};
export type DeleteFriendsByIdApiResponse = unknown;
export type DeleteFriendsByIdApiArg = {
  id: string;
};
export type PostExpensesByIdShareApiResponse = unknown;
export type PostExpensesByIdShareApiArg = {
  id: string;
  shareExpenseRequest: ShareExpenseRequest;
};
export type GetExpensesSharedPendingApiResponse =
  /** status 200 Pending shares */ PendingShare[];
export type GetExpensesSharedPendingApiArg = void;
export type PostExpensesSharedByShareIdAcceptApiResponse =
  /** status 201 Accepted — new expense created */ Expense;
export type PostExpensesSharedByShareIdAcceptApiArg = {
  shareId: string;
};
export type PostExpensesSharedByShareIdRejectApiResponse = unknown;
export type PostExpensesSharedByShareIdRejectApiArg = {
  shareId: string;
};
export type GetNotificationsBadgeApiResponse =
  /** status 200 Badge count */ BadgeCount;
export type GetNotificationsBadgeApiArg = void;
export type User = {
  id: string;
  email: string;
  createdAt: string;
};
export type Expense = {
  id: string;
  category: string;
  amount: number;
  date: string;
  remark?: string;
  pendingShareCount?: number;
  sharedFromEmail?: string;
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
export type UpdateExpense = {
  amount?: number;
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
export type DailyTotal = {
  date: number;
  total: number;
};
export type CategorySummary = {
  category: string;
  total: number;
};
export type Friend = {
  friendshipId: string;
  id: string;
  email: string;
};
export type FriendRequest = {
  id: string;
  requesterId: string;
  requesterEmail: string;
  createdAt: string;
};
export type ShareSplit = {
  friendId: string;
  amount: number;
};
export type ShareExpenseRequest = {
  splits: ShareSplit[];
};
export type PendingShare = {
  id: string;
  splitAmount: number;
  originalTotal: number;
  category: string;
  expenseDate: string;
  sharedByEmail: string;
  sharedById: string;
};
export type BadgeCount = {
  friendRequests: number;
  pendingShares: number;
};
export const {
  useGetAuthMeQuery,
  usePostAuthRegisterMutation,
  usePostAuthLoginMutation,
  usePostAuthLogoutMutation,
  usePostExpensesListMutation,
  usePostExpensesCreateMutation,
  usePutExpensesByIdMutation,
  useDeleteExpensesByIdMutation,
  usePostExpensesExportMutation,
  useGetExpensesDailyTotalsQuery,
  useGetSummaryQuery,
  useGetFriendsQuery,
  usePostFriendsRequestMutation,
  useGetFriendsRequestsQuery,
  usePostFriendsByIdAcceptMutation,
  usePostFriendsByIdRejectMutation,
  useDeleteFriendsByIdMutation,
  usePostExpensesByIdShareMutation,
  useGetExpensesSharedPendingQuery,
  usePostExpensesSharedByShareIdAcceptMutation,
  usePostExpensesSharedByShareIdRejectMutation,
  useGetNotificationsBadgeQuery,
} = injectedRtkApi;
