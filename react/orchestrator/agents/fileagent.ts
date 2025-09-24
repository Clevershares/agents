import fs from "fs";
import path from "path";
import { Agent, AgentName, Message } from "../schema";

type Edit =
  | { kind: "write"; path: string; content: string }
  | { kind: "replace"; path: string; search: string; replace: string }
  | { kind: "insertAfter"; path: string; anchor: string; content: string };

const ROOT = process.env.WORKSPACE_ROOT
  ? path.resolve(process.env.WORKSPACE_ROOT)
  : path.resolve(process.cwd()); // fallback

function safeJoin(p: string) {
  const abs = path.resolve(ROOT, p);
  if (!abs.startsWith(ROOT)) throw new Error("Path escapes WORKSPACE_ROOT");
  return abs;
}

export class FileAgent implements Agent {
  name: AgentName = "File";

  async handle(msg: Message): Promise<Message[]> {
    if (msg.type !== "ApplyEdits") return [];
    const edits = (msg.payload?.edits as Edit[]) ?? [];
    const dry = !!msg.payload?.dryRun;

    const results: any[] = [];

    for (const e of edits) {
      const file = safeJoin(e.path);

      if (e.kind === "write") {
        if (!dry) fs.writeFileSync(file, e.content, "utf8");
        results.push({ path: e.path, kind: e.kind, ok: true });
      } else if (e.kind === "replace") {
        const src = fs.readFileSync(file, "utf8");
        const next = src.split(e.search).join(e.replace);
        if (!dry) fs.writeFileSync(file, next, "utf8");
        results.push({ path: e.path, kind: e.kind, ok: true });
      } else if (e.kind === "insertAfter") {
        const src = fs.readFileSync(file, "utf8");
        const idx = src.indexOf(e.anchor);
        if (idx < 0) { results.push({ path: e.path, kind: e.kind, ok: false, reason: "anchor-not-found" }); continue; }
        const at = idx + e.anchor.length;
        const next = src.slice(0, at) + e.content + src.slice(at);
        if (!dry) fs.writeFileSync(file, next, "utf8");
        results.push({ path: e.path, kind: e.kind, ok: true });
      }
    }

    return [{
      id: crypto.randomUUID(),
      type: "EditsApplied",
      from: "File",
      to: msg.from as AgentName,
      payload: { dryRun: dry, results },
      meta: { ts: Date.now() }
    }];
  }
}
