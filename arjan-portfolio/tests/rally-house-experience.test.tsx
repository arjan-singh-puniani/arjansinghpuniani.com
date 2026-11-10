import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RallyHouseExperience from "@/app/playground/rally-house/RallyHouseExperience";

beforeEach(() => { Element.prototype.scrollIntoView = vi.fn(); vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: false }))); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });
describe("Rally House experience", () => {
  it("defers the game until intent and preserves a direct alternative", () => {
    const { container } = render(<RallyHouseExperience />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("link", { name: "Open in a new tab ↗" })).toHaveAttribute("href", "/rally-house/index.html");
    fireEvent.click(screen.getByRole("link", { name: "Play Rally House ↗" }));
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(screen.getByTitle("Play Rally House")).toHaveAttribute("aria-describedby", "rally-house-controls");
    fireEvent.load(screen.getByTitle("Play Rally House"));
    expect(screen.queryByText("Opening the club…")).not.toBeInTheDocument();
  });
  it.each(["Play Rally House ↗", "Enter the club ↗"])("keeps %s as native full-page navigation on touch devices", (name) => {
    vi.stubGlobal("matchMedia", vi.fn(() => ({ matches: true })));
    const { container } = render(<RallyHouseExperience />);
    const link = screen.getByRole("link", { name });
    expect(link).toHaveAttribute("href", "/rally-house/index.html");
    // Observe React's decision, then suppress jsdom's unsupported navigation.
    let intercepted = true;
    document.addEventListener("click", event => { intercepted = event.defaultPrevented; event.preventDefault(); }, { once: true });
    fireEvent.click(link);
    expect(intercepted).toBe(false);
    expect(container.querySelector("iframe")).toBeNull();
  });
  it("shows the complete four-step guide without hiding instructions behind tabs", () => {
    render(<RallyHouseExperience />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("The Sims meets Mario Tennis.");
    expect(screen.getAllByRole("heading", { level: 3 }).map(h => h.textContent)).toEqual([
      "Play tennis immediately.", "Championship mode.", "Replay your last shot.", "Analyze your swing like a pro.",
    ]);
    expect(screen.getAllByTestId("screen-callout")).toHaveLength(3);
    for (const box of screen.getAllByTestId("screen-callout")) expect(box).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByAltText(/Isometric club view/)).toBeInTheDocument();
    expect(screen.getByAltText(/registered body rig/)).toBeInTheDocument();
    expect(screen.queryByLabelText("Gameplay scenes")).not.toBeInTheDocument();
  });
  it("explains fullscreen rejection while keeping play available", async () => {
    render(<RallyHouseExperience />);
    fireEvent.click(screen.getByRole("link", { name: "Enter the club ↗" }));
    fireEvent.click(screen.getByRole("button", { name: "Enter fullscreen ↗" }));
    await waitFor(() => expect(screen.getByText(/Fullscreen is unavailable here/)).toBeInTheDocument());
    expect(screen.getByTitle("Play Rally House")).toBeInTheDocument();
  });
});
