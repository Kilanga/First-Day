const MENTOR_ID_KEY = "first-day-mentor-id";

export function clearLocalMentorId() {
  localStorage.removeItem(MENTOR_ID_KEY);
}

export function localMentorId() {
  const existing = localStorage.getItem(MENTOR_ID_KEY);
  if (existing) return existing;
  const mentorId = crypto.randomUUID();
  localStorage.setItem(MENTOR_ID_KEY, mentorId);
  return mentorId;
}

export async function ensureMentorSession() {
  const response = await fetch("/api/mentor/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mentorId: localMentorId() }),
  });
  if (!response.ok) throw new Error("Unable to open your private onboarding desk.");
}
