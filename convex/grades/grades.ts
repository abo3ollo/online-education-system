// convex/grades/grades.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// ✅ جلب جميع الصفوف
export const getGrades = query({
  args: {
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    academicYear: v.optional(v.string()),
    search: v.optional(v.string()),
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

    let grades = await ctx.db.query("grades").collect();

    if (args.status) {
      grades = grades.filter((g) => g.status === args.status);
    }
    if (args.academicYear) {
      grades = grades.filter((g) => g.academicYear === args.academicYear);
    }
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      grades = grades.filter((g) =>
        g.name.toLowerCase().includes(searchLower) ||
        g.nameEn.toLowerCase().includes(searchLower)
      );
    }

    // جلب عدد المجموعات لكل صف
    const gradesWithCount = await Promise.all(
      grades.map(async (grade) => {
        const groups = await ctx.db
          .query("groups")
          .withIndex("by_grade", (q) => q.eq("gradeId", grade._id))
          .collect();
        
        const students = await ctx.db
          .query("users")
          .withIndex("by_gradeId", (q) => q.eq("gradeId", grade._id))
          .collect();

        return {
          ...grade,
          groupsCount: groups.length,
          studentsCount: students.length,
        };
      })
    );

    return gradesWithSort(gradesWithCount);
  },
});

// ✅ جلب صف بواسطة ID
export const getGradeById = query({
  args: { gradeId: v.id("grades") },
  handler: async (ctx, args) => {
    // ✅ إزالة التحقق من الصلاحيات - متاحة للجميع
    const grade = await ctx.db.get(args.gradeId);
    if (!grade) throw new Error("الصف غير موجود");

    // ✅ جلب المجموعات التابعة للصف (اختياري - يمكن إزالته إذا كان يسبب بطء)
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_grade", (q) => q.eq("gradeId", grade._id))
      .collect();

    // ✅ جلب الطلاب (اختياري - يمكن إزالته إذا كان يسبب بطء)
    const students = await ctx.db
      .query("users")
      .withIndex("by_gradeId", (q) => q.eq("gradeId", grade._id))
      .collect();

    return {
      ...grade,
      groups,
      students,
    };
  },
});

// ============================================
// MUTATIONS
// ============================================

// ✅ إنشاء صف جديد (أدمن فقط)
export const createGrade = mutation({
  args: {
    name: v.string(),
    nameEn: v.string(),
    gradeLevel: v.number(),
    academicYear: v.string(),
    maxGroups: v.optional(v.number()),
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

    // التحقق من عدم وجود صف بنفس المستوى
    const existing = await ctx.db
      .query("grades")
      .withIndex("by_gradeLevel", (q) => q.eq("gradeLevel", args.gradeLevel))
      .first();

    if (existing) {
      throw new Error(`الصف ${args.name} موجود مسبقاً`);
    }

    const gradeId = await ctx.db.insert("grades", {
      name: args.name,
      nameEn: args.nameEn,
      gradeLevel: args.gradeLevel,
      academicYear: args.academicYear,
      maxGroups: args.maxGroups,
      status: "active",
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    await ctx.db.insert("auditLogs", {
      userId: user._id,
      action: "CREATE_GRADE",
      resourceType: "grade",
      resourceId: gradeId,
      details: {
        name: args.name,
        createdBy: user.email,
        role: user.role,
      },
      createdAt: Date.now(),
    });

    return { success: true, gradeId };
  },
});

// ✅ تحديث صف
export const updateGrade = mutation({
  args: {
    gradeId: v.id("grades"),
    name: v.optional(v.string()),
    nameEn: v.optional(v.string()),
    gradeLevel: v.optional(v.number()),
    academicYear: v.optional(v.string()),
    maxGroups: v.optional(v.number()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
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

    const grade = await ctx.db.get(args.gradeId);
    if (!grade) throw new Error("الصف غير موجود");

    const updateData: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updateData.name = args.name;
    if (args.nameEn !== undefined) updateData.nameEn = args.nameEn;
    if (args.gradeLevel !== undefined) updateData.gradeLevel = args.gradeLevel;
    if (args.academicYear !== undefined) updateData.academicYear = args.academicYear;
    if (args.maxGroups !== undefined) updateData.maxGroups = args.maxGroups;
    if (args.status !== undefined) updateData.status = args.status;

    await ctx.db.patch(args.gradeId, updateData);

    return { success: true };
  },
});

// ✅ حذف صف
export const deleteGrade = mutation({
  args: { gradeId: v.id("grades") },
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

    const grade = await ctx.db.get(args.gradeId);
    if (!grade) throw new Error("الصف غير موجود");

    // التحقق من وجود مجموعات تابعة
    const groups = await ctx.db
      .query("groups")
      .withIndex("by_grade", (q) => q.eq("gradeId", grade._id))
      .collect();

    if (groups.length > 0) {
      throw new Error("لا يمكن حذف الصف لأنه يحتوي على مجموعات");
    }

    // التحقق من وجود طلاب
    const students = await ctx.db
      .query("users")
      .withIndex("by_gradeId", (q) => q.eq("gradeId", grade._id))
      .collect();

    if (students.length > 0) {
      throw new Error("لا يمكن حذف الصف لأنه يحتوي على طلاب");
    }

    await ctx.db.delete(args.gradeId);

    return { success: true };
  },
});

// ✅ جلب جميع الصفوف النشطة (للاستخدام العام - بدون صلاحيات)
export const getActiveGrades = query({
  args: {},
  handler: async (ctx) => {
    // ✅ لا نحتاج للتحقق من الصلاحية لأنها بيانات عامة
    const allGrades = await ctx.db.query("grades").collect();
    
    // ✅ فلترة الصفوف النشطة
    const activeGrades = allGrades.filter((g) => g.status === "active");
    
    // ✅ ترتيب حسب المستوى
    return activeGrades.sort((a, b) => a.gradeLevel - b.gradeLevel);
  },
});

// ============================================
// HELPERS
// ============================================

function gradesWithSort(grades: any[]) {
  return grades.sort((a, b) => a.gradeLevel - b.gradeLevel);
}

// ✅ تصدير الدوال
export const grades = {
  getGrades,
  getGradeById,
  getActiveGrades,
  createGrade,
  updateGrade,
  deleteGrade,
};