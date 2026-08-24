// convex/exams/exams.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ============================================
// QUERIES
// ============================================

// ✅ جلب جميع الامتحانات
export const getExams = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    )),
    courseId: v.optional(v.id("courses")),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    let exams = await ctx.db.query("exams").collect();

    if (args.status) {
      exams = exams.filter((e) => e.status === args.status);
    }
    if (args.courseId) {
      exams = exams.filter((e) => e.courseId === args.courseId);
    }
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      exams = exams.filter((e) =>
        e.title.toLowerCase().includes(searchLower) ||
        e.subject.toLowerCase().includes(searchLower)
      );
    }

    // جلب معلومات إضافية
    const examsWithDetails = await Promise.all(
      exams.map(async (exam) => {
        const creator = await ctx.db.get(exam.createdBy);
        
        // جلب عدد الطلاب الذين سلموا
        const submissions = await ctx.db
          .query("examSubmissions")
          .withIndex("by_exam", (q) => q.eq("examId", exam._id))
          .collect();

        return {
          ...exam,
          questionsCount: exam.questions.length,
          submissionsCount: submissions.length,
          creatorName: creator?.name || "غير معروف",
        };
      })
    );

    return examsWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ✅ جلب امتحان بواسطة ID مع تفاصيل الأسئلة
export const getExamById = query({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("الامتحان غير موجود");

    // ✅ جلب المجموعات
    const groups = await Promise.all(
      (exam.groupIds || []).map(async (groupId: Id<"groups">) => {
        const group = await ctx.db.get(groupId);
        return group;
      })
    );

    // ✅ جلب الصف
    const grade = exam.gradeId ? await ctx.db.get(exam.gradeId) : null;

    // جلب الأسئلة
    const examQuestions = exam.questions || [];
    const questions = await Promise.all(
      examQuestions.map(async (eq) => {
        const q = await ctx.db.get(eq.questionId);
        return {
          ...eq,
          question: q,
        };
      })
    );

    const creator = await ctx.db.get(exam.createdBy);

    return {
      ...exam,
      groups: groups.filter(Boolean),
      grade: grade,
      questions: questions.filter((q) => q.question !== null),
      creatorName: creator?.name || "غير معروف",
    };
  },
});

