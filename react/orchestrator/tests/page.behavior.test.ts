import { it, expect } from "vitest";
import { PageAgent } from "../agents";
import { Message } from "../schema";

it("Page: on BuildPage -> 2 components, NeedRouting, PageReady", async () => {
  const page = new PageAgent();
  const req: Message = {
    id: crypto.randomUUID(),
    type: "BuildPage",
    from: "Manager",
    to: "Page",
    payload: { title: "Home", components: ["Hero","CTA","ExtraIgnored"] },
    meta: { ts: Date.now() }
  };

  const out = await page.handle(req);

  const comps = out.filter(m => m.type === "BuildComponent");
  expect(comps.length).toBe(2);                 // current behavior: only first two
  expect(comps.map(m => m.payload.name)).toEqual(["Hero","CTA"]);

  const routing = out.find(m => m.type === "NeedRouting" && m.to === "Glue");
  expect(routing?.payload?.route).toBe("/");

  const ready = out.find(m => m.type === "PageReady" && m.to === "Manager");
  expect(ready?.payload?.page).toBe("Home");
});
