import { Agent, AgentName, Message } from "./schema";

const mk = (p: Partial<Message>): Message => ({
  id: crypto.randomUUID(),
  type: p.type ?? "Unknown",
  from: p.from as AgentName,
  to: p.to as AgentName,
  payload: p.payload ?? {},
  meta: { ts: Date.now(), ...(p.meta ?? {}) }
});

export class ManagerAgent implements Agent {
  name: AgentName = "Manager";
  async handle(msg: Message) {
    if (msg.type === "Kickoff") {
      return [
        mk({
          type: "BuildPage",
          from: "Manager",
          to: "Page",
          payload: { title: "Home", components: ["Hero", "CTA"] }
        })
      ];
    }
    if (msg.type === "PageFailed" || msg.type === "ComponentRecovered") return [];
    return [];
  }
}

export class PageAgent implements Agent {
  name: AgentName = "Page";

  private retries: Record<string, number> = {};
  private failedOnce: Set<string> = new Set();

  async handle(msg: Message) {
    if (msg.type === "BuildPage") {
      return [
        mk({ type: "BuildComponent", from: "Page", to: "Component", payload: { name: "Hero" } }),
        mk({ type: "BuildComponent", from: "Page", to: "Component", payload: { name: "CTA" } }),
        mk({ type: "NeedRouting", from: "Page", to: "Glue", payload: { route: "/" } }),
        mk({ type: "PageReady", from: "Page", to: "Manager", payload: { page: msg.payload.title } })
      ];
    }

    if (msg.type === "ComponentFailed") {
      const name = msg.payload?.name as string;
      const count = this.retries[name] ?? 0;
      this.failedOnce.add(name);
      if (count < 1) {
        this.retries[name] = count + 1;
        // retry once; do NOT forward any fail flag
        return [mk({ type: "BuildComponent", from: "Page", to: "Component", payload: { name } })];
      }
      return [mk({ type: "PageFailed", from: "Page", to: "Manager", payload: { reason: "component-failed", name } })];
    }

    if (msg.type === "ComponentDone") {
      const name = msg.payload?.name as string;
      if (this.failedOnce.has(name)) {
        this.failedOnce.delete(name);
        return [mk({ type: "ComponentRecovered", from: "Page", to: "Manager", payload: { name } })];
      }
      return [];
    }

  if (msg.type === "RoutingDenied") {
  return [mk({
    type: "PageFailed",
    from: "Page",
    to: "Manager",
    payload: { reason: "routing-denied", route: msg.payload?.route }
  })];
}


    return [];
  }
}

export class ComponentAgent implements Agent {
  name: AgentName = "Component";
  async handle(msg: Message) {
    if (msg.type !== "BuildComponent") return [];
    if (msg.payload?.fail) {
      return [mk({ type: "ComponentFailed", from: "Component", to: "Page", payload: { name: msg.payload.name } })];
    }
    return [mk({ type: "ComponentDone", from: "Component", to: "Page", payload: { name: msg.payload.name } })];
  }
}

export class GlueAgent implements Agent {
  name: AgentName = "Glue";
  async handle(msg: Message) {
    if (msg.type !== "NeedRouting") return [];
    const route = String(msg.payload?.route ?? "");
    if (!route.startsWith("/")) {
      return [mk({ type: "RoutingDenied", from: "Glue", to: "Page", payload: { route, reason: "must-start-with-slash" } })];
    }
    return [mk({ type: "RoutingDone", from: "Glue", to: "Page", payload: { route } })];
  }
}