// ✅ جلب امتحانات الطالب
export const getStudentExams = query({
  args: {
    status: v.optional(v.union(
      v.literal("all"),
      v.literal("pending"),
      v.literal("submitted"),
      v.literal("graded"),
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const student = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!student || student.role !== "student") {
      throw new Error("مطلوب صلاحيات طالب");
    }

    // ✅ جلب المجموعات المسجل فيها الطالب
    const allGroups = await ctx.db.query("groups").collect();
    const studentGroupIds = allGroups
      .filter((g) => g.students && g.students.includes(student._id))
      .map((g) => g._id);

    // ✅ جلب صف الطالب
    const studentGradeId = student.gradeId;

    // جلب الامتحانات المنشورة
    let exams = await ctx.db.query("exams").collect();
    
    // ✅ فلترة الامتحانات المتاحة للطالب
    exams = exams.filter((e) => {
      if (e.status !== "published") return false;
      
      // ✅ إذا كان الامتحان له مجموعات محددة
      if (e.groupIds && e.groupIds.length > 0) {
        return e.groupIds.some(id => studentGroupIds.includes(id));
      }
      
      // ✅ إذا كان الامتحان للصف كامل
      if (e.gradeId && studentGradeId && e.gradeId === studentGradeId) {
        return true;
      }
      
      // ✅ للتوافق القديم - classIds
      if (e.classIds && e.classIds.length > 0) {
        return e.classIds.some(id => student.classId === id);
      }
      
      return false;
    });

    // جلب تسليمات الطالب
    const submissions = await ctx.db
      .query("examSubmissions")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .collect();

    const examsWithStatus = await Promise.all(
      exams.map(async (exam) => {
        const submission = submissions.find(
          (s) => s.examId === exam._id
        );

        // ✅ جلب اسم الصف والمجموعات للعرض
        let gradeName = "غير محدد";
        if (exam.gradeId) {
          const grade = await ctx.db.get(exam.gradeId);
          if (grade) {
            gradeName = grade.name;
          }
        }

        const groupNames = await Promise.all(
          (exam.groupIds || []).map(async (groupId) => {
            const group = await ctx.db.get(groupId);
            return group?.name || "مجموعة غير معروفة";
          })
        );

        let status = "pending";
        if (submission) {
          if (submission.status === "graded") {
            status = "graded";
          } else {
            status = "submitted";
          }
        }

        return {
          ...exam,
          submission,
          status,
          gradeName,
          groupNames: groupNames.join(", "),
        };
      })
    );

    // فلترة حسب الحالة
    let filtered = examsWithStatus;
    if (args.status && args.status !== "all") {
      filtered = filtered.filter((e) => e.status === args.status);
    }

    return filtered.sort((a, b) => a.date - b.date);
  },
});
// convex/exams/exams.ts

// ✅ جلب الامتحانات القادمة للطالب
export const getUpcomingForStudent = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const student = await ctx.db.get(args.studentId);
    if (!student || student.role !== "student") {
      throw new Error("الطالب غير موجود");
    }

    // جلب جميع الامتحانات المنشورة
    const allExams = await ctx.db
      .query("exams")
      .withIndex("by_status", (q) => q.eq("status", "published"))
      .collect();

    // فلترة الامتحانات التي تخص الطالب
    const studentExams = allExams.filter((exam) => {
      // التحقق من أن الامتحان للصف الخاص بالطالب
      if (exam.gradeId && student.gradeId) {
        return exam.gradeId === student.gradeId;
      }
      return false;
    });

    // فلترة الامتحانات القادمة (التاريخ في المستقبل)
    const now = Date.now();
    const upcoming = studentExams
      .filter((e) => e.date > now)
      .sort((a, b) => a.date - b.date);

    return upcoming;
  },
});



// ✅ جلب امتحانات المعلم (الخاصة بمجموعاته فقط)
export const getTeacherExams = query({
  args: {
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    )),
    search: v.optional(v.string()),
    gradeId: v.optional(v.id("grades")),
    groupId: v.optional(v.id("groups")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || user.role !== "teacher") {
      throw new Error("مطلوب صلاحيات معلم");
    }

    // ✅ جلب جميع المجموعات التي يتبعها المعلم (مشرف أو مدرس)
    const allGroups = await ctx.db.query("groups").collect();
    const teacherGroupIds = allGroups
      .filter((g) => 
        g.supervisorId === user._id || 
        (g.teachers && g.teachers.includes(user._id))
      )
      .map((g) => g._id);

    // ✅ جلب جميع الامتحانات
    let exams = await ctx.db.query("exams").collect();

    // ✅ فلترة الامتحانات:
    // 1. التي أنشأها المعلم
    // 2. أو التي تخص مجموعاته (groupIds تتضمن مجموعة من مجموعاته)
    exams = exams.filter((exam) => {
      // الامتحان منشأ بواسطة المعلم
      const isCreatedByTeacher = exam.createdBy === user._id;
      
      // الامتحان يخص مجموعة من مجموعات المعلم
      const isForTeacherGroup = exam.groupIds && exam.groupIds.some((groupId) => 
        teacherGroupIds.includes(groupId)
      );

      return isCreatedByTeacher || isForTeacherGroup;
    });

    // فلترة حسب الحالة
    if (args.status) {
      exams = exams.filter((e) => e.status === args.status);
    }

    // فلترة حسب الصف
    if (args.gradeId) {
      exams = exams.filter((e) => e.gradeId === args.gradeId);
    }

    // فلترة حسب المجموعة
    if (args.groupId) {
      exams = exams.filter((e) => 
        e.groupIds && e.groupIds.includes(args.groupId as Id<"groups">)
      );
    }

    // فلترة حسب البحث
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      exams = exams.filter((e) =>
        e.title.toLowerCase().includes(searchLower) ||
        e.subject.toLowerCase().includes(searchLower)
      );
    }

    // جلب معلومات إضافية
    const examsWithDetails = await Promise.all(
      exams.map(async (exam) => {
        const creator = await ctx.db.get(exam.createdBy);
        
        // جلب عدد الطلاب الذين سلموا
        const submissions = await ctx.db
          .query("examSubmissions")
          .withIndex("by_exam", (q) => q.eq("examId", exam._id))
          .collect();

        // جلب أسماء المجموعات
        const groupNames = await Promise.all(
          (exam.groupIds || []).map(async (groupId) => {
            const group = await ctx.db.get(groupId);
            return group?.name || "مجموعة غير معروفة";
          })
        );

        return {
          ...exam,
          questionsCount: exam.questions.length,
          submissionsCount: submissions.length,
          creatorName: creator?.name || "غير معروف",
          groupNames: groupNames.join("، "),
        };
      })
    );

    return examsWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// ============================================
