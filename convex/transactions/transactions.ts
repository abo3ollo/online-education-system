// convex/transactions/transactions.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";

// ── إنشاء معاملة جديدة ──────────────────────────────────────────
export const createTransaction = mutation({
  args: {
    studentId: v.id("users"),
    parentId: v.optional(v.id("users")),
    type: v.union(
      v.literal("platform"),
      v.literal("aptitude"),
      v.literal("academic"),
      v.literal("purchase")
    ),
    category: v.string(),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("refunded"),
      v.literal("failed")
    ),
    referenceId: v.string(),
    referenceType: v.string(),
    description: v.string(),
    descriptionAr: v.string(),
    paymentProof: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("الطالب غير موجود");

    const transactionId = await ctx.db.insert("transactions", {
      ...args,
      createdAt: Date.now(),
    });

    return { success: true, transactionId };
  },
});

// ── جلب معاملات طالب معين ──────────────────────────────────────
export const getStudentTransactions = query({
  args: {
    studentId: v.id("users"),
    type: v.optional(v.union(
      v.literal("platform"),
      v.literal("aptitude"),
      v.literal("academic"),
      v.literal("purchase")
    )),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("refunded"),
      v.literal("failed")
    )),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    let transactions = await ctx.db
      .query("transactions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();

    if (args.type) {
      transactions = transactions.filter((t) => t.type === args.type);
    }

    if (args.status) {
      transactions = transactions.filter((t) => t.status === args.status);
    }

    if (args.startDate) {
      transactions = transactions.filter((t) => t.createdAt >= args.startDate!);
    }

    if (args.endDate) {
      transactions = transactions.filter((t) => t.createdAt <= args.endDate!);
    }

    const student = await ctx.db.get(args.studentId);

    return transactions.map((t) => ({
      ...t,
      studentName: student?.name || "غير معروف",
      studentEmail: student?.email || "",
    }));
  },
});

