// convex/relationships/parentStudent.ts
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";


// ── Auth helper ───────────────────────────────────────────────────
async function getAuthUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  // ✅ Return null instead of throwing — lets useQuery return null gracefully
  if (!identity) return null;
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .first();
}

// ربط ولي أمر بطالب - (معدل للسماح لولي الأمر بربط نفسه)
export const linkParentToStudent = mutation({
  args: {
    parentId: v.id("users"),
    studentId: v.id("users"),
    relationship: v.string(),
    isPrimary: v.boolean(),
    permissions: v.optional(v.object({
      viewGrades: v.boolean(),
      financialAccess: v.boolean(),
      pickupNotification: v.boolean(),
      emergencyContact: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    // ✅ جلب المستخدم الحالي
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("المستخدم غير موجود");

    // ✅ التحقق من صلاحيات المستخدم:
    // 1. إذا كان أدمن → يسمح له بكل شيء
    // 2. إذا كان ولي أمر → يسمح له فقط بربط نفسه (parentId === currentUser._id)
    const isAdmin = currentUser.role === "admin";
    const isSelfParent = currentUser._id === args.parentId && currentUser.role === "parent";

    if (!isAdmin && !isSelfParent) {
      throw new Error("غير مصرح بربط ولي أمر بالطالب");
    }

    // التحقق من وجود ولي الأمر والطالب
    const parent = await ctx.db.get(args.parentId);
    const student = await ctx.db.get(args.studentId);

    if (!parent || parent.role !== "parent") {
      throw new Error("ولي الأمر غير موجود");
    }
    if (!student || student.role !== "student") {
      throw new Error("الطالب غير موجود");
    }
    
    // ✅ التحقق من وجود الرابط مسبقاً
    const existing = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent_student", (q) => 
        q.eq("parentId", args.parentId).eq("studentId", args.studentId)
      )
      .first();
    
    if (existing) throw new Error("الرابط موجود مسبقاً");
    
    // ✅ إنشاء الرابط مع الصلاحيات
    const linkId = await ctx.db.insert("parentStudentLinks", {
      parentId: args.parentId,
      studentId: args.studentId,
      relationship: args.relationship,
      isPrimary: args.isPrimary,
      permissions: args.permissions || {
        viewGrades: true,
        financialAccess: false,
        pickupNotification: false,
        emergencyContact: false,
      },
      createdAt: Date.now(),
    });
    
    // ✅ تسجيل في سجل التدقيق - استخدام المستخدم المناسب (الأدمن أو ولي الأمر)
    await ctx.db.insert("auditLogs", {
      userId: currentUser._id,
      action: "LINK_PARENT_STUDENT",
      resourceType: "parentStudentLink",
      resourceId: linkId,
      details: {
        parentId: args.parentId,
        studentId: args.studentId,
        createdBy: currentUser.email || currentUser.name || "غير معروف",
      },
      createdAt: Date.now(),
    });
    
    return { success: true, linkId };
  },
});

// فك ربط ولي أمر عن طالب
export const unlinkParentFromStudent = mutation({
  args: {
    parentId: v.id("users"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const link = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent_student", (q) =>
        q.eq("parentId", args.parentId).eq("studentId", args.studentId)
      )
      .first();

    if (!link) {
      throw new Error("الرابط غير موجود");
    }

    await ctx.db.delete(link._id);

    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "UNLINK_PARENT_STUDENT",
      resourceType: "parentStudentLink",
      resourceId: link._id,
      details: {
        parentId: args.parentId,
        studentId: args.studentId,
        deletedBy: admin.email,
      },
      createdAt: Date.now(),
    });
    
    return { success: true };
  },
});

