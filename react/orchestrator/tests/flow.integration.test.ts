import { describe, it, expect } from "vitest";
import { Agent, AgentName, Message } from "../schema";
import { ComponentAgent, GlueAgent, ManagerAgent, PageAgent } from "../agents";
import { trace } from "../trace";
import { tracePretty } from "../tracepretty";

const registry: Record<AgentName, Agent> = {
  Manager:   new ManagerAgent(),
  Page:      new PageAgent(),
  Component: new ComponentAgent(),
  Glue:      new GlueAgent()
};

async function run(seed: Message) {
  const q: Message[] = [seed];
  const seen: Message[] = [];
  while (q.length) {
    const m = q.shift()!;
    seen.push(m);
    trace(m);
    tracePretty(m);                      // add this line
    const agent = registry[m.to];
    if (!agent) continue;
    const out = await agent.handle(m);
    q.push(...out.map(x => ({ ...x, meta: { ts: Date.now(), ...(x.meta ?? {}) } })));
  }
  return seen;
}

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


