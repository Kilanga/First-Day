/**
 * Small, client-safe shapes shared by the office UI.
 *
 * These intentionally contain no assessment data, XP, or internal model
 * state. The UI only needs the colleague's name, the visible concept map,
 * and the conversation transcript.
 */
export type HireView = {
  name: string;
};

export type SkillConcept = {
  id: string;
  name: string;
  status: string;
  notebookEntry?: string;
};

export type TeachingNote = {
  summary: string;
  nextStep?: string;
};

export type ChatMessage = {
  id: string;
  role: "mentor" | "hire";
  content: string;
  feedback?: TeachingNote;
};

export type ProgressMoment = "landed" | "getting-there";
