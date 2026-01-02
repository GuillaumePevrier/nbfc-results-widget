import Link from "next/link";
import type { CSSProperties } from "react";

import { DEFAULT_CLUB_ID } from "@/lib/dofa";

const cardStyle: CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  padding: "18px",
  boxShadow: "0 12px 30px rgba(0,0,0,0.08)",
  marginBottom: "16px",
  border: "1px solid #e5e7eb",
};

const buttonStyle: CSSProperties = {
  padding: "10px 14px",
  borderRadius: "10px",
  border: "none",
  background: "#2563eb",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
};

export const revalidate = 0;

export default function ToolsPage() {
  const defaultClub = DEFAULT_CLUB_ID;

  return (
    <main style={{ padding: "24px", maxWidth: 900, margin: "0 auto", color: "#0f172a" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 800, marginBottom: 8 }}>Centre de test DOFA</h1>
      <p style={{ color: "#6b7280", marginBottom: 20 }}>
        Utilisez ces boutons pour appeler les routes internes (proxy) et vérifier les réponses DOFA
        avec le club par défaut {defaultClub}. Modifiez les paramètres dans l&apos;URL si besoin.
      </p>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Résultats</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={`/api/dofa/results?clNo=${defaultClub}`} style={buttonStyle} prefetch={false}>
            Résultats club
          </Link>
          <Link
            href={`/api/dofa/results?clNo=${defaultClub}&cpNo=`}
            style={{ ...buttonStyle, background: "#0ea5e9" }}
            prefetch={false}
          >
            Résultats (ajoutez cpNo)
          </Link>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Calendrier & équipes</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={`/api/dofa/club/${defaultClub}/calendrier`} style={buttonStyle} prefetch={false}>
            Calendrier brut
          </Link>
          <Link href={`/api/dofa/teams?clNo=${defaultClub}`} style={buttonStyle} prefetch={false}>
            Équipes club
          </Link>
          <Link href={`/api/dofa/club/${defaultClub}/equipes`} style={buttonStyle} prefetch={false}>
            Équipes (proxy direct)
          </Link>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Classement</h2>
        <p style={{ color: "#6b7280", marginTop: 0 }}>
          Fournissez un cpNo directement dans l&apos;URL (exemple: &cpNo=XXXX). Si vous connaissez une
          compétition, modifiez le lien ci-dessous.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link
            href={`/api/dofa/ranking?cpNo=`}
            style={{ ...buttonStyle, background: "#16a34a" }}
            prefetch={false}
          >
            Classement (ajoutez cpNo)
          </Link>
        </div>
      </div>

      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Informations club</h2>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href={`/api/dofa/club/${defaultClub}`} style={buttonStyle} prefetch={false}>
            Fiche club
          </Link>
          <Link href={`/widget?club=${defaultClub}`} style={{ ...buttonStyle, background: "#f97316" }} prefetch={false}>
            Ouvrir le widget
          </Link>
        </div>
      </div>
    </main>
  );
}
