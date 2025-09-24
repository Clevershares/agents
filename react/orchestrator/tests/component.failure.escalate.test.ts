import { describe, it, expect } from "vitest";
import { Agent, AgentName, Message } from "../schema";
import { ComponentAgent, GlueAgent, ManagerAgent, PageAgent } from "../agents";
import { FileAgent } from "../agents/fileagent";

const registry: Record<AgentName, Agent> = {
  Manager: new ManagerAgent(),
  Page: new PageAgent(),
  Component: new ComponentAgent(),
  Glue: new GlueAgent(),
  File: new FileAgent(),
};

// Custom runner that *injects* a second failure after the Page retries
async function runWithInjectedSecondFailure(seed: Message) {
  const q: Message[] = [seed];
  const seen: Message[] = [];
  let injected = false;

  while (q.length) {
    const m = q.shift()!;
    seen.push(m);

    // When Page issues the retry BuildComponent, immediately inject another failure
    if (
      !injected &&
      m.type === "BuildComponent" &&
      m.from === "Page" &&
      m.to === "Component" &&
      m.payload?.name === "Card"
    ) {
      injected = true;
      // simulate: the retried build also fails
      q.unshift({
        id: crypto.randomUUID(),
        type: "ComponentFailed",
        from: "Component",
        to: "Page",
        payload: { name: "Card" },
        meta: { ts: Date.now() }
      });
    }

    const a = registry[m.to];
    if (!a) continue;
    const out = await a.handle(m);
    q.push(...out.map(x => ({ ...x, meta: { ts: Date.now(), ...(x.meta ?? {}) } })));
  }
  return seen;
}

describe("Component failure -> retry exhausted -> PageFailed", () => {
  it("after a second failure, Page escalates PageFailed(component-failed) to Manager", async () => {
    // Start with a first failure (we simulate it directly)
    const seed: Message = {
      id: crypto.randomUUID(),
      type: "ComponentFailed",
      from: "Component",
      to: "Page",
      payload: { name: "Card" },
      meta: { ts: Date.now() }
    };

    const trace = await runWithInjectedSecondFailure(seed);

    // Page should have retried once
    const retry = trace.find(m =>
      m.type === "BuildComponent" &&
      m.from === "Page" &&
      m.to === "Component" &&
      m.payload?.name === "Card"
    );
    expect(retry, "Retry BuildComponent not found").toBeTruthy();

    // After injected second failure, Page escalates PageFailed
    const escalated = trace.find(m =>
      m.type === "PageFailed" &&
      m.from === "Page" &&
      m.to === "Manager" &&
      m.payload?.reason === "component-failed" &&
      m.payload?.name === "Card"
    );
    expect(escalated, "PageFailed(component-failed) not found").toBeTruthy();
  });
});