// ✅ جلب معاملات حسب المسار
export const getTransactionsByTrack = query({
  args: {
    studentId: v.id("users"),
    track: v.union(
      v.literal("platform"),
      v.literal("aptitude"),
      v.literal("academic")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    return transactions.filter((t) => {
      if (args.track === "platform") return t.type === "platform";
      if (args.track === "aptitude") return t.type === "aptitude";
      if (args.track === "academic") return t.type === "academic" || t.category === "academic";
      return false;
    });
  },
});

// ── جلب جميع المعاملات (للأدمن) ──────────────────────────────
export const getAllTransactions = query({
  args: {
    type: v.optional(v.union(
      v.literal("platform"),
      v.literal("aptitude"),
      v.literal("academic"),
      v.literal("purchase")
    )),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("refunded"),
      v.literal("failed")
    )),
    searchQuery: v.optional(v.string()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "admin") {
      throw new Error("غير مصرح: فقط الأدمن يمكنه الوصول");
    }

    // ✅ جلب جميع المعاملات من جميع المصادر
    const platformTransactions = await ctx.db.query("transactions").collect();
    const aptitudePurchases = await ctx.db.query("aptitudePurchases").collect();
    const academicPurchases = await ctx.db.query("academicPurchases").collect();

    // ✅ تحويل طلبات القدرات إلى معاملات
    const aptitudeTxs = await Promise.all(
      aptitudePurchases.map(async (p) => {
        const teacher = await ctx.db.get(p.teacherId);
        const student = await ctx.db.get(p.studentId);
        return {
          _id: p._id,
          studentId: p.studentId,
          studentName: student?.name || "غير معروف",
          studentEmail: student?.email || "",
          type: "aptitude",
          category: "القدرات",
          description: `شراء مواد قدرات - ${teacher?.name || "معلم"}`,
          descriptionAr: `شراء مواد قدرات - ${teacher?.name || "معلم"}`,
          amount: p.amount || 0,
          currency: "EGP",
          status: p.status || "pending",
          referenceId: p._id,
          referenceType: "aptitude_purchase",
          paymentProof: p.paymentProof || null,
          createdAt: p.createdAt || Date.now(),
          updatedAt: p.updatedAt || null,
          teacherName: teacher?.name || "غير معروف",
          isAptitude: true,
          isAcademic: false,
          typeIcon: "🎯",
        };
      })
    );

    // ✅ تحويل طلبات التحصيلي إلى معاملات
    const academicTxs = await Promise.all(
      academicPurchases.map(async (p) => {
        const teacher = await ctx.db.get(p.teacherId);
        const student = await ctx.db.get(p.studentId);
        return {
          _id: p._id,
          studentId: p.studentId,
          studentName: student?.name || "غير معروف",
          studentEmail: student?.email || "",
          type: "academic",
          category: "التحصيلي",
          description: `شراء مواد تحصيلي - ${teacher?.name || "معلم"}`,
          descriptionAr: `شراء مواد تحصيلي - ${teacher?.name || "معلم"}`,
          amount: p.amount || 0,
          currency: p.currency || "EGP",
          status: p.status || "pending",
          referenceId: p._id,
          referenceType: "academic_purchase",
          paymentProof: p.paymentProof || null,
          createdAt: p.createdAt || Date.now(),
          updatedAt: p.updatedAt || null,
          teacherName: teacher?.name || "غير معروف",
          isAptitude: false,
          isAcademic: true,
          typeIcon: "📚",
        };
      })
    );

    // ✅ دمج جميع المعاملات
    let allTransactions = [
      ...platformTransactions.map((t) => ({
        ...t,
        typeIcon: t.type === "platform" ? "💻" : "🛒",
        isAptitude: false,
        isAcademic: false,
        studentName: "",
        studentEmail: "",
        teacherName: "",
      })),
      ...aptitudeTxs,
      ...academicTxs,
    ];

    // ✅ إضافة أسماء الطلاب للمعاملات من المنصة
    allTransactions = await Promise.all(
      allTransactions.map(async (t) => {
        if (!t.studentName && t.studentId) {
          const student = await ctx.db.get(t.studentId);
          return {
            ...t,
            studentName: student?.name || "غير معروف",
            studentEmail: student?.email || "",
          };
        }
        return t;
      })
    );

    // ✅ فلترة حسب النوع
    if (args.type) {
      allTransactions = allTransactions.filter((t) => t.type === args.type);
    }

    // ✅ فلترة حسب الحالة
    if (args.status) {
      allTransactions = allTransactions.filter((t) => t.status === args.status);
    }

    // ✅ فلترة حسب البحث
    if (args.searchQuery) {
      const search = args.searchQuery.toLowerCase();
      allTransactions = allTransactions.filter((t) => {
        const studentName = t.studentName?.toLowerCase() || "";
        const description = t.description?.toLowerCase() || "";
        const descriptionAr = t.descriptionAr?.toLowerCase() || "";
        return studentName.includes(search) || description.includes(search) || descriptionAr.includes(search);
      });
    }

    // ✅ فلترة حسب التاريخ
    if (args.startDate) {
      allTransactions = allTransactions.filter((t) => t.createdAt >= args.startDate!);
    }
    if (args.endDate) {
      allTransactions = allTransactions.filter((t) => t.createdAt <= args.endDate!);
    }

    // ✅ ترتيب من الأحدث للأقدم
    allTransactions.sort((a, b) => b.createdAt - a.createdAt);

    // ✅ تطبيق الحد الأقصى
    if (args.limit) {
      allTransactions = allTransactions.slice(0, args.limit);
    }

    return allTransactions;
  },
});