// MUTATIONS
// ============================================

// ✅ إنشاء امتحان جديد
export const createExam = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    model: v.string(),
    grade: v.string(),
    subject: v.string(),
    gradeId: v.id("grades"), // ✅ بدلاً من courseId
    groupIds: v.array(v.id("groups")), // ✅ بدلاً من classIds
    totalMarks: v.number(),
    duration: v.number(),
    date: v.number(),
    instructions: v.optional(v.string()),
    footerText: v.optional(v.string()),
    headerBorderColor: v.optional(v.string()),
    showInstructions: v.boolean(),
    showAnswerSheet: v.boolean(),
    showQrCode: v.boolean(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),
    questions: v.array(
      v.object({
        questionId: v.id("questions"),
        marks: v.number(),
        order: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    // ✅ التحقق من وجود الصف
    const grade = await ctx.db.get(args.gradeId);
    if (!grade) {
      throw new Error(`الصف غير موجود: ${args.gradeId}`);
    }

    // ✅ التحقق من وجود المجموعات
    for (const groupId of args.groupIds) {
      const group = await ctx.db.get(groupId);
      if (!group) {
        throw new Error(`المجموعة غير موجودة: ${groupId}`);
      }
      if (group.gradeId !== args.gradeId) {
        throw new Error(`المجموعة ${group.name} ليست تابعة للصف ${grade.name}`);
      }
    }

    const examId = await ctx.db.insert("exams", {
      title: args.title,
      description: args.description,
      model: args.model,
      grade: args.grade,
      subject: args.subject,
      gradeId: args.gradeId,
      groupIds: args.groupIds,
      // ✅ للتوافق القديم
      courseId: undefined,
      totalMarks: args.totalMarks,
      duration: args.duration,
      date: args.date,
      instructions: args.instructions,
      footerText: args.footerText,
      headerBorderColor: args.headerBorderColor,
      showInstructions: args.showInstructions,
      showAnswerSheet: args.showAnswerSheet,
      showQrCode: args.showQrCode,
      status: args.status,
      questions: args.questions,
      createdBy: user._id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      publishedAt: args.status === "published" ? Date.now() : undefined,
    });

    return { success: true, examId };
  },
});

// ✅ تحديث امتحان
export const updateExam = mutation({
  args: {
    examId: v.id("exams"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    model: v.optional(v.string()),
    grade: v.optional(v.string()),
    subject: v.optional(v.string()),
    gradeId: v.optional(v.id("grades")), // ✅ بدلاً من courseId
    groupIds: v.optional(v.array(v.id("groups"))), // ✅ بدلاً من classIds
    totalMarks: v.optional(v.number()),
    duration: v.optional(v.number()),
    date: v.optional(v.number()),
    instructions: v.optional(v.string()),
    footerText: v.optional(v.string()),
    headerBorderColor: v.optional(v.string()),
    showInstructions: v.optional(v.boolean()),
    showAnswerSheet: v.optional(v.boolean()),
    showQrCode: v.optional(v.boolean()),
    status: v.optional(v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    )),
    questions: v.optional(v.array(
      v.object({
        questionId: v.id("questions"),
        marks: v.number(),
        order: v.number(),
      })
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const { examId, ...fields } = args;
    const updateData: any = { updatedAt: Date.now() };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updateData[key] = value;
      }
    }

    if (args.status === "published") {
      updateData.publishedAt = Date.now();
    }

    await ctx.db.patch(examId, updateData);

    return { success: true };
  },
});

