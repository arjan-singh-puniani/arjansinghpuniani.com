import { describe, expect, it } from "vitest";
import { assemblies, classifyAssembly, dentWeight, releaseVelocity, stepMotion } from "../public/motorcycle-mechanism-lab/mechanics.js";

describe("motorcycle assembly mechanics",() => {
  it("keeps the front wheel with the front rig despite an ambiguous source mesh name",() => {
    expect(classifyAssembly("REAR RIM.001_RIMS_0","FRONT-STEER_02/FRONT-WHEEL-DEF_09","RIMS")).toBe("front-wheel");
    expect(classifyAssembly("REAR TIRE_TIRE_0","SUS-REAR_013/REAR-WHEEL-DEF_017","TIRE")).toBe("rear-wheel");
    expect(classifyAssembly("Spiral_Honda Red_0","SHOCK TOP_026","Honda_Red")).toBe("shock");
  });

  it("preserves bodywork identities within the steering assembly",() => {
    expect(classifyAssembly("FUEL CAP.001_FENDERS_0","FRONT-STEER_02","FENDERS")).toBe("front-fender");
    expect(classifyAssembly("FUEL CAP.002_NUMBERPLATES_0","FRONT-STEER_02","NUMBERPLATES")).toBe("front-plate");
    expect(classifyAssembly("FUEL CAP.005_SEAT_0","CENTER-OF-MASS_01","SEAT")).toBe("seat");
    expect(classifyAssembly("FUEL CAP.001_FENDERS_0","CENTER-OF-MASS-ATTATCH_012","FENDERS")).toBe("rear-body");
  });

  it("defines a connected, acyclic hierarchy with one anchored frame",() => {
    expect(assemblies.filter(part => part.parent === null).map(part => part.id)).toEqual(["frame"]);
    const byId = new Map(assemblies.map(part => [part.id,part]));
    for (const part of assemblies) {
      const visited = new Set();
      for (let current = part; current; current = current.parent ? byId.get(current.parent) : null) {
        expect(visited.has(current.id)).toBe(false);
        visited.add(current.id);
        if (current.parent) expect(byId.has(current.parent)).toBe(true);
      }
      expect(visited.has("frame")).toBe(true);
    }
  });

  it("limits a local dent to its neighborhood with a smooth edge",() => {
    expect(dentWeight(0,.3)).toBe(1);
    expect(dentWeight(.15,.3)).toBeCloseTo(.5);
    expect(dentWeight(.3,.3)).toBe(0);
    expect(dentWeight(10,.3)).toBe(0);
    expect(dentWeight(0,0)).toBe(0);
    expect(dentWeight(NaN,.3)).toBe(0);
  });

  it("bounds a release gesture without converting it into a force",() => {
    const fast = releaseVelocity([100,50,0],.001);
    expect(Math.hypot(...fast)).toBeCloseTo(3);
    expect(fast[0] / fast[1]).toBeCloseTo(2);
    expect(releaseVelocity([0,0,0],0)).toEqual([0,0,0]);
    expect(releaseVelocity([NaN,0,0],1)).toEqual([0,0,0]);
  });

  it("bounds the visual motion timestep after tab suspension",() => {
    const next = stepMotion([0,1,0],[0,0,0],10);
    expect(next.velocity[1]).toBeCloseTo(-9.81 / 30);
    expect(next.position[1]).toBeCloseTo(1 - 9.81 / 900);
    expect(stepMotion([0,1,0],[0,0,0],0)).toEqual({ position: [0,1,0], velocity: [0,0,0] });
  });
});
