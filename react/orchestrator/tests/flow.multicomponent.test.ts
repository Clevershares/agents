import { describe, it, expect } from "vitest";
import { Agent, AgentName, Message } from "../schema";
import { ComponentAgent, GlueAgent, ManagerAgent, PageAgent } from "../agents";

const registry: Record<AgentName, Agent> = {
  Manager: new ManagerAgent(),
  Page: new PageAgent(),
  Component: new ComponentAgent(),
  Glue: new GlueAgent()
};

async function run(seed: Message): Promise<Message[]> {
  const q: Message[] = [seed];
  const seen: Message[] = [];
  while (q.length) {
    const m = q.shift()!;
    seen.push(m);
    const agent = registry[m.to];
    if (!agent) continue;
    const out = await agent.handle(m);
    q.push(...out.map(x => ({ ...x, meta: { ts: Date.now(), ...(x.meta ?? {}) } })));
  }
  return seen;
}

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
