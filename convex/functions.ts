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
    imageBase64: v.optional(v.string()), // Base64 encoded screenshot image
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
      imageBase64: args.imageBase64,
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

export const getSessionCameraSnapshots = query({
  args: {
    sessionId: v.id("sessions"),
  },
  handler: async (ctx, args) => {
    const cameraSnapshots = await ctx.db
      .query("cameraSnapshots")
      .filter((q) => q.eq(q.field("sessionId"), args.sessionId))
      .order("asc")
      .collect();
    return cameraSnapshots;
  },
});

export const getAllSessions = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    // Get all sessions for this user
    const sessions = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("userId"), userId))
      .order("desc")
      .collect();

    // Get snapshots and camera snapshots for each session to calculate metadata
    const sessionsWithMetadata = await Promise.all(
      sessions.map(async (session) => {
        const snapshots = await ctx.db
          .query("snapshots")
          .filter((q) => q.eq(q.field("sessionId"), session._id))
          .collect();

        const cameraSnapshots = await ctx.db
          .query("cameraSnapshots")
          .filter((q) => q.eq(q.field("sessionId"), session._id))
          .collect();

        // Calculate duration from snapshots
        let duration = 0;
        if (snapshots.length > 0) {
          const timestamps = snapshots.map((s) => s.timestamp);
          const min = Math.min(...timestamps);
          const max = Math.max(...timestamps);
          duration = max - min;
        } else if (cameraSnapshots.length > 0) {
          const timestamps = cameraSnapshots.map((s) => s.timestamp);
          const min = Math.min(...timestamps);
          const max = Math.max(...timestamps);
          duration = max - min;
        }

        // Get unique activities
        const activities = new Set(snapshots.map((s) => s.activity).filter(Boolean));

        // Calculate productivity percentage
        const productiveCount = snapshots.filter((s) => s.isProductive).length;
        const productivityPercentage = snapshots.length > 0 ? (productiveCount / snapshots.length) * 100 : 0;

        return {
          _id: session._id,
          _creationTime: session._creationTime,
          duration,
          activityCount: activities.size,
          snapshotCount: snapshots.length,
          productivityPercentage,
        };
      })
    );

    return sessionsWithMetadata;
  },
});

// Helper function to get start of week (Monday)
function getStartOfWeek(timestamp: number): number {
  const date = new Date(timestamp);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust to Monday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.getTime();
}

