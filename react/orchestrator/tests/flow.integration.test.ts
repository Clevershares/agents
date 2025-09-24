import { describe, it, expect } from "vitest";
import { Message } from "../schema";
import { run } from "./util";

describe("agent flow", () => {
  it("ends with PageReady to Manager", async () => {
    const seed: Message = {
      id: crypto.randomUUID(),
      type: "Kickoff",
      from: "Manager",
      to: "Manager",
      payload: {},
      meta: { ts: Date.now() }
    };
    const trace = await run(seed);
    const ready = trace.find(m => m.type === "PageReady" && m.from === "Page" && m.to === "Manager");
    expect(ready).toBeTruthy();
    expect(ready?.payload?.page).toBe("Home");
  });
});


