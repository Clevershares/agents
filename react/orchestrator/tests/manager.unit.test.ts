import { it, expect } from "vitest";
import { ManagerAgent } from "../agents";
import { Message } from "../schema";

it("manager Kickoff → emits BuildPage to Page", async () => {
  const mgr = new ManagerAgent();
  const seed: Message = {
    id: crypto.randomUUID(),
    type: "Kickoff",
    from: "Manager",
    to: "Manager",
    payload: { goal: "scaffold home page" },
    meta: { ts: Date.now() }
  };

  const out = await mgr.handle(seed);
  expect(out.length).toBeGreaterThan(0);
  const bp = out.find(m => m.type === "BuildPage" && m.to === "Page");
  expect(bp).toBeTruthy();
  expect(bp?.payload?.title).toBe("Home");
});
