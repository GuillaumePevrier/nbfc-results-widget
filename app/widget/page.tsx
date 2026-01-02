import { getClubResults } from "@/lib/dofa";
import { Widget } from "@/components/Widget";

interface WidgetPageProps {
  searchParams?: {
    clubId?: string;
    clubName?: string;
  };
}

export const revalidate = 0;

export default async function WidgetPage({ searchParams }: WidgetPageProps) {
  const clubId = searchParams?.clubId || "12345";
  const clubName = searchParams?.clubName || "Nanterre Blue FC";
  const results = await getClubResults(clubId);

  return (
    <main>
      <Widget clubName={clubName} results={results} />
    </main>
  );
}
