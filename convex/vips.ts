import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const addVip = mutation({
  args: {
    lineUserId: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    return await ctx.db.insert("vips", args);
  },
});

export const getVips = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    return await ctx.db.query("vips").collect();
  },
});

export const removeVip = mutation({
  args: {
    id: v.id("vips"),
  },
  handler: async (ctx, { id }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
      throw new Error("Not authenticated");
    }
    return await ctx.db.delete(id);
  },
});
