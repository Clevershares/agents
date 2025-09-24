import { it, expect } from "vitest";
import { ComponentAgent } from "../agents";
import { Message } from "../schema";

it("component BuildComponent → returns ComponentDone to Page", async () => {
  const comp = new ComponentAgent();
  const req: Message = {
    id: crypto.randomUUID(),
    type: "BuildComponent",
    from: "Page",
    to: "Component",
    payload: { name: "Foo" },
    meta: { ts: Date.now() }
  };

  const out = await comp.handle(req);
  expect(out.length).toBe(1);
  expect(out[0].type).toBe("ComponentDone");
  expect(out[0].payload?.name).toBe("Foo");
  expect(out[0].to).toBe("Page");
});
