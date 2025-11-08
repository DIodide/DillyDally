import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),
  snapshots: defineTable({
    userId: v.string(),
    sessionId: v.id("sessions"),
    timestamp: v.number(),
    isProductive: v.boolean(),
    summary: v.string(),
    activity: v.string(),
  }),
  sessions: defineTable({
    userId: v.string(),
  }),

});

