import { GET } from "../app/pilot/records.json/route";
import { families } from "../lib/atlas";
import { companyMark } from "../lib/company-marks";
import { primaryRecords } from "../lib/intervention-view";
import type { BriefCase } from "../app/pilot/BriefBuilder";

async function main() {
  const applications = Object.values(await GET().json() as Record<string, BriefCase>);
  const gaps = new Map<string, { applications: string[]; interventions: string[] }>();
  const gap = (name: string) => {
    const entry = gaps.get(name) ?? { applications: [], interventions: [] };
    gaps.set(name, entry);
    return entry;
  };
  const coveredApplications = applications.filter(record => {
    const name = record.applicant ?? "(no named applicant)";
    if (companyMark(name)) return true;
    gap(name).applications.push(record.application);
    return false;
  });
  const coveredInterventions = families.filter(family => {
    const names = [...new Set(primaryRecords(family).flatMap(record => {
      const name = family.regulatoryIds.length ? record.applicant : record.sponsor;
      return name ? [name] : [];
    }))];
    if (names.some(companyMark)) return true;
    for (const name of names) gap(name).interventions.push(family.id);
    return false;
  });
  console.error(`${coveredApplications.length}/${applications.length} FDA applications; ${coveredInterventions.length}/${families.length} interventions`);
  console.log(JSON.stringify(
    [...gaps].sort(([, a], [, b]) => b.applications.length - a.applications.length || b.interventions.length - a.interventions.length)
      .map(([name, records]) => ({ name, ...records })),
    null, 2,
  ));
}

void main();
