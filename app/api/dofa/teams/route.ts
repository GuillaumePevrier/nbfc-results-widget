import { NextResponse } from "next/server";
import { DOFA_HEADERS, mapTeamsResponse } from "@/lib/dofa";

const DOFA_BASE = "https://api-dofa.fff.fr/api";
const DEFAULT_TIMEOUT_MS = 8000;

const buildTeamsUrl = (clNo: string) => `${DOFA_BASE}/clubs/${clNo}/equipes.json?filter=`;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const clNo = searchParams.get("clNo");

  if (!clNo) {
    return NextResponse.json(
      { ok: false, status: 400, message: "Paramètre clNo manquant" },
      { status: 400 }
    );
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const url = buildTeamsUrl(clNo);
    const response = await fetch(url, {
      headers: DOFA_HEADERS,
      next: { revalidate: 60 },
      signal: controller.signal,
    });

    if (!response.ok) {
      console.error("DOFA teams error", { status: response.status, url });
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

    const raw = await response.json();
    const teams = mapTeamsResponse(raw).sort((a, b) => a.label.localeCompare(b.label));
    return NextResponse.json({ ok: true, teams }, { status: 200 });
  } catch (error) {
    console.error("DOFA teams fetch failed", error);
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
