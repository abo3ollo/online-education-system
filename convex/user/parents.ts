// convex/user/parents.ts
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Doc, Id } from "../_generated/dataModel";

// إضافة ولي أمر جديد
export const createParent = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phoneNumber: v.string(),
    workPhone: v.optional(v.string()),
    workAddress: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    nationalId: v.optional(v.string()),
    address: v.optional(v.string()),
    relationship: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
    children: v.optional(v.array(v.id("users"))),
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

    // Check if email exists
    const emailExists = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (emailExists) {
      throw new Error("البريد الإلكتروني موجود مسبقاً");
    }

    // Generate parent ID
    const parentId = `PAR${Date.now().toString().slice(-6)}`;

    // Create parent
    const parent = await ctx.db.insert("users", {
      clerkId: `parent_${parentId}`,
      name: args.name,
      email: args.email,
      phoneNumber: args.phoneNumber,
      role: "parent",
      status: args.status || "active",
      parentId,
      workPhone: args.workPhone,
      workAddress: args.workAddress,
      jobTitle: args.jobTitle,
      nationalId: args.nationalId,
      address: args.address,
      relationship: args.relationship,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create audit log
    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "CREATE_PARENT",
      resourceType: "user",
      resourceId: parent,
      details: {
        parentId,
        name: args.name,
        email: args.email,
        createdBy: admin.email,
      },
      createdAt: Date.now(),
    });

    return { success: true, parentId, userId: parent };
  },
});

// جلب جميع أولياء الأمور
export const getParents = query({
  args: {
    status: v.optional(v.string()),
    search: v.optional(v.string()),
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

    let parentsQuery = ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "parent"));

    if (args.status) {
      parentsQuery = parentsQuery.filter((q) => q.eq(q.field("status"), args.status));
    }

    let parents = await parentsQuery.collect();

    // Apply search filter
    if (args.search && args.search.trim() !== "") {
      const searchLower = args.search.toLowerCase();
      parents = parents.filter((parent) =>
        parent.name.toLowerCase().includes(searchLower) ||
        parent.email.toLowerCase().includes(searchLower) ||
        parent.parentId?.toLowerCase().includes(searchLower) ||
        parent.phoneNumber?.includes(args.search || "")
      );
    }

    // Get children count for each parent
    const parentsWithStats = await Promise.all(
      parents.map(async (parent) => {
        const links = await ctx.db
          .query("parentStudentLinks")
          .withIndex("by_parent", (q) => q.eq("parentId", parent._id))
          .collect();

        const children = await Promise.all(
          links.map(async (link) => {
            const student = await ctx.db.get(link.studentId);
            return {
              ...student,
              relationship: link.relationship,
              isPrimary: link.isPrimary,
            };
          })
        );

        return {
          ...parent,
          childrenCount: children.length,
          children,
        };
      })
    );

    return parentsWithStats;
  },
});

// جلب ولي أمر بواسطة ID
export const getParentById = query({
  args: { parentId: v.id("users") },
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

    const parent = await ctx.db.get(args.parentId);
    if (!parent || parent.role !== "parent") {
      throw new Error("ولي الأمر غير موجود");
    }

    const links = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent", (q) => q.eq("parentId", parent._id))
      .collect();

    const children = await Promise.all(
      links.map(async (link) => {
        const student = await ctx.db.get(link.studentId);
        return {
          ...student,
          relationship: link.relationship,
          isPrimary: link.isPrimary,
        };
      })
    );

    // Get available students for linking
    const allStudents = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "student"))
      .collect();

    const linkedStudentIds = new Set(children.map(c => c._id));
    const availableStudents = allStudents.filter(s => !linkedStudentIds.has(s._id));

    return {
      ...parent,
      children,
      availableStudents,
      childrenCount: children.length,
    };
  },
});

// تحديث ولي أمر
export const updateParent = mutation({
  args: {
    parentId: v.id("users"),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phoneNumber: v.optional(v.string()),
    workPhone: v.optional(v.string()),
    workAddress: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    nationalId: v.optional(v.string()),
    address: v.optional(v.string()),
    relationship: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"))),
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

    const parent = await ctx.db.get(args.parentId);
    if (!parent || parent.role !== "parent") {
      throw new Error("ولي الأمر غير موجود");
    }

    const updateData: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updateData.name = args.name;
    if (args.email !== undefined) updateData.email = args.email;
    if (args.phoneNumber !== undefined) updateData.phoneNumber = args.phoneNumber;
    if (args.workPhone !== undefined) updateData.workPhone = args.workPhone;
    if (args.workAddress !== undefined) updateData.workAddress = args.workAddress;
    if (args.jobTitle !== undefined) updateData.jobTitle = args.jobTitle;
    if (args.nationalId !== undefined) updateData.nationalId = args.nationalId;
    if (args.address !== undefined) updateData.address = args.address;
    if (args.relationship !== undefined) updateData.relationship = args.relationship;
    if (args.status !== undefined) updateData.status = args.status;

    await ctx.db.patch(args.parentId, updateData);

    return { success: true };
  },
});

