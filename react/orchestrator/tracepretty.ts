import fs from "fs";
import path from "path";
import { Message } from "./schema";

const prettyFile = path.join(__dirname, "trace.pretty.log");

export function tracePretty(msg: Message) {
  const ts = new Date(msg.meta?.ts ?? Date.now()).toISOString();
  const line =
    `[${ts}] ${msg.from} → ${msg.to} :: ${msg.type}` +
    (msg.payload && Object.keys(msg.payload).length
      ? " " + JSON.stringify(msg.payload)
      : "");
  fs.appendFileSync(prettyFile, line + "\n");
}
