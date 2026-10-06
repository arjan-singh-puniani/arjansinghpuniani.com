import React from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import RallyHouseExperience from "@/app/playground/rally-house/RallyHouseExperience";

beforeEach(() => { Element.prototype.scrollIntoView = vi.fn(); });
afterEach(cleanup);
describe("Rally House experience", () => {
  it("defers the game until intent and preserves a direct alternative", () => {
    const { container } = render(<RallyHouseExperience />);
    expect(container.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("link", { name: "Open in a new tab ↗" })).toHaveAttribute("href", "/rally-house/index.html");
    fireEvent.click(screen.getByRole("button", { name: "Play Rally House ↗" }));
    expect(container.querySelectorAll("iframe")).toHaveLength(1);
    expect(screen.getByTitle("Play Rally House")).toHaveAttribute("aria-describedby", "rally-house-controls");
    fireEvent.load(screen.getByTitle("Play Rally House"));
    expect(screen.queryByText("Opening the club…")).not.toBeInTheDocument();
  });
  it("makes every scene selectable without an automatic carousel", () => {
    render(<RallyHouseExperience />);
    for (const name of ["Challenge", "Rally", "Wander"]) {
      const button = within(screen.getByLabelText("Gameplay scenes")).getByRole("button", { name: new RegExp(name) });
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-pressed", "true");
    }
    expect(screen.getByLabelText("Continuous Rally House gameplay capture")).not.toHaveAttribute("autoplay");
  });
  it("explains fullscreen rejection while keeping play available", async () => {
    render(<RallyHouseExperience />);
    fireEvent.click(screen.getByRole("button", { name: "Enter the club ↗" }));
    fireEvent.click(screen.getByRole("button", { name: "Enter fullscreen ↗" }));
    await waitFor(() => expect(screen.getByText(/Fullscreen is unavailable here/)).toBeInTheDocument());
    expect(screen.getByTitle("Play Rally House")).toBeInTheDocument();
  });
});
