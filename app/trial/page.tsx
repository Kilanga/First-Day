import TrialView from "@/components/TrialView";

export default function TrialPage({ searchParams }: { searchParams?: { mentorId?: string; subjectId?: string } }) { return <TrialView mentorId={searchParams?.mentorId} subjectId={searchParams?.subjectId} />; }
