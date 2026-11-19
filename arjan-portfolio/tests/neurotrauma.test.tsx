import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IncidentExplorer } from "@/app/work/motorsport-neurotrauma-toolkit/IncidentExplorer";
import { handoffFields, sources, stages } from "@/content/neurotrauma";

afterEach(cleanup);

describe("educational neurotrauma handoff", () => {
  it("reveals each authored stage, keeps unknowns visible, and allows revisiting the incident", () => {
    render(<IncidentExplorer/>);
    const view = document.getElementById("incident-view")!;
    for (const stage of stages) {
      const control = screen.getByRole("button", { name: new RegExp(stage.name) });
      fireEvent.click(control);
      expect(control).toHaveAttribute("aria-pressed", "true");
      expect(view).toHaveTextContent(stage.title);
      for (const unknown of stage.unknown) expect(view).toHaveTextContent(unknown);
      expect(screen.getAllByRole("button").filter(button => button.getAttribute("aria-pressed") === "true")).toHaveLength(1);
    }
    expect(screen.getByRole("link", { name: "Inspect the fictional handoff" })).toHaveAttribute("href", "#handoff");
    fireEvent.click(screen.getByRole("button", { name: /Impact/ }));
    expect(view).toHaveTextContent(stages[0].title);
    expect(screen.queryByRole("link", { name: "Inspect the fictional handoff" })).not.toBeInTheDocument();
  });

  it("keeps all stages available as a native text walkthrough without running an assessment", () => {
    render(<IncidentExplorer/>);
    const transcript = document.getElementById("incident-transcript")!;
    for (const stage of stages) expect(transcript).toHaveTextContent(stage.description);
    expect(document.querySelectorAll("input, textarea, canvas, iframe")).toHaveLength(0);
  });

  it("connects every handoff rationale and incident stage to a complete source record", () => {
    for (const item of [...stages.map(s => s.source), ...handoffFields.map(f => f.citation)]) {
      const source = sources[item];
      expect(new URL(source.url).protocol).toBe("https:");
      for (const field of ["claim", "date", "locator", "supports", "limits", "where"] as const) expect(source[field].length).toBeGreaterThan(15);
    }
    expect(handoffFields.map(field => field.value).join(" ")).toContain("not confirmed");
    expect(handoffFields.map(field => field.value).join(" ")).toContain("not documented");
  });
});
