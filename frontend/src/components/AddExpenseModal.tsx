import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState, useEffect } from "react"
import { useGetFriendsQuery } from "@/api/client"
import { Spinner } from "@/components/ui/spinner"

export type SplitEntry = { friendId: string; amount: number }

type Props = {
  category: string | null
  onClose: () => void
  onSubmit: (amount: number, remark?: string, splits?: SplitEntry[]) => void
}

export function AddExpenseModal({ category, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState("")
  const [remark, setRemark] = useState("")
  const [splitting, setSplitting] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [amounts, setAmounts] = useState<Record<string, string>>({})

  const { data: friends, isLoading: loadingFriends } = useGetFriendsQuery(undefined, { skip: !splitting })

  const selectedArr = Array.from(selected)
  const splitTotal = selectedArr.reduce((sum, fid) => sum + (Number(amounts[fid]) || 0), 0)
  const yourPortion = (Number(amount) || 0) - splitTotal

  useEffect(() => {
    if (selected.size === 0 || !amount) return
    const equal = Math.floor(Number(amount) / (selected.size + 1))
    setAmounts(prev => {
      const next = { ...prev }
      for (const fid of selected) {
        next[fid] = String(equal)
      }
      return next
    })
  }, [selected.size])

  const toggle = (friendId: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(friendId)) {
        next.delete(friendId)
        setAmounts(a => { const c = { ...a }; delete c[friendId]; return c })
      } else {
        next.add(friendId)
      }
      return next
    })
  }

  if (!category) return null

  const canSubmit =
    !!amount &&
    Number(amount) > 0 &&
    (!splitting || selected.size === 0 || yourPortion > 0)

  const handleSubmit = () => {
    const splits =
      splitting && selected.size > 0
        ? selectedArr.map(fid => ({ friendId: fid, amount: Number(amounts[fid]) }))
        : undefined
    onSubmit(Number(amount), remark || undefined, splits)
    onClose()
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input
            type="number"
            placeholder="JPY"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Remark"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />

          <div>
            <button
              type="button"
              className="text-sm text-muted-foreground hover:underline underline-offset-2"
              onClick={() => setSplitting(v => !v)}
            >
              {splitting ? '− Remove split' : '+ Split with friends'}
            </button>

            {splitting && (
              <div className="mt-3 space-y-2">
                {loadingFriends ? (
                  <div className="flex justify-center py-3"><Spinner /></div>
                ) : !friends || friends.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No friends yet.</p>
                ) : (
                  <>
                    {friends.map(f => (
                      <div key={f.id} className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          id={`split-${f.id}`}
                          checked={selected.has(f.id)}
                          onChange={() => toggle(f.id)}
                          className="h-4 w-4 rounded border-input"
                        />
                        <Label htmlFor={`split-${f.id}`} className="flex-1 cursor-pointer text-sm">{f.email}</Label>
                        {selected.has(f.id) && (
                          <Input
                            type="number"
                            min={1}
                            className="w-24 text-right"
                            value={amounts[f.id] ?? ''}
                            onChange={e => setAmounts(a => ({ ...a, [f.id]: e.target.value }))}
                          />
                        )}
                      </div>
                    ))}
                    {selected.size > 0 && (
                      <p className={`text-sm font-medium ${yourPortion > 0 ? 'text-muted-foreground' : 'text-destructive'}`}>
                        Your portion: ¥{yourPortion.toLocaleString()}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            Enter
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
