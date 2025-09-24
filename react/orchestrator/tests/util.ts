import { Agent, AgentName, Message } from "../schema";
import { ComponentAgent, GlueAgent, ManagerAgent, PageAgent } from "../agents";
import { tracePretty } from "../tracepretty"; // pretty log you already added
import fs from "fs";
import path from "path";

const pretty = path.join(__dirname, "..", "trace.pretty.log");
try { fs.writeFileSync(pretty, ""); } catch {}

export const registry: Record<AgentName, Agent> = {
  Manager: new ManagerAgent(),
  Page: new PageAgent(),
  Component: new ComponentAgent(),
  Glue: new GlueAgent()
};

export async function run(seed: Message): Promise<Message[]> {
  const q: Message[] = [seed];
  const seen: Message[] = [];
  while (q.length) {
    const m = q.shift()!;
    seen.push(m);
    tracePretty(m); // so failures are easy to read in trace.pretty.log
    const a = registry[m.to];
    if (!a) continue;
    const out = await a.handle(m);
    q.push(...out.map(x => ({ ...x, meta: { ts: Date.now(), ...(x.meta ?? {}) } })));
  }
  return seen;
}




