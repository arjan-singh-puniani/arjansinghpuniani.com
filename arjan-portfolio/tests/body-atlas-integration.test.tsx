import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { getProject } from "@/content/projects";
import { CuratedProjectFilter } from "@/components/CuratedProjectFilter";
import { generateMetadata, generateStaticParams } from "@/app/work/[slug]/page";
import sitemap from "@/app/sitemap";

afterEach(cleanup);

describe("BODY//ATLAS portfolio integration", () => {
  it("is reachable through the case-study route, canonical metadata and sitemap", async () => {
    expect(generateStaticParams()).toContainEqual({ slug: "body-atlas" });
    const metadata = await generateMetadata({ params: Promise.resolve({ slug: "body-atlas" }) });
    expect(metadata.alternates?.canonical).toBe("/work/body-atlas");
    expect(sitemap().some(route => route.url === "https://arjansinghpuniani.com/work/body-atlas")).toBe(true);
  });

  it("is discoverable in the actual Work filter without leaking into unrelated categories", () => {
    render(<CuratedProjectFilter />);
    expect(screen.getByRole("link", { name: "BODY//ATLAS" })).toHaveAttribute("href", "/work/body-atlas");
    fireEvent.click(screen.getByRole("button", { name: "Software and Simulation" }));
    expect(screen.getByRole("link", { name: "BODY//ATLAS" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Motorsport Medicine" }));
    expect(screen.queryByRole("link", { name: "BODY//ATLAS" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Mechanism-to-Medical Center" })).toBeInTheDocument();
  });

  it("preserves the authentic scope, unreviewed status and anatomical attribution", () => {
    const project = getProject("body-atlas")!;
    const report = JSON.parse(readFileSync("public/documents/body-atlas-validation.json", "utf8"));
    expect(Object.values(report.recordCounts).reduce((sum: number, count) => sum + Number(count), 0)).toBe(2490);
    expect(report.sourceContextEntries).toBe(652);
    expect(report.independentlyAdjudicatedMappings).toBe(0);
    expect(report.precision).toBeNull();
    expect(report.explanationExpansion.explainedEntries).toBe(91);
    expect(report.dossierMilestone.explainedEntriesWithDossiers).toBe(91);
    expect(report.dossierMilestone.marketingApplicationsChecked).toBe(89);
    expect(report.dossierMilestone.currentLabelContentAndRevisionReview).toContain("91 individual source assessments");
    expect(report.dossierMilestone.affectedModelLotApplicabilityReview).toContain("patient/unit applicability not determined");
    expect(report.labelSafetyReview.entriesAssessed).toBe(91);
    expect(report.labelSafetyReview.adequateProductSpecificLabelStillMissing).toBe(3);
    expect(report.labelSafetyReview.recallSourceFieldAudits).toBe(349);
    expect(report.labelSafetyReview.completeLatestIfuCertification).toBe(false);
    expect(report.explanationExpansion.directlyAssociatedStructuresAndRegions).toBe(44);
    expect(project.status).toBe("Prototype");
    expect(project.limitations?.join(" ")).toContain("Provisional source-text contexts");
    expect(project.media?.[0].caption).toContain("Kristen Browne and Heidi Schlehlein");
    expect(project.media?.[0].caption).toContain("CC BY 4.0");
  });

  it("exposes real evidence without shipping a localhost or unverified demo link", () => {
    const project = getProject("body-atlas")!;
    for (const link of [...project.links ?? [], ...project.evidence.filter(source => source.url).map(source => ({ href: source.url! }))]) {
      const url = new URL(link.href, "https://arjansinghpuniani.com");
      expect(url.protocol).toBe("https:");
      expect(url.hostname).not.toMatch(/localhost|127\.0\.0\.1|mission-control/);
    }
    expect(project.evidence.some(source => source.url?.endsWith("P960009B.pdf"))).toBe(true);
    expect(project.links).toContainEqual({label:"Launch interactive atlas",href:"/atlas"});
    expect(sitemap().some(route=>route.url==="https://arjansinghpuniani.com/atlas")).toBe(true);
  });
});
