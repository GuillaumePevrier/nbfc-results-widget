import { NextResponse } from "next/server";
import { DEFAULT_CLUB_ID, DOFA_HEADERS } from "@/lib/dofa";

const DOFA_BASE = "https://api-dofa.fff.fr/api";

async function proxyResultat(clubId: string) {
  const url = `${DOFA_BASE}/clubs/${clubId}/resultat`;

  try {
    const response = await fetch(url, {
      headers: DOFA_HEADERS,
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      let detail: string | undefined;
      try {
        detail = await response.text();
      } catch (error) {
        detail = (error as Error)?.message;
      }

      return NextResponse.json(
        { error: true, status: response.status, detail },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: true, status: 500, detail: (error as Error)?.message },
      { status: 500 }
    );
  }
}

export async function GET(_request: Request, { params }: { params: { clubId: string } }) {
  const clubId = params.clubId || DEFAULT_CLUB_ID;
  return proxyResultat(clubId);
}
