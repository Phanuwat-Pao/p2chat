import { v } from "convex/values";
import { internal } from "./_generated/api";
import { httpAction, internalMutation } from "./_generated/server";

export const lineEvent = internalMutation({
  args: {
    lineSignature: v.string(),
    generatedLineSignature: v.string(),
    event: v.object({}),
  },
  handler: async (ctx, args) => {
    return ctx.db.insert("lineEvents", args);
  },
});

export const lineWebhook = httpAction(async (ctx, request) => {
  const lineSignature = request.headers.get("x-line-signature");
  if (!lineSignature) {
    return new Response("No signature", { status: 400 });
  }
  if (!process.env.LINE_CHANNEL_SECRET) {
    return new Response("No channel secret", { status: 400 });
  }

  const [bodyJson, bodyText] = await Promise.all([
    request.json(),
    request.text(),
  ]);
  const generatedLineSignature = await ctx.runAction(
    internal.node.generateLineSignature,
    {
      body: bodyText,
    },
  );
  await ctx.runMutation(internal.line.lineEvent, {
    generatedLineSignature,
    lineSignature,
    event: bodyJson,
  });

  if (generatedLineSignature === lineSignature) {
    return new Response("OK");
  } else {
    return new Response("Invalid signature", { status: 400 });
  }
});
