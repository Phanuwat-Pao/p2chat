import { ContextOptions, StorageOptions } from "@convex-dev/agent";
import { vTextArgs } from "@convex-dev/agent/validators";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
  httpAction,
  internalAction,
  internalMutation,
} from "./_generated/server";
import { agent } from "./models/ai";

export const lineEvent = internalMutation({
  args: {
    lineSignature: v.string(),
    isSignatureValid: v.boolean(),
    event: v.any(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("lineEvents", args);
    return ctx.db.query("vips").collect();
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
  return ctx.runAction(internal.node.processLineWebhook, {
    bodyText: await request.text(),
    lineSignature,
    lineChannelSecret: process.env.LINE_CHANNEL_SECRET,
  });
});

export const generateResponseAsync = internalAction({
  args: vTextArgs,
  handler: async (ctx, args) => {
    const spec: {
      /**
       * The maximum number of steps to take in this action.
       * Defaults to the {@link Agent.maxSteps} option.
       */
      maxSteps?: number;
      /**
       * The {@link ContextOptions} to use for fetching contextual messages and
       * saving input/output messages.
       * Defaults to the {@link Agent.contextOptions} option.
       */
      contextOptions?: ContextOptions;
      /**
       * The {@link StorageOptions} to use for saving input/output messages.
       * Defaults to the {@link Agent.storageOptions} option.
       */
      storageOptions?: StorageOptions;
      /**
       * Whether to stream the text.
       * If false, it will generate the text in a single call. (default)
       * If true or {@link StreamingOptions}, it will stream the text from the LLM
       * and save the chunks to the database with the options you specify, or the
       * defaults if you pass true.
       */
      stream?: boolean | StorageOptions;
    } = {};
    const maxSteps = spec?.maxSteps ?? agent.options.maxSteps;
    const { contextOptions, storageOptions, ...rest } = args;
    const stream =
      args.stream === true ? spec?.stream || true : (spec?.stream ?? false);
    const targetArgs = { userId: args.userId, threadId: args.threadId };
    const llmArgs = { maxSteps, ...rest };
    const opts = {
      contextOptions:
        contextOptions ?? spec?.contextOptions ?? agent.options.contextOptions,
      storageOptions:
        storageOptions ?? spec?.storageOptions ?? agent.options.storageOptions,
      saveStreamDeltas: stream,
    };
    if (stream) {
      // @ts-ignore
      const result = await agent.streamText(ctx, targetArgs, llmArgs, opts);
      await result.consumeStream();
      return {
        text: await result.text,
        messageId: result.messageId,
        order: result.order,
        finishReason: await result.finishReason,
        warnings: result.warnings,
      };
    } else {
      // @ts-ignore
      const res = await agent.generateText(ctx, targetArgs, llmArgs, opts);
      return {
        text: res.text,
        messageId: res.messageId,
        order: res.order,
        finishReason: res.finishReason,
        warnings: res.warnings,
      };
    }
  },
});
