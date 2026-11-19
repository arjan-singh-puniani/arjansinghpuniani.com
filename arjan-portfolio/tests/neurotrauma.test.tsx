import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { IncidentExplorer } from "@/app/work/motorsport-neurotrauma-toolkit/IncidentExplorer";
import { handoffFields, impactDirections, sources, stages } from "@/content/neurotrauma";

afterEach(cleanup);

describe("educational neurotrauma handoff", () => {
  it("reveals each authored stage, keeps unknowns visible, and allows revisiting the incident", () => {
    render(<IncidentExplorer/>);
    const view = document.getElementById("incident-view")!;
    expect(screen.getByRole("img", { name: /Redgrund’s Red Bull RB19 model/ })).toHaveAttribute("src", expect.stringContaining("rb19-stage.webp"));
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

  it("changes questions and physical unknowns across all directions without generating a clinical result", () => {
    render(<IncidentExplorer/>);
    const view = document.getElementById("incident-view")!;
    for (const stage of stages) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(stage.name) }));
      for (const direction of impactDirections) {
        fireEvent.click(screen.getByRole("radio", { name: direction.name }));
        expect(document.querySelector("[data-incident-car]")).toHaveAttribute("data-direction", direction.id);
        for (const question of direction.questions) expect(view).toHaveTextContent(question);
        expect(view).toHaveTextContent(direction.unknown);
        for (const unknown of stage.unknown) expect(view).toHaveTextContent(unknown);
        if (stage.name === "First report") expect(view).toHaveTextContent("the driver says their head hurts");
      }
    }
    expect(view).toHaveTextContent("Direction controls do not rewrite that record");
    expect(document.querySelectorAll('input:checked')).toHaveLength(1);
    expect(handoffFields[0].value).toContain("front-left");
  });

  it("keeps all stages available as a native text walkthrough without running an assessment", () => {
    render(<IncidentExplorer/>);
    const transcript = document.getElementById("incident-transcript")!;
    for (const stage of stages) expect(transcript).toHaveTextContent(stage.description);
    expect(document.querySelectorAll('input:not([type="radio"]), textarea, canvas, iframe')).toHaveLength(0);
    const directions = document.getElementById("direction-transcript")!;
    for (const direction of impactDirections) {
      for (const question of direction.questions) expect(directions).toHaveTextContent(question);
      expect(directions).toHaveTextContent(direction.unknown);
    }
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
