import { render, screen, within } from "@testing-library/react";
import { expect, it } from "vitest";
import Home from "@/app/page";

it("features real work with working destinations and preserves the focused selection", () => {
  const { container } = render(<Home />);
  const work = screen.getByRole("region", { name: "Selected work" });
  expect(within(work).getAllByRole("heading", { level: 3 }).map((h) => h.textContent))
    .toEqual(["SeizeFreeze", "ORTHO Lab", "BODY//ATLAS", "Gamified BCI calibration"]);
  expect(screen.getByLabelText("Cyberpunk Reality")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Try the fracture case" }))
    .toHaveAttribute("href", "/hospitalsim/ortho/index.html");
  expect(screen.getByRole("link", { name: "Explore the interactive lab" }))
    .toHaveAttribute("href", "/seizefreeze-lab/index.html");
  expect(container.querySelector("canvas, iframe, video")).toBeNull();
  for (const image of Array.from(container.querySelectorAll("img"))) {
    expect(image.src).not.toMatch(/seizefreeze-homepage-hero|quantum-active-inference-preview/);
  }
});
