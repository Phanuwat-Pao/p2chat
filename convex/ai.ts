import { generateText } from "ai";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { openrouter } from "./models/ai";

export const chat = internalAction({
  args: { prompt: v.string() },
  handler: async (ctx, { prompt }) => {
    const result = await generateText({
      //@ts-ignore
      model: openrouter("@preset/p2chat"),
      prompt,
    });
    return result.text;
  },
});
