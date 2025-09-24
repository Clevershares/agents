import { Agent } from "./schema";
import { ManagerAgent, PageAgent, GlueAgent, ComponentAgent } from "./agents";
import { FileAgent } from "./agents/fileagent";

export const registry: Record<string, Agent> = {
  Manager: new ManagerAgent(),
  Page: new PageAgent(),
  Component: new ComponentAgent(),  // provider-agnostic import
  Glue: new GlueAgent(),
  File: new FileAgent(),
};
