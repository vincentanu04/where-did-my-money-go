import { useState } from 'react'
import { toast } from 'sonner'
import {
  useGetFriendsQuery,
  useGetFriendsRequestsQuery,
  usePostFriendsRequestMutation,
  usePostFriendsByIdAcceptMutation,
  usePostFriendsByIdRejectMutation,
  useDeleteFriendsByIdMutation,
  useGetNotificationsBadgeQuery,
} from '@/api/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Spinner } from '@/components/ui/spinner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { UserX, Check, X, UserPlus } from 'lucide-react'

function getInitials(email: string) {
  return email.split('@')[0].slice(0, 2).toUpperCase()
}

const Friends = () => {
  const [email, setEmail] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)

  const { data: friends, isLoading: loadingFriends, refetch: refetchFriends } = useGetFriendsQuery()
  const { data: requests, isLoading: loadingRequests, refetch: refetchRequests } = useGetFriendsRequestsQuery()
  const { refetch: refetchBadge } = useGetNotificationsBadgeQuery()

  const [sendRequest, { isLoading: sending }] = usePostFriendsRequestMutation()
  const [accept] = usePostFriendsByIdAcceptMutation()
  const [reject] = usePostFriendsByIdRejectMutation()
  const [remove] = useDeleteFriendsByIdMutation()

  const handleSendRequest = async () => {
    if (!email.trim()) return
    try {
      await sendRequest({ body: { email: email.trim() } }).unwrap()
      toast.success('Friend request sent')
      setEmail('')
    } catch (err: any) {
      if (err?.status === 404) toast.error('No user found with that email')
      else if (err?.status === 409) toast.error('Already friends or request already sent')
      else toast.error('Failed to send request')
    }
  }

  const handleAccept = async (id: string) => {
    try {
      await accept({ id }).unwrap()
      toast.success('Friend added')
      refetchFriends()
      refetchRequests()
      refetchBadge()
    } catch {
      toast.error('Failed to accept request')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await reject({ id }).unwrap()
      refetchRequests()
      refetchBadge()
    } catch {
      toast.error('Failed to reject request')
    }
  }

  const confirmRemove = async () => {
    if (!removingId) return
    try {
      await remove({ id: removingId }).unwrap()
      toast.success('Friend removed')
      setRemovingId(null)
      refetchFriends()
    } catch {
      toast.error('Failed to remove friend')
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserPlus className="h-4 w-4" />
            Add a friend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
            />
            <Button onClick={handleSendRequest} disabled={sending || !email.trim()}>
              {sending ? <Spinner /> : 'Send'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="friends">
        <TabsList className="w-full">
          <TabsTrigger value="friends" className="flex-1">
            Friends {friends && friends.length > 0 && <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium">{friends.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1">
            Requests {requests && requests.length > 0 && <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium">{requests.length}</span>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <Card>
            <CardContent className="pt-4">
              {loadingFriends ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : !friends || friends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No friends yet. Add someone above!</p>
              ) : (
                <ul className="divide-y">
                  {friends.map(f => (
                    <li key={f.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="text-xs">{getInitials(f.email)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{f.email}</span>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setRemovingId(f.friendshipId)}
                        title="Remove friend"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="requests">
          <Card>
            <CardContent className="pt-4">
              {loadingRequests ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : !requests || requests.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No pending requests</p>
              ) : (
                <ul className="divide-y">
                  {requests.map(r => (
                    <li key={r.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="text-xs">{getInitials(r.requesterEmail)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm truncate">{r.requesterEmail}</span>
                      </div>
                      <div className="flex gap-1.5 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => handleAccept(r.id)} className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700">
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Accept
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleReject(r.id)} className="text-muted-foreground">
                          <X className="h-3.5 w-3.5 mr-1" />
                          Decline
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AlertDialog open={!!removingId} onOpenChange={open => { if (!open) setRemovingId(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove friend?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be removed from your friends list.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemove}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default Friends