// جلب أبناء ولي الأمر
export const getChildrenByParent = query({
  args: { parentId: v.id("users") },
  handler: async (ctx, args) => {
    const currentUser = await getAuthUser(ctx);
    // ✅ Return [] instead of throwing — page renders empty not crashed
    if (!currentUser) return [];
 
    const isAdmin = currentUser.role === "admin";
    const isSelf  = currentUser._id === args.parentId;
 
    if (!isAdmin && !isSelf) return [];
 
    const links = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent", (q: any) => q.eq("parentId", args.parentId))
      .collect();
 
    const students = await Promise.all(
      links.map(async (link) => {
        const student = await ctx.db.get(link.studentId);
        if (!student) return null;
 
        // ✅ Resolve grade name — check gradeId first, then grade string
        let gradeName = "غير محدد";
        if (student.gradeId) {
          const grade = await ctx.db.get(student.gradeId);
          if (grade) gradeName = grade.name || grade.nameEn || "غير محدد";
        } else if (student.grade) {
          gradeName = student.grade;
        }
 
        // ✅ Resolve group name
        let groupName = "غير محدد";
        if (student.groupId) {
          const group = await ctx.db.get(student.groupId);
          if (group) groupName = group.name || "غير محدد";
        }
 
        return {
          _id:          student._id,
          name:         student.name,
          studentId:    student.studentId,
          status:       student.status ?? "غير نشط",
          grade:        gradeName,
          gradeName,
          groupName,
          relationship: link.relationship,
          isPrimary:    link.isPrimary,
          permissions:  link.permissions,
        };
      })
    );
 
    return students.filter(Boolean);
  },
});

// جلب أولياء أمر الطالب
export const getParentsByStudent = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const links = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();
    
    const parents = await Promise.all(
      links.map(async (link) => {
        const parent = await ctx.db.get(link.parentId);
        if (!parent) return null;
        
        return {
          ...parent,
          relationship: link.relationship,
          isPrimary: link.isPrimary,
          permissions: link.permissions,
        };
      })
    );
    
    return parents.filter(Boolean);
  },
});

// تحديث صلاحيات ولي أمر على طالب معين
export const updateParentPermissions = mutation({
  args: {
    parentId: v.id("users"),
    studentId: v.id("users"),
    permissions: v.object({
      viewGrades: v.boolean(),
      financialAccess: v.boolean(),
      pickupNotification: v.boolean(),
      emergencyContact: v.boolean(),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    const link = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent_student", (q) =>
        q.eq("parentId", args.parentId).eq("studentId", args.studentId)
      )
      .first();

    if (!link) {
      throw new Error("الرابط غير موجود");
    }

    await ctx.db.patch(link._id, {
      permissions: args.permissions,
    });

    return { success: true };
  },
});

// ✅ إصلاح دالة getAllParentStudentLinks - إزالة take()
export const getAllParentStudentLinks = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("مطلوب صلاحيات مشرف");
    }

    // ✅ التصحيح: استخدام collect() مباشرة بدلاً من take()
    const links = await ctx.db
      .query("parentStudentLinks")
      .collect();
    
    // جلب البيانات الكاملة لكل رابط
    const fullLinks = await Promise.all(
      links.map(async (link) => {
        const parent = await ctx.db.get(link.parentId);
        const student = await ctx.db.get(link.studentId);
        
        return {
          ...link,
          parent: parent ? {
            _id: parent._id,
            name: parent.name,
            email: parent.email,
          } : null,
          student: student ? {
            _id: student._id,
            name: student.name,
            studentId: student.studentId,
          } : null,
        };
      })
    );
    
    return fullLinks;
  },
});

// ✅ إزالة طفل من أبناء ولي الأمر
export const removeChild = mutation({
  args: {
    parentId: v.id("users"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!currentUser) throw new Error("المستخدم غير موجود");

    // ✅ التحقق من الصلاحية: ولي الأمر نفسه أو أدمن
    const isAdmin = currentUser.role === "admin";
    const isSelf = currentUser._id === args.parentId;

    if (!isAdmin && !isSelf) {
      throw new Error("غير مصرح: يمكنك فقط إزالة أبنائك");
    }

    // ✅ البحث عن الرابط
    const link = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent_student", (q) =>
        q.eq("parentId", args.parentId).eq("studentId", args.studentId)
      )
      .first();

    if (!link) {
      throw new Error("الرابط غير موجود");
    }

    // ✅ حذف الرابط
    await ctx.db.delete(link._id);

    // ✅ تسجيل في سجل التدقيق
    await ctx.db.insert("auditLogs", {
      userId: currentUser._id,
      action: "REMOVE_CHILD",
      resourceType: "parentStudentLink",
      resourceId: link._id,
      details: {
        parentId: args.parentId,
        studentId: args.studentId,

      },
      createdAt: Date.now(),
    });

    return { success: true };
  },
});


// ✅ تصدير الدوال
export const parentStudent = {
  linkParentToStudent,
  unlinkParentFromStudent,
  getChildrenByParent,
  getParentsByStudent,
  updateParentPermissions,
  getAllParentStudentLinks,
  removeChild, // ✅ أضف هذه الدالة
};