// ✅ حذف امتحان
export const deleteExam = mutation({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("الامتحان غير موجود");

    // التحقق من وجود تسليمات
    const submissions = await ctx.db
      .query("examSubmissions")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .collect();

    if (submissions.length > 0) {
      throw new Error("لا يمكن حذف الامتحان لأنه يوجد تسليمات مرتبطة به");
    }

    await ctx.db.delete(args.examId);

    return { success: true };
  },
});


// ✅ دالة لنشر الامتحان
export const publishExam = mutation({
  args: { examId: v.id("exams") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    await ctx.db.patch(args.examId, {
      status: "published",
      publishedAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ جلب تسليم الطالب مع التحقق من القفل
export const getStudentExamSubmission = query({
  args: {
    examId: v.id("exams"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db
      .query("examSubmissions")
      .withIndex("by_exam_student", (q) => 
        q.eq("examId", args.examId).eq("studentId", args.studentId)
      )
      .first();
    
    return submission || null;
  },
});

// ✅ تسليم امتحان (بدون حساب درجات)
export const submitExam = mutation({
  args: {
    examId: v.id("exams"),
    classId: v.union(v.id("classes"), v.id("groups")),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        answer: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const student = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!student || student.role !== "student") {
      throw new Error("مطلوب صلاحيات طالب");
    }

    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("الامتحان غير موجود");

    // ✅ تحويل الإجابات إلى الصيغة المطلوبة (بدون درجات)
    const answersData = args.answers.map((ans) => ({
      questionId: ans.questionId,
      answer: ans.answer,
      // ✅ لا نضيف marksObtained هنا - ستضاف من قبل المعلم
    }));

    const submissionId = await ctx.db.insert("examSubmissions", {
      examId: args.examId,
      studentId: student._id,
      classId: args.classId,
      submittedAt: Date.now(),
      answers: answersData,
      totalMarks: undefined, // ✅ بدون درجات حتى يصححها المعلم
      status: "submitted", // ✅ حالة "مسلم" بانتظار التصحيح
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, submissionId };
  },
});

// ✅ قفل الامتحان للطالب (عند تجاوز محاولات الخروج)
export const lockExamForStudent = mutation({
  args: {
    examId: v.id("exams"),
    studentId: v.id("users"),
    classId: v.union(v.id("classes"), v.id("groups")),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const student = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!student || student.role !== "student") {
      throw new Error("مطلوب صلاحيات طالب");
    }

    // التحقق من أن الطالب هو نفسه
    if (student._id !== args.studentId) {
      throw new Error("غير مصرح");
    }

    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("الامتحان غير موجود");

    // البحث عن تسليم موجود
    const existingSubmission = await ctx.db
      .query("examSubmissions")
      .withIndex("by_exam_student", (q) => 
        q.eq("examId", args.examId).eq("studentId", args.studentId)
      )
      .first();

    if (existingSubmission) {
      // ✅ تحديث التسليم الموجود بالقفل
      await ctx.db.patch(existingSubmission._id, {
        locked: true,
        lockReason: args.reason,
        lockedAt: Date.now(),
        updatedAt: Date.now(),
        // إذا كان غير مصحح، نضع علامة
        status: existingSubmission.status === "graded" ? "graded" : "submitted",
      });
    } else {
      // ✅ إنشاء تسليم جديد مقفل (بدون إجابات)
      await ctx.db.insert("examSubmissions", {
        examId: args.examId,
        studentId: args.studentId,
        classId: args.classId,
        submittedAt: Date.now(),
        answers: [], // بدون إجابات
        totalMarks: 0, // صفر درجات
        status: "submitted",
        locked: true,
        lockReason: args.reason,
        lockedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
    }

    return { success: true, locked: true };
  },
});

export const getExamSubmissions = query({
  args: {
    examId: v.id("exams"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    // Get all submissions for this exam
    const submissions = await ctx.db
      .query("examSubmissions")
      .withIndex("by_exam", (q) => q.eq("examId", args.examId))
      .collect();

    // Enrich with student names
    const enrichedSubmissions = await Promise.all(
      submissions.map(async (sub) => {
        const student = await ctx.db.get(sub.studentId);
        return {
          ...sub,
          studentName: student?.name || "طالب غير معروف",
        };
      })
    );

    // Sort by submission date (newest first)
    return enrichedSubmissions.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});


export const gradeExamSubmission = mutation({
  args: {
    submissionId: v.id("examSubmissions"),
    gradedAnswers: v.array(
      v.object({
        questionId: v.id("questions"),
        answer: v.string(),
        marksObtained: v.number(),
        feedback: v.optional(v.string()),
      })
    ),
    totalMarks: v.number(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      throw new Error("مطلوب صلاحيات مشرف أو معلم");
    }

    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throw new Error("التسليم غير موجود");

    // Check if already graded
    if (submission.status === "graded") {
      throw new Error("هذا التسليم تم تصحيحه بالفعل");
    }

    // Update the submission
    await ctx.db.patch(args.submissionId, {
      answers: args.gradedAnswers.map((a) => ({
        questionId: a.questionId,
        answer: a.answer,
        marksObtained: a.marksObtained,
        feedback: a.feedback,
      })),
      totalMarks: args.totalMarks,
      status: "graded",
      gradedBy: user._id,
      gradedAt: Date.now(),
      feedback: args.feedback,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});



// convex/exams/exams.ts

// ✅ جلب تفاصيل الامتحان مع إجابات الطالب - البحث عن الطالب الصحيح
export const getExamWithStudentAnswers = query({
  args: {
    examId: v.id("exams"),
    studentId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("غير مصرح");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user) throw new Error("المستخدم غير موجود");

    // ✅ جلب الامتحان
    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("الامتحان غير موجود");

    // ✅ جلب جميع تسليمات هذا الامتحان
    const allSubmissions = await ctx.db
      .query("examSubmissions")
      .collect();

    // ✅ البحث عن تسليم الطالب
    let submission = allSubmissions.find(
      (s: any) => s.examId === args.examId && s.studentId === args.studentId
    ) || null;

    // ✅ إذا لم يوجد، جرب البحث عن أي تسليم لهذا الامتحان (لأي طالب)
    if (!submission) {
      submission = allSubmissions.find(
        (s: any) => s.examId === args.examId
      ) || null;
      
      if (submission) {
        console.log("✅ Found submission for different student:", submission.studentId);
      }
    }

    // ✅ إذا لم يوجد تسليم
    if (!submission) {
      throw new Error("لم يسلم الطالب هذا الامتحان بعد");
    }

    // ✅ جلب تفاصيل الأسئلة مع إجابات الطالب
    const questionsWithAnswers = await Promise.all(
      (exam.questions || []).map(async (q: any) => {
        const question = await ctx.db.get(q.questionId);
        
        const studentAnswer = submission.answers?.find(
          (a: any) => a.questionId === q.questionId
        );

        return {
          ...q,
          question: {
            ...question,
            studentAnswer: studentAnswer?.answer || null,
            marksObtained: studentAnswer?.marksObtained ?? 0,
            feedback: studentAnswer?.feedback || null,
          },
        };
      })
    );

    // ✅ جلب اسم الطالب الصحيح
    const student = await ctx.db.get(submission.studentId);

    return {
      exam: {
        ...exam,
        questions: questionsWithAnswers,
      },
      submission: {
        ...submission,
        studentName: student?.name || "غير معروف",
      },
    };
  },
});

// ✅ تصدير الدوال
export const exams = {
  getExams,
  getExamById,
  getExamSubmissions,
  gradeExamSubmission,
  getStudentExams,
  createExam,
  updateExam,
  deleteExam,
  publishExam,
  getUpcomingForStudent,
  getTeacherExams,
  getExamWithStudentAnswers
};