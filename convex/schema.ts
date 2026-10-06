import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
export default defineSchema({
  evaluationUsage: defineTable({ scope: v.literal("milestone1"), count: v.number(), reservedUsd: v.number() }).index("by_scope", ["scope"]),
});
