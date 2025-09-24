// react/orchestrator/tests/component.failure.retry.test.ts
import { describe, it, expect } from "vitest";
import { Agent, AgentName, Message } from "../schema";
import { ComponentAgent, GlueAgent, ManagerAgent, PageAgent } from "../agents";

const registry: Record<AgentName, Agent> = {
  Manager: new ManagerAgent(),
  Page: new PageAgent(),
  Component: new ComponentAgent(),
  Glue: new GlueAgent(),
};

async function run(seed: Message) {
  const q: Message[] = [seed];
  const seen: Message[] = [];
  while (q.length) {
    const m = q.shift()!;
    seen.push(m);
    const a = registry[m.to];
    if (!a) continue;
    const out = await a.handle(m);
    q.push(...out.map(x => ({ ...x, meta: { ts: Date.now(), ...(x.meta ?? {}) } })));
  }
  return seen;
}

describe("Component failure -> retry -> recovery", () => {
  it("retries once and emits ComponentRecovered", async () => {
    const seed: Message = {
      id: crypto.randomUUID(),
      type: "BuildComponent",
      from: "Page",
      to: "Component",
      payload: { name: "Card", fail: true }, // force first attempt to fail
      meta: { ts: Date.now() },
    };

    const trace = await run(seed);

    // 1) initial failure appears
    const failedIdx = trace.findIndex(
      m => m.type === "ComponentFailed" && m.from === "Component" && m.to === "Page" && m.payload?.name === "Card"
    );
    expect(failedIdx, "ComponentFailed not found").toBeGreaterThan(-1);

    // 2) Page retries AFTER the failure (this skips the seed message)
    const retry = trace.slice(failedIdx + 1).find(
      m => m.type === "BuildComponent" && m.from === "Page" && m.to === "Component" && m.payload?.name === "Card"
    );
    expect(retry, "Retry BuildComponent not found").toBeTruthy();
    expect(retry?.payload?.fail, "Retry should not carry fail flag").toBeUndefined();

    // 3) Component completes after retry
    const done = trace.slice(failedIdx + 1).find(
      m => m.type === "ComponentDone" && m.from === "Component" && m.to === "Page" && m.payload?.name === "Card"
    );
    expect(done, "ComponentDone after retry not found").toBeTruthy();

    // 4) Page notifies Manager of recovery
    const recovered = trace.slice(failedIdx + 1).find(
      m => m.type === "ComponentRecovered" && m.from === "Page" && m.to === "Manager" && m.payload?.name === "Card"
    );
    expect(recovered, "ComponentRecovered not found").toBeTruthy();
  });
});
