import { useDispatch, useSelector } from "react-redux"
import type { RootState } from "@/store"
import { prevHomeDay, nextHomeDay } from "@/store/homeDateSlice"
import type { Date as OapiDate } from "@/api/client"

export function useHomeDate() {
  const dispatch = useDispatch()
  const iso = useSelector((s: RootState) => s.homeDate.date)
  const date = new Date(iso)

  const oapiDate: OapiDate = {
    date: date.getDate(),
    month: date.getMonth() + 1,
    year: date.getFullYear(),
  }

  return {
    date,
    oapiDate,
    prevDay: () => dispatch(prevHomeDay()),
    nextDay: () => dispatch(nextHomeDay()),
  }
}
