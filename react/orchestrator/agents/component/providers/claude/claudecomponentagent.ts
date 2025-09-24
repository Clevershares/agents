import Anthropic from "anthropic";
import { Agent, AgentName, Message } from "../../../../schema";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

export class ClaudeComponentAgent implements Agent {
  name: AgentName = "Component";

  async handle(msg: Message): Promise<Message[]> {
    if (msg.type !== "BuildComponent") return [];
    const name = msg.payload?.name ?? "Unknown";

    const prompt = [
      "You are ComponentAgent. Output ONLY JSON: {\"ok\":true|false,\"notes\":\"...\"}",
      `Task: scaffold React component "${name}" using Mantine where possible, minimal custom CSS.`,
      "Return ok=true if ready; no code, just the JSON."
    ].join("\n");

    const res = await client.messages.create({
      model: "claude-3-5-sonnet-latest",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }]
    });

    const text = res.content[0]?.type === "text" ? res.content[0].text : "{}";
    let out: any = {};
    try { out = JSON.parse(text); } catch {}
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
