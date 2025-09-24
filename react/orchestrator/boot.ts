import "dotenv/config";
import { registry } from "./registry";
import { Message } from "./schema";

async function run(seed: Message) {
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

(async () => {
  const seed: Message = {
    id: crypto.randomUUID(),
    type: "Kickoff",
    from: "Manager",
    to: "Manager",
    payload: { goal: "smoke full flow" },
    meta: { ts: Date.now() }
  };
  const trace = await run(seed);
  console.log(trace.map(m => `${m.from}->${m.to}:${m.type}`).join("\n"));
})();
