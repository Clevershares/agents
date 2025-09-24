import { describe, it, expect } from "vitest";
import { Message } from "../schema";
import { run } from "./util";

describe("Glue denies invalid route", () => {
  it("emits RoutingDenied and Page escalates PageFailed", async () => {
    const seed: Message = {
      id: crypto.randomUUID(),
      type: "NeedRouting",
      from: "Page",
      to: "Glue",
      payload: { route: "home" }, // invalid (no leading /)
      meta: { ts: Date.now() }
    };

    const trace = await run(seed);

    const denied = trace.find(m =>
      m.type === "RoutingDenied" && m.from === "Glue" && m.to === "Page"
    );
    expect(denied).toBeTruthy();

    const failed = trace.find(m =>
      m.type === "PageFailed" &&
      m.from === "Page" &&
      m.to === "Manager" &&
      m.payload?.reason === "routing-denied"
    );
    expect(failed).toBeTruthy();
  });
});
