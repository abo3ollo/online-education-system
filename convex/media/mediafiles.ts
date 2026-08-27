// convex/media/mediafiles.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ============================================
// MEDIA FILES QUERIES
// ============================================

export const listMediaFiles = query({
  args: {
    type: v.optional(v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("youtube"),
      v.literal("pdf"),
      v.literal("audio"),
      v.literal("link"),
    )),
    context: v.optional(v.string()),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    let files = await ctx.db.query("mediaFiles").order("desc").collect();

    if (args.type) {
      files = files.filter((f) => f.type === args.type);
    }
    if (args.context) {
      files = files.filter((f) => f.context === args.context);
    }
    if (args.search) {
      const q = args.search.toLowerCase();
      files = files.filter((f) => f.name.toLowerCase().includes(q));
    }

    return files;
  },
});

export const getMediaFileById = query({
  args: { fileId: v.id("mediaFiles") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");
    return await ctx.db.get(args.fileId);
  },
});

export const getMediaFileStats = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const all = await ctx.db.query("mediaFiles").collect();

    return {
      total: all.length,
      images: all.filter((f) => f.type === "image").length,
      videos: all.filter((f) => f.type === "video" || f.type === "youtube").length,
      links: all.filter((f) => f.type === "link").length,
      unused: all.filter((f) => f.usedIn.length === 0).length,
    };
  },
});

// ============================================
// MEDIA FILES MUTATIONS
// ============================================

// ✅ إضافة ملف برابط (بدون R2)
export const createMediaFileFromUrl = mutation({
  args: {
    name: v.string(),
    url: v.string(),
    type: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("youtube"),
      v.literal("pdf"),
      v.literal("audio"),
      v.literal("link"),
    ),
    context: v.optional(v.string()),
    mimeType: v.optional(v.string()),
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

    if (!args.url.startsWith("http://") && !args.url.startsWith("https://")) {
      throw new Error("الرابط غير صحيح");
    }

    const fileId = await ctx.db.insert("mediaFiles", {
      name: args.name,
      type: args.type,
      url: args.url,
      size: 0,
      mimeType: args.mimeType || "",
      context: args.context || "general",
      status: "ok",
      uploadedBy: user._id,
      uploadedAt: Date.now(),
      usedIn: [],
    });

    return { success: true, fileId };
  },
});

// ✅ إضافة فيديو يوتيوب
export const addYoutubeFile = mutation({
  args: {
    url: v.string(),
    title: v.string(),
    context: v.optional(v.string()),
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

    const fileId = await ctx.db.insert("mediaFiles", {
      name: args.title,
      type: "youtube",
      url: args.url,
      size: 0,
      mimeType: "",
      context: args.context || "general",
      status: "ok",
      uploadedBy: user._id,
      uploadedAt: Date.now(),
      usedIn: [],
    });

    return { success: true, fileId };
  },
});

// ❌ حذف createMediaFile (اللي كان بيستخدم R2) - مش هنحتاجه
// ❌ حذف deleteMediaFile (اللي كان بيحذف من R2) - هنعمل واحد جديد

// ✅ حذف ملف (بدون R2)
export const deleteMediaFile = mutation({
  args: { fileId: v.id("mediaFiles") },
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

    const file = await ctx.db.get(args.fileId);
    if (!file) throw new Error("الملف غير موجود");

    // المعلم يقدر يحذف ملفاته بس
    if (user.role === "teacher" && file.uploadedBy !== user._id) {
      throw new Error("غير مصرح: لا يمكنك حذف ملفات معلم آخر");
    }

    // حذف الملف من التعيينات
    const assignments = await ctx.db.query("mediaAssignments").collect();
    for (const a of assignments) {
      if (a.mediaFileIds.includes(args.fileId)) {
        const updated = a.mediaFileIds.filter((id) => id !== args.fileId);
        if (updated.length === 0) {
          await ctx.db.delete(a._id);
        } else {
          await ctx.db.patch(a._id, { mediaFileIds: updated });
        }
      }
    }

    await ctx.db.delete(args.fileId);
    return { success: true };
  },
});

// ✅ حذف الملفات غير المستخدمة
export const deleteUnusedFiles = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const unused = await ctx.db
      .query("mediaFiles")
      .collect()
      .then((files) => files.filter((f) => f.usedIn.length === 0));

    let deleted = 0;
    for (const file of unused) {
      await ctx.db.delete(file._id);
      deleted++;
    }

    return { deleted };
  },
});

// ✅ تصدير الدوال
export const mediafiles = {
  listMediaFiles,
  getMediaFileById,
  getMediaFileStats,
  createMediaFileFromUrl,
  addYoutubeFile,
  deleteMediaFile,
  deleteUnusedFiles,
};