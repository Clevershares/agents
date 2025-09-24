import { describe, it, expect } from "vitest";
import { Message } from "../schema";
import { run } from "./util";


describe("flow with extra component listed", () => {
  it("still reaches PageReady", async () => {
    const seed: Message = {
      id: crypto.randomUUID(),
      type: "Kickoff",
      from: "Manager",
      to: "Manager",
      payload: { goal: "scaffold home page" },
      meta: { ts: Date.now() }
    };
    const trace = await run(seed);
    const ready = trace.find(m => m.type === "PageReady" && m.to === "Manager");
    expect(ready).toBeTruthy();

    // current PageAgent behavior: only first two components used
    const buildComps = trace.filter(m => m.type === "BuildComponent");
    expect(buildComps.length).toBe(2);
  });
});
