import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
  numbers: defineTable({
    value: v.number(),
  }),
  lineEvents: defineTable({
    isSignatureValid: v.boolean(),
    lineSignature: v.string(),
    event: v.any(),
  }),
  vips: defineTable({
    userId: v.id("users"),
  }),
});