// Helper function to get start of day
function getStartOfDay(timestamp: number): number {
  const date = new Date(timestamp);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export const getWeeklyInsights = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }

    const now = Date.now();
    const startOfThisWeek = getStartOfWeek(now);
    const startOfLastWeek = startOfThisWeek - 7 * 24 * 60 * 60 * 1000;

    // Get all sessions for this user
    const allSessions = await ctx.db
      .query("sessions")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Get all snapshots for this user
    const allSnapshots = await ctx.db
      .query("snapshots")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Get all camera snapshots for this user
    const allCameraSnapshots = await ctx.db
      .query("cameraSnapshots")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Filter sessions and snapshots for this week and last week
    const thisWeekSessions = allSessions.filter((s) => s._creationTime >= startOfThisWeek);
    const lastWeekSessions = allSessions.filter(
      (s) => s._creationTime >= startOfLastWeek && s._creationTime < startOfThisWeek
    );

    const thisWeekSnapshots = allSnapshots.filter((s) => s.timestamp >= startOfThisWeek);
    const lastWeekSnapshots = allSnapshots.filter(
      (s) => s.timestamp >= startOfLastWeek && s.timestamp < startOfThisWeek
    );

    const thisWeekCameraSnapshots = allCameraSnapshots.filter((s) => s.timestamp >= startOfThisWeek);
    const lastWeekCameraSnapshots = allCameraSnapshots.filter(
      (s) => s.timestamp >= startOfLastWeek && s.timestamp < startOfThisWeek
    );

    // Calculate session durations (approximate from snapshots)
    const calculateSessionDuration = (sessionId: any): number => {
      const sessionSnapshots = allSnapshots.filter((s) => s.sessionId === sessionId);
      if (sessionSnapshots.length === 0) return 0;
      const timestamps = sessionSnapshots.map((s) => s.timestamp);
      const min = Math.min(...timestamps);
      const max = Math.max(...timestamps);
      return max - min;
    };

    // Total Focus Time (productive time from snapshots)
    const thisWeekProductiveTime = thisWeekSnapshots
      .filter((s) => s.isProductive)
      .reduce((sum) => {
        // Estimate time per snapshot (assuming ~30 seconds between snapshots)
        return sum + 30000;
      }, 0);
    const lastWeekProductiveTime = lastWeekSnapshots.filter((s) => s.isProductive).reduce((sum) => sum + 30000, 0);

    // Sessions Completed
    const thisWeekSessionsCount = thisWeekSessions.length;
    const lastWeekSessionsCount = lastWeekSessions.length;

    // Average Session Length
    const thisWeekSessionDurations = thisWeekSessions.map((s) => calculateSessionDuration(s._id));
    const avgSessionLength =
      thisWeekSessionDurations.length > 0
        ? thisWeekSessionDurations.reduce((a, b) => a + b, 0) / thisWeekSessionDurations.length
        : 0;

    const lastWeekSessionDurations = lastWeekSessions.map((s) => calculateSessionDuration(s._id));
    const lastWeekAvgSessionLength =
      lastWeekSessionDurations.length > 0
        ? lastWeekSessionDurations.reduce((a, b) => a + b, 0) / lastWeekSessionDurations.length
        : 0;

    // Most Productive Time - return timestamps for frontend to calculate in user's timezone
    const productiveSnapshotTimestamps = thisWeekSnapshots.filter((s) => s.isProductive).map((s) => s.timestamp);

    // Current Streak (consecutive days with sessions)
    const sessionDays = new Set<number>();
    allSessions.forEach((s) => {
      sessionDays.add(getStartOfDay(s._creationTime));
    });
    const sortedDays = Array.from(sessionDays).sort((a, b) => b - a);

    let streak = 0;
    const today = getStartOfDay(now);
    for (let i = 0; i < sortedDays.length; i++) {
      const expectedDay = today - i * 24 * 60 * 60 * 1000;
      const dayStart = sortedDays[i];
      if (dayStart === expectedDay) {
        streak++;
      } else {
        break;
      }
    }

    // Weekly Goal Progress (default 15 hours = 54000000 ms)
    const weeklyGoal = 15 * 60 * 60 * 1000; // 15 hours in ms
    const goalProgress = Math.min(100, (thisWeekProductiveTime / weeklyGoal) * 100);

    // Distraction Alerts (camera snapshots not looking at screen)
    const thisWeekDistractions = thisWeekCameraSnapshots.filter((s) => s.attentionState !== "looking_at_screen").length;
    const lastWeekDistractions = lastWeekCameraSnapshots.filter((s) => s.attentionState !== "looking_at_screen").length;

    // AI Assistance Time (infer from activity names containing "AI", "ChatGPT", "Claude", etc.)
    const aiKeywords = ["ai", "chatgpt", "claude", "gpt", "assistant", "copilot"];
    const isAIActivity = (activity: string): boolean => {
      const lower = activity.toLowerCase();
      return aiKeywords.some((keyword) => lower.includes(keyword));
    };

    const thisWeekAITime = thisWeekSnapshots
      .filter((s) => isAIActivity(s.activity) && s.isProductive)
      .reduce((sum) => sum + 30000, 0);
    const focusWithoutAI =
      thisWeekProductiveTime > 0 ? ((thisWeekProductiveTime - thisWeekAITime) / thisWeekProductiveTime) * 100 : 0;

    // Calculate trends
    const calculateTrend = (current: number, previous: number): string => {
      if (previous === 0) return current > 0 ? "+100%" : "0%";
      const change = ((current - previous) / previous) * 100;
      return `${change >= 0 ? "+" : ""}${change.toFixed(0)}%`;
    };

    return {
      // This Week metrics
      totalFocusTime: thisWeekProductiveTime,
      sessionsCompleted: thisWeekSessionsCount,
      averageSessionLength: avgSessionLength,
      productiveSnapshotTimestamps: productiveSnapshotTimestamps,
      currentStreak: streak,
      weeklyGoalProgress: goalProgress,
      distractionAlerts: thisWeekDistractions,
      aiAssistanceTime: thisWeekAITime,
      focusWithoutAI: focusWithoutAI,

      // Trends (this week vs last week)
      totalFocusTimeTrend: calculateTrend(thisWeekProductiveTime, lastWeekProductiveTime),
      sessionsCompletedTrend: calculateTrend(thisWeekSessionsCount, lastWeekSessionsCount),
      averageSessionLengthTrend: calculateTrend(avgSessionLength, lastWeekAvgSessionLength),
      distractionAlertsTrend: calculateTrend(thisWeekDistractions, lastWeekDistractions),
      aiAssistanceTimeTrend: calculateTrend(
        thisWeekAITime,
        lastWeekSnapshots.filter((s) => isAIActivity(s.activity) && s.isProductive).reduce((sum) => sum + 30000, 0)
      ),
    };
  },
});
