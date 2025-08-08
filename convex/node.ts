"use node";
import { v } from "convex/values";
import crypto from "crypto";
import { internalAction } from "./_generated/server";

export const generateLineSignature = internalAction({
  args: {
    body: v.string(),
    lineChannelSecret: v.string(),
  },
  handler: async (ctx, args) => {
    if (!process.env.LINE_CHANNEL_SECRET) {
      throw new Error("LINE_CHANNEL_SECRET is not set");
    }
    // Create HMAC using HmacSHA256
    const hmac = crypto.createHmac("sha256", args.lineChannelSecret);
    hmac.update(args.body, "utf8");

    // Generate Base64 signature
    const signature = hmac.digest("base64");

    return signature;
  },
});
