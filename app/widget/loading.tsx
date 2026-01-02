export default function WidgetLoading() {
  return (
    <main style={{ padding: "16px" }}>
      <div
        style={{
          background: "#fff",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
          color: "#0f172a",
        }}
      >
        <div style={{ height: 12, background: "#e5e7eb", borderRadius: 8, width: "30%", marginBottom: 12 }} />
        <div style={{ height: 18, background: "#e5e7eb", borderRadius: 8, width: "60%" }} />
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
            marginTop: 20,
          }}
        >
          {[0, 1, 2].map((key) => (
            <div
              key={key}
              style={{
                background: "linear-gradient(145deg, #ffffff, #f9fbff)",
                borderRadius: 12,
                padding: 14,
                border: "1px solid rgba(31, 60, 136, 0.08)",
              }}
            >
              <div style={{ height: 10, width: "50%", background: "#eef2ff", borderRadius: 6, marginBottom: 10 }} />
              <div style={{ height: 16, width: "80%", background: "#e5e7eb", borderRadius: 6, marginBottom: 6 }} />
              <div style={{ height: 12, width: "60%", background: "#e5e7eb", borderRadius: 6 }} />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
