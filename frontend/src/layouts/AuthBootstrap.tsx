import { useDispatch } from "react-redux"
import { useEffect, type PropsWithChildren } from 'react'
import { useGetAuthMeQuery } from '@/api/client'
import { loggedIn, loggedOut } from '@/store/authSlice'

export default function AuthBootstrap({ children }: PropsWithChildren) {
  const dispatch = useDispatch()
  const { isSuccess, isError, isFetching } = useGetAuthMeQuery()

  useEffect(() => {
    if (isSuccess) dispatch(loggedIn())
    if (isError) dispatch(loggedOut())
  }, [isSuccess, isError, dispatch])

  if (isFetching) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  return <>{children}</>
}
