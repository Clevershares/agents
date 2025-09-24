import fs from "fs";
import path from "path";
import { Message } from "./schema";

const logFile = path.join(__dirname, "trace.log");

export function trace(msg: Message) {
  const line = JSON.stringify({
    ts: new Date(msg.meta?.ts ?? Date.now()).toISOString(),
    from: msg.from,
    to: msg.to,
    type: msg.type,
    payload: msg.payload
  });
  fs.appendFileSync(logFile, line + "\n");
}
