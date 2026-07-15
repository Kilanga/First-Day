import TrialView from "@/components/TrialView";

export default async function TrialPage({ searchParams }: { searchParams: Promise<{ subjectId?: string }> }) { const query = await searchParams; return <TrialView subjectId={query.subjectId} />; }
