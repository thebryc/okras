import { useSession, signOut } from "next-auth/react"
import { useRouter } from "next/router"
import { useEffect } from "react"

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  if (status === "loading") {
    return <div>Loading...</div>
  }

  if (!session) {
    return null
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome, {session.user.name || session.user.email}!</h1>
      <p>Email: {session.user.email}</p>
      <p>You're now signed in. Your OKRs will appear here.</p>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        style={{ padding: "10px 20px", fontSize: "16px", cursor: "pointer" }}
      >
        Sign out
      </button>
    </div>
  )
}
