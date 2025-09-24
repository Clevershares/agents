import { Agent, AgentName, Message } from "../../shared/schema";
import { ComponentAgent, GlueAgent, ManagerAgent, PageAgent } from "./agents";

const registry: Record<AgentName, Agent> = {
  Manager: new ManagerAgent(),
  Page: new PageAgent(),
  Component: new ComponentAgent(),
  Glue: new GlueAgent()
};

const log = (m: Message) =>
  console.log(`[${new Date(m.meta?.ts ?? Date.now()).toISOString()}] ${m.from} → ${m.to} :: ${m.type}`, m.payload);

async function run(seed: Message) {
  const queue: Message[] = [seed];
  while (queue.length) {
    const msg = queue.shift()!;
    log(msg);
    const target = registry[msg.to];
    if (!target) { console.warn("No agent:", msg.to); continue; }
    const out = await target.handle(msg);
    queue.push(...out.map(x => ({ ...x, meta: { ts: Date.now(), ...(x.meta ?? {}) } })));
  }
}

// demo start
run({
  id: crypto.randomUUID(),
  type: "Kickoff",
  from: "Manager",
  to: "Manager",
  payload: { goal: "scaffold home page" },
  meta: { ts: Date.now(), priority: "normal" }
});
