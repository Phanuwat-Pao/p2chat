import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { agent } from "./models/ai";

export const helloWorld = internalAction({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    // const userId = await getAuthUserId(ctx);
    const { thread } = await agent.createThread(ctx);
    const result = await thread.generateText({ prompt });
    return result.text;
  },
});
