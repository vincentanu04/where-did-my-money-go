import { useState } from "react"

export function useSelectedDate() {
  const [date, setDate] = useState(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return today
  })

  const prevDay = () =>
    setDate(d => new Date(d.getTime() - 86400000))

  const nextDay = () =>
    setDate(d => new Date(d.getTime() + 86400000))

  return { date, setDate, prevDay, nextDay }
}
