export type Evidence = { label: string; url?: string; sourceFile?: string; verified: boolean };
export type ProjectStatus =
  | "Published"
  | "Completed research"
  | "Tested educational prototype"
  | "Prototype"
  | "Academic systems study"
  | "Course-use proposal"
  | "Exploratory"
  | "Proposal"
  | "Under development"
  | "Playground experiment";
export type Project = {
  slug: string; title: string; shortDescription: string; category: string[]; status: ProjectStatus;
  yearStart?: number; yearEnd?: number | "Present"; role: string; problem: string; approach: string[];
  results: string[]; limitations?: string[]; collaborators?: string[];
  links?: { label: string; href: string }[]; featured: boolean; evidence: Evidence[];
  media?: { src: string; alt: string; caption?: string }[];
};
export type Publication = { title: string; authors: string; venue: string; year: number; type: string; summary: string; href?: string; role?: string; evidence: Evidence[] };
export type ScienceArticle = { title: string; venue: string; publishedAt: string; summary: string; href: string };
