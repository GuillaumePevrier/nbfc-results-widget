import { NextResponse } from "next/server";
import { DOFA_HEADERS } from "@/lib/dofa";

const API_BASE = "https://api-dofa.fff.fr/api";
const DEFAULT_TIMEOUT = 10000;

const buildError = (status: number, message: string, url: string, detail?: string) =>
  NextResponse.json({ ok: false, status, message, url, detail }, { status });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cpNo = searchParams.get("cpNo");

  if (!cpNo) {
    return buildError(400, "Paramètre cpNo requis", request.url);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT);

  try {
    const targetUrl = `${API_BASE}/competitions/${encodeURIComponent(cpNo)}/classement`;
    const response = await fetch(targetUrl, {
      headers: DOFA_HEADERS,
      signal: controller.signal,
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      let detail: string | undefined;
      try {
        const body = await response.json();
        detail = (body as { detail?: string })?.detail;
      } catch (error) {
        detail = (error as Error)?.message;
      }

      console.error("DOFA ranking error", { status: response.status, detail, url: targetUrl });
      return buildError(response.status, "Classement indisponible", targetUrl, detail);
    }

    const data = await response.json();
    return NextResponse.json({ ok: true, data, url: targetUrl }, { status: 200 });
  } catch (error) {
    const message = (error as Error)?.message || "Erreur inattendue";
    console.error("DOFA ranking exception", message);
    return buildError(502, "Erreur lors de l'appel DOFA classement", request.url, message);
  } finally {
    clearTimeout(timeout);
  }
}
