// convex/notifications/notifications.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// ✅ جلب جميع الإشعارات (للمشرف)
export const listNotifications = query({
  args: {
    type: v.optional(v.string()),
    priority: v.optional(v.string()),
    recipientType: v.optional(v.string()),
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");
    
    if (user.role !== "admin" && user.role !== "teacher") {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    let notifications = await ctx.db
      .query("notifications")
      .collect();

    if (args.type) {
      notifications = notifications.filter((n) => n.type === args.type);
    }
    if (args.priority) {
      notifications = notifications.filter((n) => n.priority === args.priority);
    }
    if (args.recipientType) {
      notifications = notifications.filter((n) => n.recipientType === args.recipientType);
    }
    if (args.status) {
      notifications = notifications.filter((n) => n.status === args.status);
    }

    const notificationsWithDetails = await Promise.all(
      notifications.map(async (notif) => {
        let createdByName = "غير معروف";
        try {
          if (notif.createdBy) {
            const creator = await ctx.db.get(notif.createdBy);
            if (creator) createdByName = creator.name || "غير معروف";
          }
        } catch (error) {
          createdByName = "غير معروف";
        }

        let recipientName = undefined;
        try {
          if (notif.recipientId && notif.recipientType !== "all_teachers" && notif.recipientType !== "all_users") {
            if (notif.recipientType === "group") {
              const group = await ctx.db.get(notif.recipientId);
              if (group) recipientName = group.name || "مجموعة غير معروفة";
            } else if (notif.recipientType === "grade") {
              const grade = await ctx.db.get(notif.recipientId);
              if (grade) recipientName = grade.name || "صف غير معروف";
            } else {
              const recipient = await ctx.db.get(notif.recipientId);
              if (recipient) recipientName = recipient.name || "غير معروف";
            }
          }
        } catch (error) {
          recipientName = undefined;
        }

        return {
          ...notif,
          createdByName,
          recipientName,
        };
      })
    );

    return notificationsWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ✅ جلب الإشعارات للمستخدم الحالي
export const getMyNotifications = query({
  args: {
    status: v.optional(v.union(v.literal("sent"), v.literal("read"), v.literal("archived"))),
    unreadOnly: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    let notifications = await ctx.db
      .query("notifications")
      .collect();

    // ✅ جلب مجموعات المستخدم
    let userGroupIds: Id<"groups">[] = [];
    
    if (user.role === "teacher") {
      const allGroups = await ctx.db.query("groups").collect();
      const teacherGroups = allGroups.filter((g) => 
        g.createdBy === user._id || 
        g.supervisorId === user._id ||
        (g.teachers && g.teachers.includes(user._id))
      );
      userGroupIds = teacherGroups.map((g) => g._id);
    } else if (user.role === "student") {
      const allGroups = await ctx.db.query("groups").collect();
      const studentGroups = allGroups.filter((g) =>
        g.students && g.students.includes(user._id)
      );
      userGroupIds = studentGroups.map((g) => g._id);
    }

    // ✅ تصفية الإشعارات التي تخص المستخدم
    notifications = notifications.filter((n) => {
      // 1. إذا كان المستلم هو المستخدم مباشرة
      if (n.recipientId === user._id) return true;
      
      // 2. إذا كان المستلم مجموعة والمستخدم في هذه المجموعة
      if (n.recipientType === "group" && n.recipientId) {
        return userGroupIds.some((id) => id === n.recipientId);
      }
      
      // 3. إذا كان المستلم صف
      if (n.recipientType === "grade" && n.recipientId) {
        return true;
      }
      
      // 4. إذا كان المستلم جميع المعلمين والمستخدم معلم
      if (n.recipientType === "all_teachers" && user.role === "teacher") {
        return true;
      }
      
      // 5. إذا كان المستلم جميع المستخدمين
      if (n.recipientType === "all_users") {
        return true;
      }
      
      // 6. إذا كان المستلم معلم والمستخدم هو هذا المعلم
      if (n.recipientType === "teacher" && n.recipientId === user._id) {
        return true;
      }
      
      // 7. إذا كان المستلم ولي أمر والمستخدم هو هذا ولي الأمر
      if (n.recipientType === "parent" && n.recipientId === user._id) {
        return true;
      }
      
      return false;
    });

    if (args.status) {
      notifications = notifications.filter((n) => n.status === args.status);
    }
    if (args.unreadOnly) {
      notifications = notifications.filter((n) => n.status === "sent");
    }

    return notifications.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ✅ جلب عدد الإشعارات غير المقروءة
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) return 0;

    // ✅ جلب مجموعات المستخدم
    let userGroupIds: Id<"groups">[] = [];
    
    if (user.role === "teacher") {
      const allGroups = await ctx.db.query("groups").collect();
      const teacherGroups = allGroups.filter((g) => 
        g.createdBy === user._id || 
        g.supervisorId === user._id ||
        (g.teachers && g.teachers.includes(user._id))
      );
      userGroupIds = teacherGroups.map((g) => g._id);
    } else if (user.role === "student") {
      const allGroups = await ctx.db.query("groups").collect();
      const studentGroups = allGroups.filter((g) =>
        g.students && g.students.includes(user._id)
      );
      userGroupIds = studentGroups.map((g) => g._id);
    }

    const notifications = await ctx.db
      .query("notifications")
      .collect();

    const unread = notifications.filter((n) => {
      if (n.status !== "sent") return false;
      
      if (n.recipientId === user._id) return true;
      
      if (n.recipientType === "group" && n.recipientId) {
        return userGroupIds.some((id) => id === n.recipientId);
      }
      
      if (n.recipientType === "all_teachers" && user.role === "teacher") {
        return true;
      }
      
      if (n.recipientType === "all_users") {
        return true;
      }
      
      if (n.recipientType === "teacher" && n.recipientId === user._id) {
        return true;
      }
      
      if (n.recipientType === "parent" && n.recipientId === user._id) {
        return true;
      }
      
      return false;
    });

    return unread.length;
  },
});

// ============================================
// MUTATIONS
// ============================================

// ✅ إنشاء إشعار جديد (معدل - يدعم جميع الأنواع)
export const createNotification = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("teacher_message"),
      v.literal("exam_published"),
      v.literal("exam_reminder"),
      v.literal("new_assignment"),
      v.literal("system_announcement")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
    recipientType: v.union(
      v.literal("group"),
      v.literal("grade"),
      v.literal("student"),
      v.literal("all_teachers"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("all_users")
    ),
    recipientId: v.optional(v.union(v.id("users"), v.id("groups"), v.id("grades"))),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    if (user.role !== "admin" && user.role !== "teacher") {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    // ✅ التحقق من المستلم حسب النوع
    if (args.recipientId) {
      if (args.recipientType === "group") {
        const group = await ctx.db.get(args.recipientId);
        if (!group) throw new Error("المجموعة غير موجودة");
      } else if (args.recipientType === "grade") {
        const grade = await ctx.db.get(args.recipientId);
        if (!grade) throw new Error("الصف غير موجود");
      } else if (args.recipientType !== "all_teachers" && args.recipientType !== "all_users") {
        const recipient = await ctx.db.get(args.recipientId);
        if (!recipient) throw new Error("المستلم غير موجود");
      }
    }

    // ✅ إنشاء الإشعار
    const notificationId = await ctx.db.insert("notifications", {
      title: args.title,
      message: args.message,
      type: args.type,
      priority: args.priority,
      recipientType: args.recipientType,
      recipientId: args.recipientId,
      status: "sent",
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // ✅ تسجيل في سجل التدقيق
    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "CREATE_NOTIFICATION",
      resourceType: "notification",
      resourceId: notificationId,
      details: {
        name: args.title,
        createdBy: user.email,
        role: user.role,
      },
      createdAt: Date.now(),
    });

    return { success: true, notificationId };
  },
});


// ✅ تحديث حالة الإشعار 
export const updateNotificationStatus = mutation({
  args: {
    notificationId: v.id("notifications"),
    status: v.union(
      v.literal("sent"),
      v.literal("read"),
      v.literal("archived")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("الإشعار غير موجود");

    // ✅ التحقق من أن المستخدم هو المستلم أو المنشئ أو أدمن
    const isRecipient = notification.recipientId === user._id;
    const isCreator = notification.createdBy === user._id;
    const isAdmin = user.role === "admin";

    // ✅ إذا كان الإشعار لجميع المستخدمين أو جميع المعلمين، نسمح لأي مستخدم بتحديثه
    const isAllUsers = notification.recipientType === "all_users";
    const isAllTeachers = notification.recipientType === "all_teachers";

    if (!isRecipient && !isCreator && !isAdmin && !isAllUsers && !isAllTeachers) {
      throw new Error("غير مصرح لك بتحديث هذا الإشعار");
    }

    await ctx.db.patch(args.notificationId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ حذف إشعار
export const deleteNotification = mutation({
  args: {
    notificationId: v.id("notifications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    const notification = await ctx.db.get(args.notificationId);
    if (!notification) throw new Error("الإشعار غير موجود");

    if (notification.createdBy !== user._id && user.role !== "admin") {
      throw new Error("غير مصرح لك بحذف هذا الإشعار");
    }

    await ctx.db.delete(args.notificationId);

    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "DELETE_NOTIFICATION",
      resourceType: "notification",
      resourceId: args.notificationId,
      details: {
        deletedBy: user.email,
      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ إرسال إشعارات جماعية
export const sendBulkNotification = mutation({
  args: {
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("teacher_message"),
      v.literal("exam_published"),
      v.literal("exam_reminder"),
      v.literal("new_assignment"),
      v.literal("system_announcement")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
    recipientType: v.union(
      v.literal("all_students"),
      v.literal("all_teachers"),
      v.literal("all_users")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    let users = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    if (args.recipientType === "all_teachers") {
      users = await ctx.db
        .query("users")
        .withIndex("by_role", (q) => q.eq("role", "teacher"))
        .collect();
    } else if (args.recipientType === "all_users") {
      users = await ctx.db.query("users").collect();
    }

    const notifications = [];
    for (const recipient of users) {
      const notificationId = await ctx.db.insert("notifications", {
        title: args.title,
        message: args.message,
        type: args.type,
        priority: args.priority,
        recipientType: "student",
        recipientId: recipient._id,
        status: "sent",
        createdBy: user._id,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      notifications.push(notificationId);
    }

    return { 
      success: true, 
      count: notifications.length,
      notifications 
    };
  },
});

// ============================================
// EXPORTS
// ============================================

export const notifications = {
  listNotifications,
  getMyNotifications,
  getUnreadCount,
  createNotification,
  updateNotificationStatus,
  deleteNotification,
  sendBulkNotification,
};