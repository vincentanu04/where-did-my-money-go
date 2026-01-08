import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

const normalize = (d: Date) => {
  const copy = new Date(d)
  copy.setHours(0, 0, 0, 0)
  return copy
}

const homeDateSlice = createSlice({
  name: "homeDate",
  initialState: {
    date: normalize(new Date()).toISOString(),
  },
  reducers: {
    setHomeDate(state, action: PayloadAction<Date>) {
      state.date = normalize(action.payload).toISOString()
    },
    prevHomeDay(state) {
      const d = new Date(state.date)
      d.setDate(d.getDate() - 1)
      state.date = d.toISOString()
    },
    nextHomeDay(state) {
      const d = new Date(state.date)
      d.setDate(d.getDate() + 1)
      state.date = d.toISOString()
    },
  },
})

export const { setHomeDate, prevHomeDay, nextHomeDay } =
  homeDateSlice.actions

export default homeDateSlice.reducer
