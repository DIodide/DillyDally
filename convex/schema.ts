import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  tasks: defineTable({
    text: v.string(),
    isCompleted: v.boolean(),
  }),
  snapshots: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    timestamp: v.number(),
    isProductive: v.boolean(),
    summary: v.string(),
    activity: v.string(),
    currentTab: v.string(),
    imageBase64: v.optional(v.string()), // Base64 encoded screenshot image
  }),
  sessions: defineTable({
    userId: v.id("users"),
  }),
  cameraSnapshots: defineTable({
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    timestamp: v.number(),
    attentionState: v.union(
      v.literal("away_left"),
      v.literal("away_right"),
      v.literal("away_up"),
      v.literal("away_down"),
      v.literal("no_face"),
      v.literal("looking_at_screen")
    ),
  }),
});