// حذف ولي أمر
export const deleteParent = mutation({
  args: { parentId: v.id("users") },
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

    const parent = await ctx.db.get(args.parentId);
    if (!parent || parent.role !== "parent") {
      throw new Error("ولي الأمر غير موجود");
    }

    // Delete parent-student links
    const links = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent", (q) => q.eq("parentId", parent._id))
      .collect();

    for (const link of links) {
      await ctx.db.delete(link._id);
    }

    await ctx.db.delete(args.parentId);

    return { success: true };
  },
});

// إحصائيات أولياء الأمور
export const getParentsStats = query({
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

    const allParents = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "parent"))
      .collect();

    const active = allParents.filter((p) => p.status === "active").length;
    const inactive = allParents.filter((p) => p.status === "inactive").length;

    return {
      total: allParents.length,
      active,
      inactive,
    };
  },
});



// ✅ جلب درجات الطالب (لولي الأمر)
export const getStudentGrades = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const parent = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!parent || parent.role !== "parent") {
      throw new Error("مطلوب صلاحيات ولي أمر");
    }

    // التحقق من أن الطالب هو ابن ولي الأمر
    const link = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent_student", (q) =>
        q.eq("parentId", parent._id).eq("studentId", args.studentId)
      )
      .first();

    if (!link) {
      throw new Error("غير مصرح لك بمشاهدة درجات هذا الطالب");
    }

    // جلب درجات الامتحانات
    const examSubmissions = await ctx.db
      .query("examSubmissions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    const examGrades = await Promise.all(
      examSubmissions.map(async (sub) => {
        const exam = await ctx.db.get(sub.examId);
        return {
          ...sub,
          examTitle: exam?.title || "امتحان غير معروف",
          examSubject: exam?.subject || "غير محدد",
          examDate: exam?.date,
        };
      })
    );

    // جلب درجات الواجبات
    const assignmentSubmissions = await ctx.db
      .query("submissions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    const assignmentGrades = await Promise.all(
      assignmentSubmissions.map(async (sub) => {
        const assignment = await ctx.db.get(sub.assignmentId);
        return {
          ...sub,
          assignmentTitle: assignment?.title || "واجب غير معروف",
          assignmentDueDate: assignment?.dueDate,
        };
      })
    );

    return {
      examGrades,
      assignmentGrades,
    };
  },
});


