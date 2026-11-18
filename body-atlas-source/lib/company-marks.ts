import marks from "./company-marks.json";

function companyKey(name: string) {
  return name.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

const byApplicant = new Map(marks.flatMap(mark =>
  mark.names.map(name => [companyKey(name), mark] as const),
));

export function companyMark(organization: string) {
  return byApplicant.get(companyKey(organization));
}
