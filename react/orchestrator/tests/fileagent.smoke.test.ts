import { it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { FileAgent } from "../agents/fileagent";
import { Message } from "../schema";

it("FileAgent writes a temp file", async () => {
  const fa = new FileAgent();
  const tmp = path.join(__dirname, "tmp.txt");

  const msg: Message = {
    id: crypto.randomUUID(),
    type: "ApplyEdits",
    from: "Page",
    to: "File",
    payload: { dryRun: false, edits: [{ kind: "write", path: `orchestrator/tests/tmp.txt`, content: "hello" }] },
    meta: { ts: Date.now() }
  };

  const out = await fa.handle(msg);
  expect(out[0].type).toBe("EditsApplied");
  expect(fs.readFileSync(tmp, "utf8")).toBe("hello");
  fs.unlinkSync(tmp);
});
