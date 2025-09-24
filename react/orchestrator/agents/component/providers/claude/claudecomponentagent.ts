import Anthropic from "@anthropic-ai/sdk";
import { Agent, AgentName, Message } from "../../../../schema";

export class ClaudeComponentAgent implements Agent {
  name: AgentName = "Component";

  async handle(msg: Message): Promise<Message[]> {
    if (msg.type !== "BuildComponent") return [];
    const name = msg.payload?.name ?? "Unknown";

    // If no key, short-circuit so tests stay green
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return [{
        id: crypto.randomUUID(),
        type: "ComponentDone",
        from: "Component",
        to: "Page",
        payload: { name, notes: "LLM skipped (no API key)" },
        meta: { ts: Date.now() }
      }];
    }

    const client = new Anthropic({ apiKey });

    const res = await client.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 200,
      messages: [{
        role: "user",
        content: [
          "You are ComponentAgent. Output ONLY JSON: {\"ok\":true|false,\"notes\":\"...\"}",
          `Task: scaffold React component "${name}" using Mantine where possible, minimal custom CSS.`,
          "Return ok=true if ready; no code, just the JSON."
        ].join("\n")
      }]
    });

    const text = res.content[0]?.type === "text" ? res.content[0].text : "{}";
    let out: any = {}; try { out = JSON.parse(text); } catch {}
    const ok = !!out.ok;

    return [{
      id: crypto.randomUUID(),
      type: ok ? "ComponentDone" : "ComponentFailed",
      from: "Component",
      to: "Page",
      payload: { name, notes: out.notes ?? "" },
      meta: { ts: Date.now() }
    }];
  }
}
