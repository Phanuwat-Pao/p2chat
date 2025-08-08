import { httpRouter } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { httpAction, internalMutation } from "./_generated/server";

export const lineEvent = internalMutation({
  args: {
    signature: v.string(),
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
  const body = await request.json();
  await ctx.runMutation(internal.line.lineEvent, {
    signature: lineSignature,
    event: body,
  });

  return new Response("OK");
});

const http = httpRouter();

http.route({
  path: "/line/webhook",
  method: "POST",
  handler: lineWebhook,
});
