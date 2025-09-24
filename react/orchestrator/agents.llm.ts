// react/orchestrator/agents.llm.ts
import { Agent, AgentName, Message } from "./schema";
export class ComponentAgentLLM implements Agent {
  name: AgentName = "Component";
  async handle(msg: Message): Promise<Message[]> {
    if (msg.type !== "BuildComponent") return [];
    // call LLM here (with strict prompt), parse, and return Messages[] shaped like today
    return [
      { id: crypto.randomUUID(), type: "ComponentDone", from: "Component", to: "Page",
        payload: { name: msg.payload.name }, meta: { ts: Date.now() } }
    ];
  }
}
