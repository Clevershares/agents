import "dotenv/config";
import { registry } from "./orchestrator/registry";
import { Message } from "./orchestrator/schema";

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

function msg(type: string, from: string, to: string, payload: any = {}): Message {
  return { id: crypto.randomUUID(), type, from: from as any, to: to as any, payload, meta: { ts: Date.now() } };
}

// top stays the same (dotenv, registry, run(), msg())

(async () => {
  const [cmd, ...rest] = process.argv.slice(2);

  if (cmd === "kick") {
    const goal = rest.join(" ") || "manual run";
    const trace = await run(msg("Kickoff", "Manager", "Manager", { goal }));
    console.log(trace.map(m => `${m.from} -> ${m.to} :: ${m.type} ${JSON.stringify(m.payload)}`).join("\n"));
    return;
  }

  if (cmd === "component") {
    const name = rest.join(" ") || "Card";
    const trace = await run(msg("BuildComponent", "Page", "Component", { name }));
    console.log(trace.map(m => `${m.from} -> ${m.to} :: ${m.type} ${JSON.stringify(m.payload)}`).join("\n"));
    return;
  }

  console.log("Usage:");
  console.log('  npm run cli:kick -- "build Home page with Hero and CTA"');
  console.log('  npm run cli:component -- "Card"');
})();
