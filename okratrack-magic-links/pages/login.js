import { useState } from "react"
import { signIn } from "next-auth/react"

export default function Login() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    await signIn("email", { email, redirect: false })
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <div style={{ textAlign: "center", padding: "20px", maxWidth: "400px" }}>
        <h1>BRYC OKR Tracker</h1>

        {!sent ? (
          <>
            <p>Sign in with your @thebryc.org email</p>
            <form onSubmit={handleSubmit}>
              <input
                type="email"
                placeholder="your.email@thebryc.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "16px",
                  marginBottom: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "10px",
                  fontSize: "16px",
                  cursor: loading ? "not-allowed" : "pointer",
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? "Sending..." : "Sign in with Magic Link"}
              </button>
            </form>
          </>
        ) : (
          <div style={{ padding: "20px", backgroundColor: "#f0f0f0", borderRadius: "4px" }}>
            <h2>Check your email!</h2>
            <p>We sent a sign-in link to <strong>{email}</strong></p>
            <p>Click the link in the email to sign in.</p>
            <button
              onClick={() => setSent(false)}
              style={{ marginTop: "10px", padding: "10px 20px", cursor: "pointer" }}
            >
              Try another email
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
