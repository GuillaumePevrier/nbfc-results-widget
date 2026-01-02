import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <div style={{
        background: "var(--card-bg)",
        padding: "24px",
        borderRadius: "var(--border-radius)",
        boxShadow: "var(--shadow)",
        maxWidth: 640,
        width: "100%",
        textAlign: "center",
      }}>
        <h1 style={{ fontSize: "1.75rem", marginBottom: "0.75rem" }}>
          NBFC Results Widget
        </h1>
        <p style={{ color: "var(--muted)", marginBottom: "1.25rem" }}>
          Embed-ready football results widget built with Next.js 14 and the FFF DOFA API.
        </p>
        <Link
          href="/widget?club=24824"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "12px 18px",
            background: "linear-gradient(135deg, var(--primary), var(--accent))",
            color: "white",
            borderRadius: "12px",
            fontWeight: 600,
            boxShadow: "0 8px 20px rgba(31, 60, 136, 0.2)",
          }}
        >
          View widget demo
        </Link>
      </div>
    </main>
  );
}
