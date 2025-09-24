import { describe, it, expect } from "vitest";
import { Agent, AgentName, Message } from "../../shared/schema";
import { ComponentAgent, GlueAgent, ManagerAgent, PageAgent } from "./agents";

const registry: Record<AgentName, Agent> = {
  Manager: new ManagerAgent(),
  Page: new PageAgent(),
  Component: new ComponentAgent(),
  Glue: new GlueAgent(),
};

async function run(seed: Message): Promise<Message[]> {
  const queue: Message[] = [seed];
  const seen: Message[] = [];
  while (queue.length) {
    const msg = queue.shift()!;
    seen.push(msg);
    const target = registry[msg.to];
    if (!target) continue;
    const out = await target.handle(msg);
    // stamp timestamps so schema stays consistent
    const stamped = out.map(x => ({ ...x, meta: { ts: Date.now(), ...(x.meta ?? {}) } }));
    queue.push(...stamped);
  }
  return seen;
}

describe("Agent flow", () => {
  it("completes a Manager → Page build and reports PageReady", async () => {
    const seed: Message = {
      id: crypto.randomUUID(),
      type: "Kickoff",
      from: "Manager",
      to: "Manager",
      payload: { goal: "scaffold home page" },
      meta: { ts: Date.now() },
    };

    const trace = await run(seed);

    const pageReady = trace.find(m => m.type === "PageReady" && m.from === "Page" && m.to === "Manager");
    expect(pageReady).toBeTruthy();
    expect(pageReady?.payload?.page).toBe("Home");

    // sanity: component and routing requests happened
    expect(trace.some(m => m.type === "BuildComponent" && m.to === "Component")).toBe(true);
    expect(trace.some(m => m.type === "NeedRouting" && m.to === "Glue")).toBe(true);
    expect(trace.some(m => m.type === "RoutingDone" && m.from === "Glue")).toBe(true);
  });
});
