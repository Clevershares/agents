export type AgentName = string;

export type Message<TAgent extends string = string> = {
  id: string;
  type: string;
  from: TAgent;
  to: TAgent;
  payload: any;
  meta?: { ts?: number };
};

export interface Agent<TAgent extends string = string> {
  name: TAgent;
  handle(msg: Message<TAgent>): Promise<Message<TAgent>[]>;
}
