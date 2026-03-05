import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { supabase } from "@/lib/supabase"

interface AuthGuardProps {
  children: React.ReactNode
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { session, setSession } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    // Check session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (!session) navigate("/login", { replace: true })
    })
  }, [navigate, setSession])

  if (!session) return null

  return <>{children}</>
}
