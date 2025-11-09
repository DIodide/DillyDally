import { getAuthUserId } from "@convex-dev/auth/server";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const currentUser = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    return await ctx.db.get(userId);
  },
});

export const startSession = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      throw new Error("Not authenticated");
    }
    const sessionId = await ctx.db.insert("sessions", { userId });
    return sessionId;
  },
});

export const createSnapshot = mutation({
  args: {
    userId: v.id("users"),
    sessionId: v.id("sessions"),
    timestamp: v.number(),
    isProductive: v.boolean(),
    summary: v.string(),
    activity: v.string(),
    currentTab: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("snapshots", {
      userId: args.userId,
      sessionId: args.sessionId,
      timestamp: args.timestamp,
      isProductive: args.isProductive,
      summary: args.summary,
      activity: args.activity,
      currentTab: args.currentTab,
    });
  },
});

export const getSessionActivities = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("snapshots")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .collect();

    // Get unique activities
    const activities = new Set<string>();
    for (const snapshot of snapshots) {
      if (snapshot.activity) {
        activities.add(snapshot.activity);
      }
    }

    return Array.from(activities);
  },
});

export const createCameraSnapshot = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("cameraSnapshots", {
      userId: args.userId,
      sessionId: args.sessionId,
      timestamp: args.timestamp,
      attentionState: args.attentionState,
    });
  },
});

export const getSessionSnapshots = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const snapshots = await ctx.db
      .query("snapshots")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .order("desc")
      .collect();
    return snapshots;
  },
});
