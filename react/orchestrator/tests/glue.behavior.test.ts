import { it, expect } from "vitest";
import { GlueAgent } from "../agents";
import { Message } from "../schema";

it("Glue: ignores others, responds to NeedRouting with RoutingDone", async () => {
  const glue = new GlueAgent();

  const ignore: Message = {
    id: crypto.randomUUID(), type: "BuildComponent",
    from: "Page", to: "Glue", payload: {}, meta: { ts: Date.now() }
  };
  expect(await glue.handle(ignore)).toEqual([]);

  const nr: Message = {
    id: crypto.randomUUID(), type: "NeedRouting",
    from: "Page", to: "Glue", payload: { route: "/abc" }, meta: { ts: Date.now() }
  };
  const out = await glue.handle(nr);
  expect(out.length).toBe(1);
  expect(out[0].type).toBe("RoutingDone");
  expect(out[0].payload?.route).toBe("/abc");
  expect(out[0].to).toBe("Page");
});
