import { Agent } from "@convex-dev/agent";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { v } from "convex/values";
import { components } from "./_generated/api";
import { internalAction } from "./_generated/server";

const openrouter = createOpenRouter({
  apiKey: process.env.OPEN_ROUTER_API_KEY,
});

const agent = new Agent(components.agent, {
  name: "My Agent",
  chat: openrouter("@preset/p2chat"),
});

export const internalChat = internalAction({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    const { thread } = await agent.createThread(ctx, {
      userId: identity.subject,
    });
    const result = await thread.generateText({ prompt });
    return result.text;
  },
});
