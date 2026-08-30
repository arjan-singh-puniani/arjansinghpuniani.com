import type { ProjectStatus } from "@/types/content";

export const statusLabels: Record<ProjectStatus, string> = {
  Published: "PUBLISHED",
  "Completed research": "COMPLETED RESEARCH",
  "Tested educational prototype": "TESTED EDUCATIONAL PROTOTYPE",
  Prototype: "PROTOTYPE",
  "Academic systems study": "ACADEMIC SYSTEMS STUDY",
  "Course-use proposal": "COURSE-USE PROPOSAL",
  Exploratory: "EXPLORATORY",
  Proposal: "PROPOSAL",
  "Under development": "UNDER DEVELOPMENT",
  "Playground experiment": "PLAYGROUND EXPERIMENT",
};

export const statusNotes = {
  notClinicallyValidated: "NOT CLINICALLY VALIDATED",
  feedbackReceived: "FEEDBACK RECEIVED",
  notEndorsed: "NOT ENDORSED OR ADOPTED",
} as const;
