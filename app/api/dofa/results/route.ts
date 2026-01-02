import { NextResponse } from "next/server";
import { DOFA_HEADERS } from "@/lib/dofa";

const DOFA_BASE = "https://api-dofa.fff.fr/api";
const DEFAULT_TIMEOUT_MS = 8000;

const buildDofaUrl = (clNo: string, cpNo?: string) => {
  const search = cpNo ? `?competition.cp_no=${encodeURIComponent(cpNo)}` : "";
  return `${DOFA_BASE}/clubs/${clNo}/resultat${search}`;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clNo = searchParams.get("clNo");
  const cpNo = searchParams.get("cpNo") || undefined;

  if (!clNo) {
    return NextResponse.json(
      { ok: false, status: 400, message: "Paramètre clNo manquant" },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const url = buildDofaUrl(clNo, cpNo);
    const response = await fetch(url, {
      headers: DOFA_HEADERS,
      next: { revalidate: 60 },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("DOFA results error", { status: response.status, url });
      let message: string | undefined;
      try {
        const body = await response.text();
        message = body || undefined;
      } catch (error) {
        message = (error as Error)?.message;
      }

      return NextResponse.json(
        { ok: false, status: response.status, message: message || "Erreur DOFA", url },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ ok: true, data }, { status: 200 });
  } catch (error) {
    console.error("DOFA results fetch failed", error);
    return NextResponse.json(
      {
        ok: false,
        status: 502,
        message: "Erreur lors de l'appel DOFA",
        detail: (error as Error)?.message,
      },
      { status: 502 }
    );
  } finally {
    clearTimeout(timer);
  }
}
