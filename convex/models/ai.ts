import { Agent } from "@convex-dev/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { components } from "../_generated/api";

const openrouter = createOpenRouter({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

export const agent = new Agent(components.agent, {
  name: "My Agent",
  //@ts-ignore
  chat: openrouter("@preset/p2chat"),
});
