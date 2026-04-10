import Link from "next/link";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth";

type ProtectedApiResponse = {
  session?: {
    sub: string;
    email?: string;
    name?: string;
    preferred_username?: string;
  };
  userinfo?: Record<string, unknown>;
  error?: string;
  status?: number;
};

function renderValue(value: unknown) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  return JSON.stringify(value, null, 2);
}

async function loadProfile() {
  const headerStore = await headers();
  const host = headerStore.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  if (!host) {
    return {
      ok: false,
      status: 500,
      payload: { error: "missing_host_header" } satisfies ProtectedApiResponse
    };
  }

  const response = await fetch(`${protocol}://${host}/api/protected/userinfo`, {
    headers: {
      cookie: headerStore.get("cookie") ?? ""
    },
    cache: "no-store"
  });

  const payload = (await response.json()) as ProtectedApiResponse;

  return {
    ok: response.ok,
    status: response.status,
    payload
  };
}

function formatExpiresIn(expiresAt: number) {
  const remainingMs = Math.max(0, expiresAt - Date.now());
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes > 0) {
    return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
  }

  return `${totalSeconds}s`;
}

export default async function ProfilePage() {
  const [result, session] = await Promise.all([loadProfile(), getSession()]);

  if (!result.ok) {
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
            width: "min(760px, 100%)",
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
            Protected Profile
          </p>
          <h1 style={{ margin: "12px 0", fontFamily: "var(--display)", fontSize: "clamp(2rem, 4vw, 3.25rem)" }}>
            Sign in to view your protected claims.
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
            The app could not load the protected upstream data. Status: <strong>{result.status}</strong>
          </p>
          <pre
            style={{
              margin: "20px 0 0",
              padding: "18px",
              borderRadius: "20px",
              background: "#172033",
              color: "#eff6ff",
              overflowX: "auto",
              fontSize: "13px",
              lineHeight: 1.5
            }}
          >
            {JSON.stringify(result.payload, null, 2)}
          </pre>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "24px" }}>
            <Link
              href="/api/auth/login"
              style={{
                borderRadius: "999px",
                padding: "14px 22px",
                background: "var(--accent)",
                color: "white",
                fontWeight: 700
              }}
            >
              Sign in
            </Link>
            <Link
              href="/"
              style={{
                borderRadius: "999px",
                padding: "14px 22px",
                border: "1px solid var(--border)",
                background: "rgba(255, 255, 255, 0.72)",
                fontWeight: 700
              }}
            >
              Back home
            </Link>
            <form action="/api/protected/refresh" method="post">
              <button
                type="submit"
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "999px",
                  padding: "14px 22px",
                  background: "rgba(15, 118, 110, 0.08)",
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Refresh now
              </button>
            </form>
          </div>
        </section>
      </main>
    );
  }

  const userinfoEntries = Object.entries(result.payload.userinfo ?? {});

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
          width: "min(1080px, 100%)",
          display: "grid",
          gap: "24px",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))"
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
            Protected Profile
          </p>
          <h1 style={{ margin: "12px 0", fontFamily: "var(--display)", fontSize: "clamp(2.25rem, 4vw, 3.75rem)" }}>
            Your session is active.
          </h1>
          <p style={{ margin: 0, color: "var(--muted)", lineHeight: 1.7 }}>
            This page is backed by the protected frontend route, which refreshes tokens when needed and then
            calls the identity server&apos;s `userinfo` endpoint with the current access token.
          </p>

          <div
            style={{
              marginTop: "24px",
              display: "grid",
              gap: "14px"
            }}
          >
            <div
              style={{
                borderRadius: "20px",
                border: "1px solid var(--border)",
                background: "rgba(255,255,255,0.68)",
                padding: "18px"
              }}
            >
              <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-2)" }}>
                Signed in as
              </div>
              <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 700 }}>
                {result.payload.session?.name ?? result.payload.session?.preferred_username ?? "Unknown user"}
              </div>
              <div style={{ marginTop: "8px", color: "var(--muted)" }}>{result.payload.session?.email ?? "No email claim"}</div>
            </div>

            <div
              style={{
                borderRadius: "20px",
                border: "1px solid var(--border)",
                background: "rgba(15, 118, 110, 0.08)",
                padding: "18px"
              }}
            >
              <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent-2)" }}>
                Session expires in
              </div>
              <div style={{ marginTop: "8px", fontSize: "28px", fontWeight: 700 }}>
                {session ? formatExpiresIn(session.expiresAt) : "Unknown"}
              </div>
              <div style={{ marginTop: "8px", color: "var(--muted)" }}>
                Refresh now to rotate the access token and extend the session using the stored refresh token.
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <Link
                href="/"
                style={{
                  borderRadius: "999px",
                  padding: "14px 22px",
                  background: "var(--accent)",
                  color: "white",
                  fontWeight: 700
                }}
              >
                Back home
              </Link>
              <Link
                href="/api/protected/userinfo"
                style={{
                  borderRadius: "999px",
                  padding: "14px 22px",
                  border: "1px solid var(--border)",
                  background: "rgba(255, 255, 255, 0.72)",
                  fontWeight: 700
                }}
              >
                View raw JSON
              </Link>
              <form action="/api/protected/refresh" method="post">
                <button
                  type="submit"
                  style={{
                    border: "1px solid var(--border)",
                    borderRadius: "999px",
                    padding: "14px 22px",
                    background: "rgba(15, 118, 110, 0.08)",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Refresh now
                </button>
              </form>
            </div>
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
            Userinfo Claims
          </h2>

          <div style={{ marginTop: "18px", display: "grid", gap: "12px" }}>
            {userinfoEntries.map(([key, value]) => (
              <div
                key={key}
                style={{
                  borderRadius: "18px",
                  border: "1px solid var(--border)",
                  background: "rgba(255,255,255,0.72)",
                  padding: "16px"
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--accent-2)"
                  }}
                >
                  {key}
                </div>
                <div
                  style={{
                    marginTop: "8px",
                    fontWeight: 600,
                    whiteSpace: typeof value === "string" ? "normal" : "pre-wrap",
                    wordBreak: "break-word"
                  }}
                >
                  {renderValue(value)}
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