// ── تحديث حالة المعاملة ──────────────────────────────────────
export const updateTransactionStatus = mutation({
  args: {
    transactionId: v.id("transactions"),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("refunded"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const transaction = await ctx.db.get(args.transactionId);
    if (!transaction) throw new Error("المعاملة غير موجودة");

    await ctx.db.patch(args.transactionId, {
      status: args.status,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ تحديث حالة المعاملة حسب referenceId (للأدمن)
export const updateTransactionStatusByReference = mutation({
  args: {
    referenceId: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("refunded"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const admin = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!admin || admin.role !== "admin") {
      throw new Error("غير مصرح: فقط الأدمن يمكنه الوصول");
    }

    const transactions = await ctx.db
      .query("transactions")
      .withIndex("by_reference", (q) => q.eq("referenceId", args.referenceId))
      .collect();

    if (transactions.length === 0) {
      throw new Error("لا توجد معاملات مرتبطة بهذا المرجع");
    }

    for (const tx of transactions) {
      await ctx.db.patch(tx._id, {
        status: args.status,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.insert("auditLogs", {
      userId: admin._id,
      action: "UPDATE_TRANSACTION_STATUS_BY_REFERENCE",
      resourceType: "transaction",
      resourceId: args.referenceId,
      details: {
        updatedBy: admin.email,
      },
      createdAt: Date.now(),
    });

    return { success: true, updatedCount: transactions.length };
  },
});

// ── إحصائيات المعاملات ──────────────────────────────────────
export const getTransactionStats = query({
  args: {
    studentId: v.optional(v.id("users")),
    parentId: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    // ✅ جلب جميع المعاملات من جميع المصادر
    const platformTransactions = await ctx.db.query("transactions").collect();
    const aptitudePurchases = await ctx.db.query("aptitudePurchases").collect();
    const academicPurchases = await ctx.db.query("academicPurchases").collect();

    // ✅ دمج الكل
    let allTransactions: any[] = [
      ...platformTransactions,
      ...aptitudePurchases.map((p) => ({ ...p, type: "aptitude" })),
      ...academicPurchases.map((p) => ({ ...p, type: "academic" })),
    ];

    // ✅ فلترة حسب الطالب إذا كان موجوداً
    if (args.studentId) {
      allTransactions = allTransactions.filter((t) => t.studentId === args.studentId);
    }
    if (args.parentId) {
      allTransactions = allTransactions.filter((t) => t.parentId === args.parentId);
    }

    const stats = {
      totalAmount: 0,
      totalCount: allTransactions.length,
      completedCount: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      refundedCount: 0,
      failedCount: 0,
      platformTotal: 0,
      aptitudeTotal: 0,
      academicTotal: 0,
      purchaseTotal: 0,
    };

    for (const t of allTransactions) {
      stats.totalAmount += t.amount || 0;

      switch (t.status) {
        case "completed":
          stats.completedCount++;
          break;
        case "pending":
          stats.pendingCount++;
          break;
        case "approved":
          stats.approvedCount++;
          break;
        case "rejected":
          stats.rejectedCount++;
          break;
        case "refunded":
          stats.refundedCount++;
          break;
        case "failed":
          stats.failedCount++;
          break;
      }

      switch (t.type) {
        case "platform":
          stats.platformTotal += t.amount || 0;
          break;
        case "aptitude":
          stats.aptitudeTotal += t.amount || 0;
          break;
        case "academic":
          stats.academicTotal += t.amount || 0;
          break;
        case "purchase":
          stats.purchaseTotal += t.amount || 0;
          break;
      }
    }

    return stats;
  },
});

// convex/transactions/transactions.ts

// ✅ جلب معاملات أبناء ولي الأمر (محسّن بالكامل)
export const getChildrenTransactions = query({
  args: {
    parentId: v.id("users"),
    childId: v.optional(v.id("users")),
    type: v.optional(v.union(
      v.literal("platform"),
      v.literal("aptitude"),
      v.literal("academic"),
      v.literal("purchase")
    )),
    status: v.optional(v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("refunded"),
      v.literal("failed")
    )),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    if (user.role !== "parent" && user.role !== "admin") {
      throw new Error("غير مصرح: فقط ولي الأمر أو الأدمن يمكنه الوصول");
    }

    if (user.role === "parent" && user._id !== args.parentId) {
      throw new Error("غير مصرح: يمكنك فقط رؤية معاملات أبنائك");
    }

    // ✅ 1. جلب جميع أبناء ولي الأمر
    const children = await ctx.db
      .query("users")
      .withIndex("by_parentId", (q) => q.eq("parentId", args.parentId))
      .collect();

    // ✅ 2. أيضاً جلب الأبناء من جدول parentStudentLinks
    const links = await ctx.db
      .query("parentStudentLinks")
      .withIndex("by_parent", (q) => q.eq("parentId", args.parentId))
      .collect();

    const linkedChildIds = links.map(l => l.studentId);

    // ✅ دمج المعرفات (مع تجنب التكرار)
    const allChildIds = new Set([
      ...children.map(c => c._id),
      ...linkedChildIds
    ]);

    // ✅ 3. جلب جميع المعاملات من جدول transactions
    const allTransactions = await ctx.db.query("transactions").collect();

    // ✅ 4. فلترة المعاملات التي تخص أبناء ولي الأمر
    let filtered = allTransactions.filter((t) => 
      allChildIds.has(t.studentId)
    );

    // ✅ 5. أيضاً جلب المعاملات التي تحتوي على parentId مباشرة
    const parentTransactions = allTransactions.filter((t) => 
      t.parentId === args.parentId
    );

    // ✅ دمج الكل مع تجنب التكرار
    const mergedById = new Map();
    [...filtered, ...parentTransactions].forEach(t => {
      if (!mergedById.has(t._id)) {
        mergedById.set(t._id, t);
      }
    });
    filtered = Array.from(mergedById.values());

    // ✅ 6. جلب طلبات القدرات والتحصيلي
    const aptitudePurchases = await ctx.db
      .query("aptitudePurchases")
      .collect();
    
    const academicPurchases = await ctx.db
      .query("academicPurchases")
      .collect();

    // ✅ فلترة حسب أبناء ولي الأمر
    const aptitudeFiltered = aptitudePurchases.filter((p) => 
      allChildIds.has(p.studentId)
    );
    const academicFiltered = academicPurchases.filter((p) => 
      allChildIds.has(p.studentId)
    );

    // ✅ 7. جلب أسماء المعلمين لطلبات القدرات والتحصيلي
    const aptitudeWithTeachers = await Promise.all(
      aptitudeFiltered.map(async (p) => {
        let teacherName = "";
        if (p.teacherId) {
          const teacher = await ctx.db.get(p.teacherId);
          if (teacher && 'name' in teacher) {
            teacherName = (teacher as any).name || "";
          }
        }
        return {
          ...p,
          teacherName,
        };
      })
    );

    const academicWithTeachers = await Promise.all(
      academicFiltered.map(async (p) => {
        let teacherName = "";
        if (p.teacherId) {
          const teacher = await ctx.db.get(p.teacherId);
          if (teacher && 'name' in teacher) {
            teacherName = (teacher as any).name || "";
          }
        }
        return {
          ...p,
          teacherName,
        };
      })
    );

    // ✅ 8. دمج جميع المعاملات مع إنشاء الحقول المفقودة
    let allMerged: any[] = [
      // معاملات المنصة
      ...filtered.map(t => ({
        ...t,
        teacherName: "",
        typeLabel: t.type,
        descriptionAr: t.descriptionAr || t.description || "معاملة منصة",
        description: t.description || t.descriptionAr || "Platform transaction",
      })),
      // طلبات القدرات
      ...aptitudeWithTeachers.map((p) => ({ 
        ...p, 
        type: "aptitude" as const,
        description: `شراء مواد قدرات${p.teacherName ? ` - ${p.teacherName}` : ''}`,
        descriptionAr: `شراء مواد قدرات${p.teacherName ? ` - ${p.teacherName}` : ''}`,
        amount: p.amount || 0,
        currency: "EGP",
        status: p.status || "pending",
        createdAt: p.createdAt || Date.now(),
        referenceId: p._id,
        referenceType: "aptitude_purchase",
        category: "القدرات",
        typeLabel: "aptitude",
        studentId: p.studentId,
        parentId: args.parentId,
      })),
      // طلبات التحصيلي
      ...academicWithTeachers.map((p) => ({ 
        ...p, 
        type: "academic" as const,
        description: `شراء مواد تحصيلي${p.teacherName ? ` - ${p.teacherName}` : ''}`,
        descriptionAr: `شراء مواد تحصيلي${p.teacherName ? ` - ${p.teacherName}` : ''}`,
        amount: p.amount || 0,
        currency: p.currency || "EGP",
        status: p.status || "pending",
        createdAt: p.createdAt || Date.now(),
        referenceId: p._id,
        referenceType: "academic_purchase",
        category: "التحصيلي",
        typeLabel: "academic",
        studentId: p.studentId,
        parentId: args.parentId,
      })),
    ];

    // ✅ 9. فلترة حسب الطفل المحدد
    if (args.childId) {
      allMerged = allMerged.filter((t) => t.studentId === args.childId);
    }

    // ✅ 10. فلترة حسب النوع
    if (args.type) {
      allMerged = allMerged.filter((t) => t.type === args.type);
    }

    // ✅ 11. فلترة حسب الحالة
    if (args.status) {
      allMerged = allMerged.filter((t) => t.status === args.status);
    }

    // ✅ 12. فلترة حسب التاريخ
    if (args.startDate) {
      allMerged = allMerged.filter((t) => (t.createdAt || 0) >= args.startDate!);
    }
    if (args.endDate) {
      allMerged = allMerged.filter((t) => (t.createdAt || 0) <= args.endDate!);
    }

    // ✅ 13. إضافة أسماء الطلاب
    const transactionsWithDetails = await Promise.all(
      allMerged.map(async (t) => {
        let studentName = "غير معروف";
        let studentEmail = "";
        let studentGrade = "غير محدد";
        
        try {
          const student = await ctx.db.get(t.studentId);
          if (student) {
            // ✅ استخدام any لتجاوز مشاكل TypeScript
            const studentAny = student as any;
            studentName = studentAny.name || "غير معروف";
            studentEmail = studentAny.email || "";
            studentGrade = studentAny.grade || "غير محدد";
          }
        } catch (e) {
          // تجاهل الأخطاء
        }

        // ✅ تحديد النوع بالعربي
        const typeMap: Record<string, string> = {
          platform: "منصة",
          aptitude: "قدرات",
          academic: "تحصيلي",
          purchase: "مشتريات",
        };

        // ✅ تحديد الحالة بالعربي
        const statusMap: Record<string, string> = {
          pending: "قيد المراجعة",
          completed: "مكتمل",
          approved: "موافق عليه",
          rejected: "مرفوض",
          refunded: "مرتجع",
          failed: "فشل",
        };

        return {
          ...t,
          studentName,
          studentEmail,
          studentGrade,
          teacherName: t.teacherName || "",
          typeLabel: typeMap[t.type] || t.type,
          statusLabel: statusMap[t.status] || t.status,
          uniqueId: `${t.type}_${t._id}`,
        };
      })
    );

    // ✅ 14. ترتيب من الأحدث للأقدم
    return transactionsWithDetails.sort((a, b) => 
      (b.createdAt || 0) - (a.createdAt || 0)
    );
  },
});

// ✅ جلب معاملات الطالب مع تفاصيل (Academic + Aptitude + Platform)
export const getStudentTransactionsWithDetails = query({
  args: {
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    // ✅ جلب معاملات المنصة
    const platformTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();

    // ✅ جلب طلبات القدرات مع أسماء المعلمين
    const aptitudePurchases = await ctx.db
      .query("aptitudePurchases")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();

    const aptitudeWithTeachers = await Promise.all(
      aptitudePurchases.map(async (p) => {
        const teacher = await ctx.db.get(p.teacherId);
        return {
          ...p,
          teacherName: teacher?.name || "غير معروف",
        };
      })
    );

    // ✅ جلب طلبات التحصيلي مع أسماء المعلمين
    const academicPurchases = await ctx.db
      .query("academicPurchases")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .order("desc")
      .collect();

    const academicWithTeachers = await Promise.all(
      academicPurchases.map(async (p) => {
        const teacher = await ctx.db.get(p.teacherId);
        return {
          ...p,
          teacherName: teacher?.name || "غير معروف",
        };
      })
    );

    const student = await ctx.db.get(args.studentId);

    // ✅ تحويل طلبات القدرات إلى معاملات
    const aptitudeTxs = aptitudeWithTeachers.map((p: any) => ({
      _id: p._id,
      studentId: p.studentId,
      studentName: student?.name || "غير معروف",
      studentEmail: student?.email || "",
      type: "aptitude" as const,
      category: "القدرات",
      description: `شراء مواد قدرات - ${p.teacherName || "معلم"}`,
      descriptionAr: `شراء مواد قدرات - ${p.teacherName || "معلم"}`,
      amount: p.amount || 0,
      currency: "EGP",
      status: p.status || "pending",
      referenceId: p._id,
      referenceType: "aptitude_purchase",
      paymentProof: p.paymentProof || null,
      createdAt: p.createdAt || Date.now(),
      updatedAt: p.updatedAt || null,
      teacherName: p.teacherName || "غير معروف",
      isAptitude: true,
      isAcademic: false,
      typeIcon: "🎯",
    }));

    // ✅ تحويل طلبات التحصيلي إلى معاملات
    const academicTxs = academicWithTeachers.map((p: any) => ({
      _id: p._id,
      studentId: p.studentId,
      studentName: student?.name || "غير معروف",
      studentEmail: student?.email || "",
      type: "academic" as const,
      category: "التحصيلي",
      description: `شراء مواد تحصيلي - ${p.teacherName || "معلم"}`,
      descriptionAr: `شراء مواد تحصيلي - ${p.teacherName || "معلم"}`,
      amount: p.amount || 0,
      currency: p.currency || "EGP",
      status: p.status || "pending",
      referenceId: p._id,
      referenceType: "academic_purchase",
      paymentProof: p.paymentProof || null,
      createdAt: p.createdAt || Date.now(),
      updatedAt: p.updatedAt || null,
      teacherName: p.teacherName || "غير معروف",
      isAptitude: false,
      isAcademic: true,
      typeIcon: "📚",
    }));

    // ✅ دمج جميع المعاملات
    const all = [
      ...platformTransactions.map((t) => ({
        ...t,
        typeIcon: t.type === "platform" ? "💻" : "🛒",
        isAptitude: false,
        isAcademic: false,
        teacherName: "",
      })),
      ...aptitudeTxs,
      ...academicTxs,
    ];

    // ✅ إضافة أسماء الطلاب
    const allWithDetails = all.map((t) => ({
      ...t,
      studentName: student?.name || "غير معروف",
      studentEmail: student?.email || "",
      uniqueKey: `${t.type}_${t._id}`,
    }));

    // ✅ ترتيب من الأحدث للأقدم
    return allWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ✅ جلب إحصائيات الطالب (مع Academic)
export const getStudentStats = query({
  args: {
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    // ✅ جلب جميع المعاملات من جميع المصادر
    const platformTransactions = await ctx.db
      .query("transactions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    const aptitudePurchases = await ctx.db
      .query("aptitudePurchases")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    const academicPurchases = await ctx.db
      .query("academicPurchases")
      .withIndex("by_studentId", (q) => q.eq("studentId", args.studentId))
      .collect();

    const stats = {
      totalAmount: 0,
      totalCount: 0,
      completedCount: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      refundedCount: 0,
      failedCount: 0,
      platformTotal: 0,
      aptitudeTotal: 0,
      academicTotal: 0,
      purchaseTotal: 0,
    };

    // ✅ حساب إحصائيات معاملات المنصة
    for (const t of platformTransactions) {
      stats.totalAmount += t.amount || 0;
      stats.totalCount++;

      switch (t.status) {
        case "completed":
          stats.completedCount++;
          break;
        case "pending":
          stats.pendingCount++;
          break;
        case "approved":
          stats.approvedCount++;
          break;
        case "rejected":
          stats.rejectedCount++;
          break;
        case "refunded":
          stats.refundedCount++;
          break;
        case "failed":
          stats.failedCount++;
          break;
      }

      switch (t.type) {
        case "platform":
          stats.platformTotal += t.amount || 0;
          break;
        case "purchase":
          stats.purchaseTotal += t.amount || 0;
          break;
      }
    }

    // ✅ حساب إحصائيات طلبات القدرات
    for (const p of aptitudePurchases) {
      stats.totalAmount += p.amount || 0;
      stats.totalCount++;
      stats.aptitudeTotal += p.amount || 0;

      switch (p.status) {
        case "approved":
          stats.approvedCount++;
          break;
        case "pending":
          stats.pendingCount++;
          break;
        case "rejected":
          stats.rejectedCount++;
          break;
      }
    }

    // ✅ حساب إحصائيات طلبات التحصيلي (Academic)
    for (const p of academicPurchases) {
      stats.totalAmount += p.amount || 0;
      stats.totalCount++;
      stats.academicTotal += p.amount || 0;

      switch (p.status) {
        case "approved":
          stats.approvedCount++;
          break;
        case "pending":
          stats.pendingCount++;
          break;
        case "rejected":
          stats.rejectedCount++;
          break;
      }
    }

    return stats;
  },
});

// ✅ تحديث parentId للمعاملات بناءً على علاقة ولي الأمر
export const updateTransactionParentIds = mutation({
  args: {
    parentId: v.id("users"),
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

    // ✅ جلب أبناء ولي الأمر
    const children = await ctx.db
      .query("users")
      .withIndex("by_parentId", (q) => q.eq("parentId", args.parentId))
      .collect();

    const childIds = children.map(c => c._id);

    // ✅ جلب جميع المعاملات التي تخص الأبناء ولكن بدون parentId
    const allTransactions = await ctx.db.query("transactions").collect();
    
    let updatedCount = 0;
    for (const tx of allTransactions) {
      if (childIds.includes(tx.studentId) && !tx.parentId) {
        await ctx.db.patch(tx._id, {
          parentId: args.parentId,
          updatedAt: Date.now(),
        });
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  },
});

// ✅ تحديث parentId لجميع معاملات أبناء ولي الأمر
export const updateChildrenTransactionsParentId = mutation({
  args: {
    parentId: v.id("users"),
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

    // ✅ جلب أبناء ولي الأمر
    const children = await ctx.db
      .query("users")
      .withIndex("by_parentId", (q) => q.eq("parentId", args.parentId))
      .collect();

    const childIds = new Set(children.map(c => c._id));

    // ✅ جلب جميع المعاملات
    const allTransactions = await ctx.db.query("transactions").collect();
    
    let updatedCount = 0;
    for (const tx of allTransactions) {
      if (childIds.has(tx.studentId) && !tx.parentId) {
        await ctx.db.patch(tx._id, {
          parentId: args.parentId,
          updatedAt: Date.now(),
        });
        updatedCount++;
      }
    }

    return { success: true, updatedCount };
  },
});

// ✅ تصدير الدوال
export const transactions = {
  createTransaction,
  getStudentTransactions,
  getTransactionsByTrack,
  getAllTransactions,
  updateTransactionStatus,
  updateTransactionStatusByReference,
  getTransactionStats,
  getChildrenTransactions,
  getStudentTransactionsWithDetails,
  getStudentStats,
  updateTransactionParentIds,
  updateChildrenTransactionsParentId,
};