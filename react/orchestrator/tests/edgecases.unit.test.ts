import { it, expect } from "vitest";
import { GlueAgent } from "../agents";
import { Message } from "../schema";

it("glue ignores unrelated messages and responds to NeedRouting", async () => {
  const glue = new GlueAgent();

  const bad: Message = {
    id: crypto.randomUUID(),
    type: "SomethingElse",
    from: "Page",
    to: "Glue",
    payload: {},
    meta: { ts: Date.now() }
  };
  const out1 = await glue.handle(bad);
  expect(out1.length).toBe(0);

  const ok: Message = {
    id: crypto.randomUUID(),
    type: "NeedRouting",
    from: "Page",
    to: "Glue",
    payload: { route: "/x" },
    meta: { ts: Date.now() }
  };
  const out2 = await glue.handle(ok);
  expect(out2.length).toBe(1);
  expect(out2[0].type).toBe("RoutingDone");
  expect(out2[0].payload?.route).toBe("/x");
});
