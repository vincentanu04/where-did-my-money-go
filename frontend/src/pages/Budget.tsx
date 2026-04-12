import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  useGetBudgetSettingsQuery,
  usePutBudgetSettingsMutation,
  useGetBudgetHistoryQuery,
  useGetBudgetSummaryQuery,
  type BudgetHistoryEntry,
} from '@/api/client'

const tz = Intl.DateTimeFormat().resolvedOptions().timeZone

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

type InputMode = 'daily' | 'weekly' | 'monthly'

function daysInCurrentMonth() {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
}

function toDailyAmount(value: number, mode: InputMode): number {
  if (mode === 'daily') return value
  if (mode === 'weekly') return Math.floor(value / 7)
  return Math.floor(value / daysInCurrentMonth())
}

function fromDailyAmount(daily: number, mode: InputMode): number {
  if (mode === 'daily') return daily
  if (mode === 'weekly') return daily * 7
  return daily * daysInCurrentMonth()
}

// ──────────────────────────────────────────
// Settings Tab
// ──────────────────────────────────────────
function SettingsTab() {
  const { data: settings, isLoading } = useGetBudgetSettingsQuery()
  const [putSettings] = usePutBudgetSettingsMutation()

  const [inputMode, setInputMode] = useState<InputMode>('daily')
  const [dailyAmount, setDailyAmount] = useState(1500)
  const [inputValue, setInputValue] = useState('1500')
  const [resetPeriod, setResetPeriod] = useState<'weekly' | 'monthly'>('weekly')
  const [weekStartDay, setWeekStartDay] = useState(1)
  const [active, setActive] = useState(false)
  const [showSaved, setShowSaved] = useState(false)

  useEffect(() => {
    if (settings) {
      setDailyAmount(settings.dailyAmount)
      setInputValue(String(settings.dailyAmount))
      setResetPeriod(settings.resetPeriod)
      setWeekStartDay(settings.weekStartDay)
      setActive(settings.active)
    }
  }, [settings])

  const handleModeChange = (mode: InputMode) => {
    setInputMode(mode)
    setInputValue(String(fromDailyAmount(dailyAmount, mode)))
  }

  const handleInputChange = (val: string) => {
    setInputValue(val)
    const num = parseInt(val) || 0
    setDailyAmount(toDailyAmount(num, inputMode))
  }

  const flashSaved = () => {
    setShowSaved(true)
    setTimeout(() => setShowSaved(false), 2000)
  }

  const doSave = async (overrides: Partial<{
    dailyAmount: number
    resetPeriod: 'weekly' | 'monthly'
    weekStartDay: number
    active: boolean
  }> = {}) => {
    const payload = {
      dailyAmount: overrides.dailyAmount ?? dailyAmount,
      resetPeriod: overrides.resetPeriod ?? resetPeriod,
      weekStartDay: overrides.weekStartDay ?? weekStartDay,
      active: overrides.active ?? active,
    }
    if (payload.dailyAmount <= 0) return
    try {
      await putSettings({ budgetSettings: payload }).unwrap()
      flashSaved()
    } catch {
      toast.error('Failed to save settings')
    }
  }

  const weeklyEquivalent = dailyAmount * 7
  const monthlyEquivalent = dailyAmount * daysInCurrentMonth()

  const inputModes: InputMode[] = ['daily', 'weekly', 'monthly']

  if (isLoading) {
    return <div className="h-48 rounded-xl bg-muted animate-pulse" />
  }

  return (
    <div>
      {/* Amount section */}
      <div className="pb-5 mb-5 border-b">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Budget amount</span>
          <div className="inline-flex rounded-full bg-muted p-0.5">
            {inputModes.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => handleModeChange(m)}
                className={cn(
                  'rounded-full px-3 py-1 text-xs font-medium transition-colors capitalize',
                  inputMode === m
                    ? 'bg-background shadow-sm text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-baseline gap-1.5 mb-2">
          <span className="text-2xl font-medium text-muted-foreground">¥</span>
          <input
            type="number"
            min="1"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onBlur={() => doSave()}
            className="text-3xl font-bold w-[160px] bg-transparent border-0 border-b-2 border-muted focus:border-primary outline-none pb-0.5 tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-sm text-muted-foreground ml-1">/{inputMode}</span>
        </div>

        <p className="text-xs text-muted-foreground">
          {inputMode !== 'daily' && `= ¥${dailyAmount.toLocaleString()}/day · `}
          {inputMode !== 'weekly' && `≈ ¥${weeklyEquivalent.toLocaleString()}/week · `}
          {inputMode !== 'monthly' && `≈ ¥${monthlyEquivalent.toLocaleString()}/month`}
        </p>
      </div>

      {/* Settings rows */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Reset period</span>
          <Select
            value={resetPeriod}
            onValueChange={(v) => {
              const val = v as 'weekly' | 'monthly'
              setResetPeriod(val)
              doSave({ resetPeriod: val })
            }}
          >
            <SelectTrigger className="w-[130px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {resetPeriod === 'weekly' && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Week starts on</span>
            <Select
              value={String(weekStartDay)}
              onValueChange={(v) => {
                const val = Number(v)
                setWeekStartDay(val)
                doSave({ weekStartDay: val })
              }}
            >
              <SelectTrigger className="w-[130px] h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS_OF_WEEK.map((day, idx) => (
                  <SelectItem key={idx} value={String(idx)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {active ? 'Budget active' : 'Budget paused'}
          </span>
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'text-xs text-emerald-600 transition-opacity duration-500',
                showSaved ? 'opacity-100' : 'opacity-0',
              )}
            >
              ✓ Saved
            </span>
            <Switch
              checked={active}
              onCheckedChange={(checked) => {
                setActive(checked)
                doSave({ active: checked })
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

// ──────────────────────────────────────────
// Current period row
// ──────────────────────────────────────────
function CurrentPeriodRow() {
  const { data, isLoading } = useGetBudgetSummaryQuery({ tz }, { refetchOnMountOrArgChange: 30 })
  const [expanded, setExpanded] = useState(false)

  if (isLoading) return <div className="h-14 py-3"><div className="h-full rounded bg-muted animate-pulse" /></div>
  if (!data) return null

  const totalSpent = data.spentSoFar + data.spentToday
  const pct = data.periodTotal > 0 ? Math.min((totalSpent / data.periodTotal) * 100, 100) : 0

  const formatDateRange = () => {
    const start = new Date(data.periodStart + 'T00:00:00')
    const end = new Date(data.periodEnd + 'T00:00:00')
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    return `${start.toLocaleDateString('en-GB', opts)} – ${end.toLocaleDateString('en-GB', opts)}`
  }

  const now = new Date()
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`

  return (
    <div className="py-3 cursor-pointer select-none" onClick={() => setExpanded((p) => !p)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium">{formatDateRange()}</p>
            <span className="shrink-0 text-[10px] font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              Current
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            ¥{totalSpent.toLocaleString()} spent of ¥{data.periodTotal.toLocaleString()}
          </p>
          <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                'h-full rounded-full transition-all',
                pct >= 100 ? 'bg-destructive' : pct >= 75 ? 'bg-amber-500' : 'bg-primary',
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground tabular-nums shrink-0 pt-0.5">
          {pct.toFixed(0)}%
        </span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-1.5 border-t pt-3">
          {data.dailyBreakdown.map((day) => {
            const spent = day.spent ?? 0
            const isFuture = day.spent == null
            const isToday = day.date === todayStr
            const dayPct = day.allowance > 0 ? Math.min((spent / day.allowance) * 100, 100) : 0
            const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })
            return (
              <div
                key={day.date}
                className={cn('flex items-center gap-2 text-xs', isFuture && 'opacity-40')}
              >
                <span
                  className={cn(
                    'w-[88px] shrink-0',
                    isToday ? 'font-semibold text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {dayLabel}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  {!isFuture && (
                    <div
                      className={cn(
                        'h-full rounded-full',
                        dayPct >= 100 ? 'bg-destructive' : dayPct >= 75 ? 'bg-amber-500' : 'bg-primary',
                      )}
                      style={{ width: `${dayPct}%` }}
                    />
                  )}
                </div>
                <span className="w-[80px] text-right text-muted-foreground shrink-0">
                  {isFuture ? `— / ¥${day.allowance.toLocaleString()}` : `¥${spent.toLocaleString()} / ¥${day.allowance.toLocaleString()}`}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ──────────────────────────────────────────
// Past period row
// ──────────────────────────────────────────
function PeriodRow({ entry }: { entry: BudgetHistoryEntry }) {
  const [expanded, setExpanded] = useState(false)
  const isOver = entry.status === 'over_budget'
  const diffAmount = Math.abs(entry.underOver)

  const formatDateRange = () => {
    const start = new Date(entry.periodStart + 'T00:00:00')
    const end = new Date(entry.periodEnd + 'T00:00:00')
    const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' }
    return `${start.toLocaleDateString('en-GB', opts)} – ${end.toLocaleDateString('en-GB', opts)}`
  }

  return (
    <div
      className="py-3 cursor-pointer select-none"
      onClick={() => setExpanded((p) => !p)}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">{formatDateRange()}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            ¥{entry.totalSpent.toLocaleString()} spent of ¥{entry.periodTotal.toLocaleString()}
          </p>
        </div>
        <span
          className={cn(
            'text-xs font-semibold px-2 py-1 rounded-full shrink-0',
            isOver
              ? 'bg-destructive/10 text-destructive'
              : 'bg-emerald-500/10 text-emerald-600',
          )}
        >
          {isOver
            ? `¥${diffAmount.toLocaleString()} over`
            : `¥${diffAmount.toLocaleString()} under`}
        </span>
      </div>

      {expanded && (
        <div className="mt-3 space-y-1.5 border-t pt-3">
          {entry.dailyBreakdown.map((day) => {
            const spent = day.spent ?? 0
            const pct = day.allowance > 0 ? Math.min((spent / day.allowance) * 100, 100) : 0
            const dayLabel = new Date(day.date + 'T00:00:00').toLocaleDateString('en-GB', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
            })
            return (
              <div key={day.date} className="flex items-center gap-2 text-xs">
                <span className="w-[88px] text-muted-foreground shrink-0">{dayLabel}</span>
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn(
                      'h-full rounded-full',
                      pct >= 100 ? 'bg-destructive' : pct >= 75 ? 'bg-amber-500' : 'bg-primary',
                    )}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-[80px] text-right text-muted-foreground shrink-0">
                  ¥{spent.toLocaleString()} / ¥{day.allowance.toLocaleString()}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function HistoryTab() {
  const { data, isLoading } = useGetBudgetHistoryQuery({ tz })

  if (isLoading) {
    return <div className="h-48 rounded-xl bg-muted animate-pulse" />
  }

  return (
    <div className="divide-y">
      <CurrentPeriodRow />
      {!data || data.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No completed periods yet.
        </p>
      ) : (
        data.map((entry) => (
          <PeriodRow key={entry.periodStart} entry={entry} />
        ))
      )}
    </div>
  )
}

// ──────────────────────────────────────────
// Page
// ──────────────────────────────────────────
const Budget = () => {
  return (
    <div className="pb-8">
      <Tabs defaultValue="settings">
        <TabsList className="w-full mb-4">
          <TabsTrigger value="settings" className="flex-1">Settings</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">Periods</TabsTrigger>
        </TabsList>

        <TabsContent value="settings">
          <Card>
            <CardContent className="pt-1">
              <SettingsTab />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardContent className="pt-1">
              <HistoryTab />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default Budget
