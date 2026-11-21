export const pilotDraftKey = 'body-atlas-pilot-draft-v1';
export type PilotNotes = Record<string, { finding: string; gap: string }>;
export type PilotDraft = {
  version: 1;
  first: string;
  second: string;
  question: string;
  applications: string[];
  notes: PilotNotes;
  supplements: Record<string, string>;
};

const application = /^(?:P|K|DEN)\d{6}$/;
const object = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const text = (value: unknown, length: number): value is string => typeof value === 'string' && value.length <= length;

// Store user work and identifiers only; source claims and verification must come from the current archive.
export function readPilotDraft(raw: string): PilotDraft | null {
  if (raw.length > 1_000_000) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (!object(value) || value.version !== 1 || !text(value.first, 9) || !text(value.second, 9) ||
        ![value.first, value.second].every(id => !id || application.test(id)) ||
        (value.first && value.first === value.second) || !text(value.question, 240) ||
        !Array.isArray(value.applications) || value.applications.length > 100 ||
        !value.applications.every(id => typeof id === 'string' && application.test(id)) ||
        !object(value.notes) || Object.keys(value.notes).length > 100 ||
        !object(value.supplements) || Object.keys(value.supplements).length > 100) return null;
    const notes: PilotNotes = {}, supplements: Record<string, string> = {};
    for (const [pair, note] of Object.entries(value.notes)) {
      const ids = pair.split('/');
      if (ids.length !== 2 || ids[0] === ids[1] || !ids.every(id => application.test(id)) ||
          ids.toSorted().join('/') !== pair || !object(note) || !text(note.finding, 800) || !text(note.gap, 800)) return null;
      notes[pair] = { finding: note.finding, gap: note.gap };
    }
    for (const [id, supplement] of Object.entries(value.supplements)) {
      if (!/^P\d{6}$/.test(id) || typeof supplement !== 'string' || !/^S\d{3,4}$/.test(supplement)) return null;
      supplements[id] = supplement;
    }
    return {
      version: 1, first: value.first, second: value.second, question: value.question,
      applications: [...new Set(value.applications)], notes, supplements,
    };
  } catch { return null; }
}
