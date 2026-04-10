import { getSession } from "@/lib/auth";

function prettyJson(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default async function HomePage() {
  const session = await getSession();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "32px"
      }}
    >
      <section
        style={{
          width: "min(980px, 100%)",
          display: "grid",
          gap: "24px",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))"
        }}
      >
        <article
          style={{
            backdropFilter: "blur(14px)",
            background: "var(--panel-strong)",
            border: "1px solid var(--border)",
            borderRadius: "28px",
            padding: "32px",
            boxShadow: "var(--shadow)"
          }}
        >
          <p
            style={{
              margin: 0,
              color: "var(--accent-2)",
              fontWeight: 700,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontSize: "12px"
            }}
          >
            Turborepo Demo
          </p>
          <h1
            style={{
              margin: "12px 0 12px",
              fontFamily: "var(--display)",
              fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
              lineHeight: 0.95
            }}
          >
            OIDC login with authorization code and PKCE.
          </h1>
          <p
            style={{
              margin: 0,
              fontSize: "18px",
              lineHeight: 1.6,
              color: "var(--muted)"
            }}
          >
            This client redirects to the NestJS identity server, completes the OAuth 2.0 authorization
            code flow with a PKCE verifier, and stores the resulting session in an HTTP-only signed cookie.
          </p>
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginTop: "28px"
            }}
          >
            {session ? (
              <form action="/api/auth/logout" method="post">
                <button
                  type="submit"
                  style={{
                    border: 0,
                    borderRadius: "999px",
                    padding: "14px 22px",
                    background: "var(--accent)",
                    color: "white",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Sign out
                </button>
              </form>
            ) : (
              <a
                href="/api/auth/login"
                style={{
                  borderRadius: "999px",
                  padding: "14px 22px",
                  background: "var(--accent)",
                  color: "white",
                  fontWeight: 700
                }}
              >
                Sign in with Identity
              </a>
            )}
            <a
              href="http://localhost:3001/oidc/.well-known/openid-configuration"
              style={{
                borderRadius: "999px",
                padding: "14px 22px",
                border: "1px solid var(--border)",
                background: "rgba(255, 255, 255, 0.72)",
                fontWeight: 700
              }}
            >
              View discovery document
            </a>
            <a
              href="/profile"
              style={{
                borderRadius: "999px",
                padding: "14px 22px",
                border: "1px solid var(--border)",
                background: "rgba(15, 118, 110, 0.08)",
                fontWeight: 700
              }}
            >
              Call protected API
            </a>
          </div>
        </article>

        <article
          style={{
            backdropFilter: "blur(14px)",
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: "28px",
            padding: "32px",
            boxShadow: "var(--shadow)"
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "14px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "var(--accent-2)"
            }}
          >
            Session
          </h2>
          {session ? (
            <>
              <p style={{ margin: "12px 0 18px", fontSize: "18px" }}>
                Signed in as <strong>{session.user.name ?? session.user.preferred_username}</strong>
              </p>
              <pre
                style={{
                  margin: 0,
                  padding: "18px",
                  borderRadius: "20px",
                  background: "#172033",
                  color: "#eff6ff",
                  overflowX: "auto",
                  fontSize: "13px",
                  lineHeight: 1.5
                }}
              >
                {prettyJson(session)}
              </pre>
            </>
          ) : (
            <p style={{ margin: "12px 0 0", color: "var(--muted)", lineHeight: 1.7 }}>
              No active session yet. Start the login flow and this panel will show the claims decoded from
              the returned ID token. The protected profile page at <code>/profile</code> uses the protected
              API route and refreshes tokens automatically when needed.
            </p>
          )}
        </article>
      </section>
    </main>
  );
}
