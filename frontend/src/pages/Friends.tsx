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
import { UserX, Check, X } from 'lucide-react'

const Friends = () => {
  const [email, setEmail] = useState('')

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

  const handleRemove = async (friendshipId: string) => {
    if (!confirm('Remove this friend?')) return
    try {
      await remove({ id: friendshipId }).unwrap()
      toast.success('Friend removed')
      refetchFriends()
    } catch {
      toast.error('Failed to remove friend')
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-lg mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add a friend</CardTitle>
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
              {sending ? <Spinner /> : 'Add'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="friends">
        <TabsList className="w-full">
          <TabsTrigger value="friends" className="flex-1">
            Friends {friends && friends.length > 0 && `(${friends.length})`}
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1">
            Requests {requests && requests.length > 0 && `(${requests.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="friends">
          <Card>
            <CardContent className="pt-4">
              {loadingFriends ? (
                <div className="flex justify-center py-6"><Spinner /></div>
              ) : !friends || friends.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No friends yet</p>
              ) : (
                <ul className="space-y-2">
                  {friends.map(f => (
                    <li key={f.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm">{f.email}</span>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleRemove(f.friendshipId)}
                        title="Remove friend"
                      >
                        <UserX className="h-4 w-4 text-muted-foreground" />
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
                <p className="text-sm text-muted-foreground text-center py-4">No pending requests</p>
              ) : (
                <ul className="space-y-2">
                  {requests.map(r => (
                    <li key={r.id} className="flex items-center justify-between gap-2">
                      <span className="text-sm">{r.requesterEmail}</span>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleAccept(r.id)} title="Accept">
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleReject(r.id)} title="Reject">
                          <X className="h-4 w-4 text-destructive" />
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
    </div>
  )
}

export default Friends