// ✅ جلب المدفوعات (محسّن)
export const getPayments = query({
  args: {
    studentId: v.optional(v.id("users")),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const parent = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!parent || parent.role !== "parent") {
      throw new Error("مطلوب صلاحيات ولي أمر");
    }

    // ✅ جلب جميع المدفوعات (بدون استخدام Index غير موجود)
    const allPayments = await ctx.db.query("payments").collect();
    
    // ✅ تصفية المدفوعات الخاصة بولي الأمر
    let payments = allPayments.filter((p) => p.parentId === parent._id);

    // ✅ تصفية حسب الطالب إذا تم تحديده
    if (args.studentId) {
      payments = payments.filter((p) => p.studentId === args.studentId);
    }

    // ✅ تصفية حسب الحالة إذا تم تحديدها
    if (args.status) {
      payments = payments.filter((p) => p.status === args.status);
    }

    // ✅ جلب أسماء الطلاب
    const paymentsWithStudent = await Promise.all(
      payments.map(async (payment) => {
        try {
          const student = await ctx.db.get(payment.studentId);
          return {
            ...payment,
            studentName: student?.name || "طالب غير معروف",
          };
        } catch (error) {
          return {
            ...payment,
            studentName: "طالب غير معروف",
          };
        }
      })
    );

    // ✅ ترتيب من الأحدث للأقدم
    return paymentsWithStudent.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ✅ إنشاء دفعة جديدة
export const createPayment = mutation({
  args: {
    studentId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    paymentMethod: v.union(
      v.literal("card"),
      v.literal("bank_transfer"),
      v.literal("wallet"),
      v.literal("cash")
    ),
    description: v.string(),
    dueDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const parent = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!parent || parent.role !== "parent") {
      throw new Error("مطلوب صلاحيات ولي أمر");
    }

    // التحقق من أن الطالب هو ابن ولي الأمر
    const link = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent_student", (q) =>
        q.eq("parentId", parent._id).eq("studentId", args.studentId)
      )
      .first();

    if (!link) {
      throw new Error("غير مصرح لك بالدفع لهذا الطالب");
    }

    const paymentId = await ctx.db.insert("payments", {
      parentId: parent._id,
      studentId: args.studentId,
      amount: args.amount,
      currency: args.currency || "SAR",
      status: "pending",
      paymentMethod: args.paymentMethod,
      description: args.description,
      dueDate: args.dueDate,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, paymentId };
  },
});

// ✅ تحديث حالة الدفعة
export const updatePaymentStatus = mutation({
  args: {
    paymentId: v.id("payments"),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded")
    ),
    transactionId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const parent = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!parent || parent.role !== "parent") {
      throw new Error("مطلوب صلاحيات ولي أمر");
    }

    const payment = await ctx.db.get(args.paymentId);
    if (!payment) throw new Error("الدفعة غير موجودة");

    if (payment.parentId !== parent._id) {
      throw new Error("غير مصرح لك بتحديث هذه الدفعة");
    }

    await ctx.db.patch(args.paymentId, {
      status: args.status,
      transactionId: args.transactionId,
      paymentDate: args.status === "completed" ? Date.now() : undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});


// ✅ جلب أبناء ولي الأمر
export const getParentChildren = query({
  args: {
    parentId: v.id("users"),
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
      throw new Error("غير مصرح: يمكنك فقط رؤية أبنائك");
    }

    // ✅ جلب روابط الأبناء
    const links = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();

    // ✅ جلب بيانات الطلاب مع معلومات الصف والمجموعة
    const children = await Promise.all(
      links.map(async (link) => {
        const student = await ctx.db.get(link.studentId);
        if (!student) return null;

        // ✅ جلب اسم الصف
        let gradeName = "غير محدد";
        if (student.gradeId) {
          const grade = await ctx.db.get(student.gradeId);
          if (grade) gradeName = grade.name || "غير محدد";
        } else if (student.grade) {
          gradeName = student.grade;
        }

        // ✅ جلب اسم المجموعة
        let groupName = "غير محدد";
        if (student.groupId) {
          const group = await ctx.db.get(student.groupId);
          if (group) groupName = group.name || "غير محدد";
        }

        return {
          _id: student._id,
          name: student.name,
          email: student.email,
          phoneNumber: student.phoneNumber,
          studentId: student.studentId,
          gradeName,
          gradeId: student.gradeId,
          groupName,
          groupId: student.groupId,
          birthDate: student.birthDate,
          gender: student.gender,
          status: student.status || "pending",
          relationship: link.relationship,
          isPrimary: link.isPrimary,
          permissions: link.permissions,
          createdAt: student.createdAt,
          updatedAt: student.updatedAt,
        };
      })
    );

    return children.filter(Boolean);
  },
});



// ✅ جلب معاملات الأبناء (بديل عن getChildrenTransactions)
export const getChildrenWithTransactions = query({
  args: {
    parentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const parent = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!parent || parent.role !== "parent") {
      throw new Error("مطلوب صلاحيات ولي أمر");
    }

    // ✅ جلب الأبناء
    const links = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();

    const childIds = links.map(l => l.studentId);

    // ✅ جلب بيانات الأبناء
    const children = await Promise.all(
      childIds.map(async (id) => {
        const user = await ctx.db.get(id);
        return user;
      })
    );

    // ✅ جلب المعاملات لكل ابن
    const allTransactions = await ctx.db.query("transactions").collect();

    const childrenWithData = await Promise.all(
      children.map(async (child) => {
        if (!child) return null;

        // ✅ جلب معاملات هذا الطفل
        const childTransactions = allTransactions.filter(
          (t) => t.studentId === child._id
        );

        // ✅ جلب طلبات القدرات
        const aptitudePurchases = await ctx.db
          .query("aptitudePurchases")
          .withIndex("by_studentId", (q) => q.eq("studentId", child._id))
          .collect();

        // ✅ جلب طلبات التحصيلي
        const academicPurchases = await ctx.db
          .query("academicPurchases")
          .withIndex("by_studentId", (q) => q.eq("studentId", child._id))
          .collect();

        // ✅ دمج الكل
        const allMerged = [
          ...childTransactions,
          ...aptitudePurchases.map((p) => ({ ...p, type: "aptitude" })),
          ...academicPurchases.map((p) => ({ ...p, type: "academic" })),
        ];

        // ✅ ترتيب من الأحدث
        allMerged.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // ✅ حساب الإحصائيات
        const totalPaid = allMerged
          .filter((t) => t.status === "completed" || t.status === "approved")
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        const totalPending = allMerged
          .filter((t) => t.status === "pending")
          .reduce((sum, t) => sum + (t.amount || 0), 0);

        return {
          ...child,
          transactions: allMerged,
          paymentStats: {
            totalPaid,
            totalPending,
            count: allMerged.length,
          },
          subscriptionStatus: allMerged.length > 0 ? 
            (allMerged[0]?.status === "completed" || allMerged[0]?.status === "approved" ? "active" : "pending") 
            : "inactive",
        };
      })
    );

    return childrenWithData.filter(Boolean);
  },
});

// ✅ تصدير الدوال
export const parents = {
  createParent,
  getParents,
  getParentById,
  updateParent,
  deleteParent,
  getParentsStats,
  getStudentGrades,
  getPayments,
  createPayment,
  updatePaymentStatus,
  getParentChildren,
  getChildrenWithTransactions
};