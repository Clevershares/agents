import { Message as BaseMessage, Agent as BaseAgent } from "../../shared/schema";

export type AgentName = "Manager" | "Page" | "Component" | "Glue";
export type Message   = BaseMessage<AgentName>;
export type Agent     = BaseAgent<AgentName>;
