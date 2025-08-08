import { v } from "convex/values";
import { internal } from "./_generated/api";
import { httpAction, internalMutation } from "./_generated/server";

export const lineEvent = internalMutation({
  args: {
    signature: v.string(),
    isSignatureValid: v.boolean(),
    event: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("lineEvents", args);
    return ctx.db.query("vips").collect();
  },
});

export const lineWebhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("x-line-signature");
  if (!signature) {
    return new Response("No signature", { status: 400 });
  }
  if (!process.env.LINE_CHANNEL_SECRET) {
    return new Response("No channel secret", { status: 400 });
  }
  return new Response(
    await ctx.runAction(internal.node.processLineWebhook, {
      bodyText: await request.text(),
      signature,
      channelSecret: process.env.LINE_CHANNEL_SECRET,
    }),
  );
});

export const deleteOldEvents = internalMutation({
  handler: async (ctx) => {
    await Promise.all(
      (await ctx.db.query("lineEvents").collect()).map((event) =>
        ctx.db.delete(event._id),
      ),
    );
  },
});
