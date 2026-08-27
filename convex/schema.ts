import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    phoneNumber: v.optional(v.string()),
    gradeId: v.optional(v.id("grades")),
    groupId: v.optional(v.id("groups")),
    classId: v.optional(v.id("classes")),
    role: v.union(
      v.literal("student"),
      v.literal("teacher"),
      v.literal("parent"),
      v.literal("admin"),
    ),
    // ✅ نغيرها إلى tracks (مصفوفة)
    tracks: v.optional(
      v.array(
        v.union(
          v.literal("platform"),
          v.literal("aptitude"),
          v.literal("academic"),
        ),
      ),
    ),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("active"),
      v.literal("inactive"),
      v.literal("on_leave"), // ✅ إضافة حالة الإجازة للمعلمين
    ),
    subscriptionStatus: v.optional(
      v.union(
        v.literal("pending"), // مسجل - لم يدفع بعد
        v.literal("awaiting_approval"), // دفع - ينتظر الموافقة
        v.literal("active"), // موافق عليه - نشط
        v.literal("rejected"), // مرفوض
        v.literal("expired"), // اشتراك منتهي
      ),
    ),

    rejectionReason: v.optional(v.string()),
    approvedAt: v.optional(v.number()),
    approvedBy: v.optional(v.id("users")),

    // Student specific fields
    studentId: v.optional(v.string()),
    birthDate: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    address: v.optional(v.string()),
    grade: v.optional(v.string()),
    enrollmentDate: v.optional(v.number()),

    // Teacher specific fields ✅
    teacherId: v.optional(v.string()), // معرف المعلم المخصص
    specialization: v.optional(v.string()), // التخصص
    qualification: v.optional(v.string()), // المؤهل العلمي
    experience: v.optional(v.number()), // سنوات الخبرة
    hireDate: v.optional(v.number()), // تاريخ التوظيف
    salary: v.optional(v.number()), // الراتب
    subjects: v.optional(v.array(v.string())), // المواد التي يدرسها

    // ✅ سعر كورس القدرات (Aptitude)
    aptitudeCoursePrice: v.optional(v.number()),
    aptitudeCourseCurrency: v.optional(v.string()),

    // ✅ سعر كورس التحصيلي (Academic)
    academicCoursePrice: v.optional(v.number()),
    academicCourseCurrency: v.optional(v.string()),

    // Parent specific fields
    parentId: v.optional(v.string()),
    workPhone: v.optional(v.string()),
    workAddress: v.optional(v.string()),
    jobTitle: v.optional(v.string()),
    nationalId: v.optional(v.string()),
    relationship: v.optional(v.string()),

    // Guardian info

    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_role", ["role"])
    .index("by_studentId", ["studentId"])
    .index("by_teacherId", ["teacherId"]) // ✅ إضافة index للمعلمين
    .index("by_parentId", ["parentId"])
    .index("by_gradeId", ["gradeId"]) // ✅ إضافة index للبحث بالصف    // إضافة index للوالدين
    .index("by_subscriptionStatus", ["subscriptionStatus"]),

  parentStudentLinks: defineTable({
    parentId: v.id("users"),
    studentId: v.id("users"),
    relationship: v.string(), // أب، أم، وصي، إلخ
    isPrimary: v.boolean(), // جهة اتصال أساسية
    permissions: v.object({
      // صلاحيات ولي الأمر
      viewGrades: v.boolean(), // عرض الدرجات
      financialAccess: v.boolean(), // الوصول المالي
      pickupNotification: v.boolean(), // إشعار الاستلام
      emergencyContact: v.boolean(), // جهة اتصال طوارئ
    }),
    createdAt: v.number(),
  })
    .index("by_parent_student", ["parentId", "studentId"])
    .index("by_parent", ["parentId"])
    .index("by_student", ["studentId"]),

  auditLogs: defineTable({
    userId: v.id("users"),
    action: v.string(),
    resourceType: v.string(),
    resourceId: v.string(),
    details: v.object({
      role: v.optional(v.string()),
      email: v.optional(v.string()),
      name: v.optional(v.string()),
      previousStatus: v.optional(v.string()),
      previousRole: v.optional(v.string()),
      newRole: v.optional(v.string()),
      approvedBy: v.optional(v.string()),
      reason: v.optional(v.string()),
      rejectedBy: v.optional(v.string()),
      studentId: v.optional(v.string()),
      parentId: v.optional(v.string()),
      teacherId: v.optional(v.string()),
      updatedFields: v.optional(v.array(v.string())),
      updatedBy: v.optional(v.string()),
      createdBy: v.optional(v.string()),
      deletedBy: v.optional(v.string()),
    }),
    createdAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_resourceId", ["resourceId"])
    .index("by_action", ["action"]),

  adminSettings: defineTable({
    requireApproval: v.boolean(),
    autoApproveRoles: v.array(v.string()),
    studentIdPrefix: v.string(),
    teacherIdPrefix: v.optional(v.string()), // ✅ optional
    parentIdPrefix: v.optional(v.string()), // ✅ optional
    nextStudentIdNumber: v.number(),
    nextTeacherIdNumber: v.optional(v.number()), // ✅ optional
    nextParentIdNumber: v.optional(v.number()), // ✅ optional
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  // ✅ جدول الصفوف (المستويات الدراسية) - ينشئها الأدمن فقط
  grades: defineTable({
    name: v.string(), // "الصف الأول الابتدائي"
    nameEn: v.string(), // "Grade 1"
    gradeLevel: v.number(), // 1, 2, 3, ...
    academicYear: v.string(), // "2026-2027"
    maxGroups: v.optional(v.number()), // الحد الأقصى للمجموعات
    status: v.union(v.literal("active"), v.literal("inactive")),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_gradeLevel", ["gradeLevel"])
    .index("by_academicYear", ["academicYear"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"]),

  // ✅ جدول المجموعات (تحت الصف) - ينشئها الأدمن + المعلم
  groups: defineTable({
    name: v.string(), // "مجموعة عربي 1"
    nameEn: v.string(), // "Arabic Group 1"
    gradeId: v.id("grades"), // ✅ إشارة إلى الصف
    subject: v.string(), // "اللغة العربية" - ✅ إجباري
    maxStudents: v.number(),
    currentStudents: v.number(),
    supervisorId: v.optional(v.id("users")),
    location: v.optional(v.string()),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("completed"),
    ),
    students: v.array(v.id("users")),
    teachers: v.optional(v.array(v.id("users"))),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_grade", ["gradeId"])
    .index("by_supervisor", ["supervisorId"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"]),

  classes: defineTable({
    classNameAr: v.optional(v.string()),
    classNameEn: v.optional(v.string()),
    classCode: v.optional(v.string()),
    grade: v.optional(v.string()),
    gradeLevel: v.optional(v.number()),
    section: v.optional(v.string()),
    academicYear: v.optional(v.string()),
    supervisorId: v.optional(v.id("users")),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("inactive"),
        v.literal("completed"),
      ),
    ),
    students: v.optional(v.array(v.id("users"))),
    teachers: v.optional(v.array(v.id("users"))),
    createdBy: v.optional(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
    location: v.optional(v.string()),
    maxStudents: v.optional(v.number()),
    currentStudents: v.optional(v.number()),
    gradeId: v.optional(v.id("grades")),
    groupId: v.optional(v.id("groups")),
  })
    .index("by_grade", ["gradeId"])
    .index("by_supervisor", ["supervisorId"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"]),

  classSubjects: defineTable({
    classId: v.optional(v.id("classes")),
    gradeId: v.id("grades"),
    subjectId: v.id("courses"), // ربط بالمادة (course)
    teacherId: v.id("users"), // معلم المادة
    order: v.number(), // ترتيب المادة في الفصل
    status: v.union(v.literal("active"), v.literal("inactive")),
    schedule: v.optional(
      v.object({
        days: v.array(v.string()),
        startTime: v.string(),
        endTime: v.string(),
      }),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_class", ["classId"])
    .index("by_grade", ["gradeId"])
    .index("by_subject", ["subjectId"])
    .index("by_teacher", ["teacherId"])
    .index("by_grade_status", ["gradeId", "status"]),

  schedules: defineTable({
    groupId: v.optional(v.id("groups")), // ✅ أضف هذا
    classId: v.optional(v.id("classes")), // ✅ للتوافق القديم
    academicYear: v.string(),
    term: v.union(v.literal("first"), v.literal("second")),
    weekDays: v.array(
      v.object({
        day: v.string(),
        periods: v.array(
          v.object({
            periodNumber: v.number(),
            startTime: v.string(),
            endTime: v.string(),
            subject: v.string(),
            teacherId: v.optional(v.id("users")),
            teacherName: v.optional(v.string()), // ✅ لإظهار اسم المعلم
            room: v.optional(v.string()),
            isBreak: v.boolean(),
            notes: v.optional(v.string()),
          }),
        ),
      }),
    ),
    holidays: v.optional(
      v.array(
        v.object({
          date: v.number(),
          reason: v.string(),
          type: v.union(v.literal("holiday"), v.literal("exception")),
        }),
      ),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_group", ["groupId"]) // ✅ أضف هذا
    .index("by_class", ["classId"])
    .index("by_academicYear", ["academicYear"]),

  // تسجيل الحضور
  attendance: defineTable({
    classId: v.id("classes"),
    studentId: v.id("users"),
    date: v.string(), // تاريخ الحصة "2024-01-15"
    periodNumber: v.number(), // رقم الحصة
    status: v.union(
      v.literal("present"), // حاضر
      v.literal("absent"), // غائب
      v.literal("late"), // متأخر
      v.literal("excused"), // بعذر
    ),
    checkInTime: v.optional(v.string()), // وقت الدخول
    checkOutTime: v.optional(v.string()), // وقت الخروج
    notes: v.optional(v.string()),
    recordedBy: v.id("users"), // المعلم الذي سجل الحضور
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_class_date", ["classId", "date"])
    .index("by_student", ["studentId"])
    .index("by_date", ["date"]),

  // إشعارات التذكير
  scheduleReminders: defineTable({
    scheduleId: v.id("schedules"),
    classId: v.id("classes"),
    periodNumber: v.number(),
    reminderTime: v.number(), // وقت الإشعار (timestamp)
    sent: v.boolean(), // هل تم الإرسال؟
    sentAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_schedule", ["scheduleId"])
    .index("by_class", ["classId"])
    .index("by_reminderTime", ["reminderTime"]),

  mediaFiles: defineTable({
    name: v.string(),
    type: v.union(
      v.literal("image"),
      v.literal("video"),
      v.literal("youtube"),
      v.literal("pdf"),
      v.literal("audio"),
      v.literal("link"), // ✅ أضف هذا
    ),
    url: v.string(), // R2 public URL or YouTube URL
    r2Key: v.optional(v.string()), // R2 object key (for deletion)
    size: v.optional(v.number()), // bytes (0 for YouTube)
    mimeType: v.optional(v.string()), // e.g. "image/jpeg"
    context: v.string(), // "general" | "classroom" | etc.
    status: v.union(v.literal("ok"), v.literal("draft")),
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
    usedIn: v.array(v.id("mediaAssignments")), // assignment IDs
  })
    .index("by_type", ["type"])
    .index("by_context", ["context"])
    .index("by_uploader", ["uploadedBy"])
    .index("by_status", ["status"]),

  mediaAssignments: defineTable({
    mediaFileIds: v.array(v.id("mediaFiles")),
    assignTo: v.union(
      v.literal("class"),
      v.literal("student"),
      v.literal("section"),
      v.literal("grade"), // ✅ إضافة grade
      v.literal("group"), // ✅ إضافة group
    ),
    targetId: v.string(), // classId | studentId | sectionId
    title: v.string(),
    description: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    alwaysAvailable: v.boolean(),
    availability: v.optional(v.string()), // "media.always" | "media.scheduled"
    status: v.union(v.literal("draft"), v.literal("published")),
    assignedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_target", ["targetId"])
    .index("by_status", ["status"])
    .index("by_assigner", ["assignedBy"]),

  courses: defineTable({
    title: v.string(),
    description: v.string(),
    classId: v.optional(v.id("classes")),
    teacherId: v.id("users"),
    thumbnail: v.optional(v.string()),
    isPublished: v.boolean(),
    price: v.optional(v.number()),
    category: v.optional(v.string()),
    enrolledStudents: v.array(v.id("users")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_class", ["classId"])
    .index("by_published", ["isPublished"])
    .index("by_category", ["category"]),

  assignments: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    classIds: v.optional(v.array(v.id("classes"))),
    gradeId: v.id("grades"), // ✅ إضافة
    groupIds: v.optional(v.array(v.id("groups"))), // ✅ اختياري
    type: v.union(
      v.literal("assignment"),
      v.literal("quiz"),
      v.literal("exam"),
      v.literal("project"),
    ),
    questions: v.optional(v.array(v.id("questions"))),
    fullGrade: v.float64(),
    // ✅ courseId أصبح اختياري
    courseId: v.optional(v.id("courses")),
    maxAttempts: v.optional(v.number()),
    allowResubmission: v.boolean(),
    isGroupWork: v.boolean(),
    maxGroupSize: v.optional(v.number()),
    showGrade: v.boolean(),
    location: v.optional(v.string()),
    logic: v.optional(v.string()),
    startDate: v.number(),
    dueDate: v.number(),
    weight: v.number(),
    passingGrade: v.number(),
    allowLateSubmission: v.boolean(),
    lateSubmissionPenalty: v.optional(v.number()),
    attachments: v.array(
      v.object({
        name: v.string(),
        url: v.string(),
        size: v.number(),
        type: v.string(),
      }),
    ),
    allowedFileTypes: v.array(v.string()),
    maxFileSize: v.optional(v.number()),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_class", ["classIds"])
    .index("by_grade", ["gradeId"]) // ✅ إضافة
    .index("by_group", ["groupIds"]) // ✅ إضافة
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"])
    .index("by_dueDate", ["dueDate"]),

  submissions: defineTable({
    assignmentId: v.id("assignments"),
    studentId: v.id("users"),
    classId: v.optional(v.id("classes")),
    groupId: v.optional(v.id("groups")), // ✅ إضافة groupId
    submittedAt: v.number(),
    content: v.optional(v.string()),
    attachments: v.array(
      v.object({
        name: v.string(),
        url: v.string(),
        size: v.number(),
        type: v.string(),
      }),
    ),
    // ✅ إضافة حقل answers لتخزين إجابات الطالب على الأسئلة
    answers: v.optional(
      v.array(
        v.object({
          questionId: v.id("questions"),
          answer: v.string(),
        }),
      ),
    ),
    grade: v.optional(v.number()),
    feedback: v.optional(v.string()),
    gradedBy: v.optional(v.id("users")),
    gradedAt: v.optional(v.number()),
    status: v.union(
      v.literal("submitted"),
      v.literal("graded"),
      v.literal("returned"),
      v.literal("late"),
    ),
    attemptNumber: v.number(),
    isLate: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_assignment", ["assignmentId"])
    .index("by_student", ["studentId"])
    .index("by_class", ["classId"])
    .index("by_group", ["groupId"]) // ✅ إضافة index
    .index("by_assignment_student", ["assignmentId", "studentId"]),

  enrollments: defineTable({
    studentId: v.id("users"),
    classId: v.id("classes"),
    courseId: v.id("courses"), // ✅ إذا كان عندك
    enrolledAt: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("completed"),
      v.literal("dropped"),
    ),
  })
    .index("by_student", ["studentId"])
    .index("by_class", ["classId"])
    .index("by_course", ["courseId"])
    .index("by_student_class", ["studentId", "classId"])
    .index("by_student_course", ["studentId", "courseId"]),

  // chapters: defineTable({
  //   courseId: v.id("courses"),
  //   title: v.string(),
  //   description: v.optional(v.string()),
  //   order: v.number(),
  //   isPublished: v.boolean(),
  //   createdAt: v.number(),
  //   updatedAt: v.number(),
  // })
  //   .index("by_course", ["courseId"])
  //   .index("by_course_order", ["courseId", "order"]),

  questions: defineTable({
    title: v.string(), // عنوان السؤال
    type: v.union(
      v.literal("mcq"), // اختيار من متعدد
      v.literal("true_false"), // صح/خطأ
      v.literal("essay"), // مقالي
      v.literal("fill_blank"), // ملء الفراغ
      v.literal("matching"), // مطابقة
    ),
    questionText: v.string(), // نص السؤال
    imageUrl: v.optional(v.string()), // صورة السؤال (اختياري)
    explanation: v.optional(v.string()), // شرح مفصل
    difficulty: v.union(
      v.literal("easy"),
      v.literal("medium"),
      v.literal("hard"),
    ),
    points: v.number(), // عدد النقاط
    options: v.array(
      v.object({
        id: v.string(),
        text: v.string(),
        isCorrect: v.boolean(),
        imageUrl: v.optional(v.string()),
      }),
    ),
    correctAnswer: v.optional(v.string()), // للإجابة القصيرة أو المقالي
    subject: v.optional(v.string()), // المادة
    lesson: v.optional(v.string()), // الدرس
    grade: v.optional(v.string()), // الصف الدراسي
    section: v.optional(v.string()), // الشعبة
    tags: v.array(v.string()), // وسوم
    createdBy: v.id("users"), // من أضاف السؤال
    createdAt: v.number(),
    updatedAt: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("published"),
      v.literal("archived"),
    ),
    usageCount: v.number(), // عدد مرات الاستخدام
    examUsage: v.array(
      v.object({
        // استخدامات الامتحان
        examId: v.id("exams"),
        usedAt: v.number(),
      }),
    ),
  })
    .index("by_type", ["type"])
    .index("by_difficulty", ["difficulty"])
    .index("by_subject", ["subject"])
    .index("by_grade", ["grade"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"]),

  // ✅ جدول الامتحانات (معدل)
  exams: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    model: v.string(),
    grade: v.string(),
    subject: v.string(),
    courseId: v.optional(v.id("courses")), // ✅ اختياري للتوافق القديم
    classIds: v.optional(v.array(v.id("classes"))), // ✅ اختياري للتوافق القديم
    gradeId: v.id("grades"), // ✅ إضافة
    groupIds: v.array(v.id("groups")), // ✅ إضافة
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
    // ✅ الأسئلة من بنك الأسئلة - مخزنة مباشرة
    questions: v.array(
      v.object({
        questionId: v.id("questions"),
        marks: v.number(),
        order: v.number(),
      }),
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_course", ["courseId"])
    .index("by_status", ["status"])
    .index("by_createdBy", ["createdBy"])
    .index("by_grade", ["gradeId"]) // ✅ إضافة
    .index("by_group", ["groupIds"]) // ✅ إضافة
    .index("by_date", ["date"]),

  // ✅ جدول تسليمات الامتحانات
  examSubmissions: defineTable({
    examId: v.id("exams"),
    studentId: v.id("users"),
    classId: v.optional(v.union(v.id("classes"), v.id("groups"))),
    submittedAt: v.number(),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        answer: v.string(),
        marksObtained: v.optional(v.number()), // ✅ اختياري - يضاف عند التصحيح
        feedback: v.optional(v.string()), // ✅ ملاحظات المعلم على كل سؤال
      }),
    ),
    totalMarks: v.optional(v.number()), // ✅ اختياري - يضاف عند التصحيح
    status: v.union(
      v.literal("submitted"), // ✅ مسلم - بانتظار التصحيح
      v.literal("graded"), // ✅ تم التصحيح
      v.literal("returned"), // ✅ أعيد للطالب
    ),
    gradedBy: v.optional(v.id("users")),
    gradedAt: v.optional(v.number()),
    feedback: v.optional(v.string()), // ✅ ملاحظات عامة
    createdAt: v.number(),
    updatedAt: v.number(),
    locked: v.optional(v.boolean()),
    lockReason: v.optional(v.string()),
    lockedAt: v.optional(v.number()),
  })
    .index("by_exam", ["examId"])
    .index("by_student", ["studentId"])
    .index("by_class", ["classId"])
    .index("by_exam_student", ["examId", "studentId"])
    .index("by_status", ["status"]), // ✅ إضافة index للحالة

  // ─── Landing Page Tables ──────────────────────────────────────

landingSettings: defineTable({
    // ✅ Hero Fields
    heroBadge: v.optional(v.string()),
    heroBadgeAr: v.optional(v.string()),
    heroTitle: v.string(),
    heroTitleAr: v.string(),
    heroSubtitle: v.optional(v.string()),
    heroSubtitleAr: v.optional(v.string()),
    heroImageUrl: v.string(),
    heroRating: v.optional(v.string()),
    heroRatingLabel: v.optional(v.string()),
    heroRatingLabelAr: v.optional(v.string()),
    heroBottomText: v.optional(v.string()),
    heroBottomTextAr: v.optional(v.string()),
    heroBottomSmText: v.optional(v.string()),
    heroBottomSmTextAr: v.optional(v.string()),

    // ✅ School Name
    schoolName: v.optional(v.string()),
    schoolNameAr: v.optional(v.string()),

    // ✅ Trust Badges
    trustBadge1: v.optional(v.string()),
    trustBadge1Ar: v.optional(v.string()),
    trustBadge2: v.optional(v.string()),
    trustBadge2Ar: v.optional(v.string()),
    trustBadge2Year: v.optional(v.string()),
    trustBadge3Value: v.optional(v.string()),
    trustBadge3: v.optional(v.string()),
    trustBadge3Ar: v.optional(v.string()),

    // ✅ Floating Badges
    floatingBadge1: v.optional(v.string()),
    floatingBadge1Ar: v.optional(v.string()),
    floatingBadge2: v.optional(v.string()),
    floatingBadge2Ar: v.optional(v.string()),

    // ✅ CTA
    ctaText: v.string(),
    ctaTextAr: v.string(),
    ctaUrl: v.string(),
    secondaryCta: v.string(),
    secondaryCtaAr: v.string(),
    secondaryCtaUrl: v.string(),

    // ✅ Stats
    stats: v.array(
      v.object({
        value: v.string(),
        label: v.string(),
        labelAr: v.string(),
      })
    ),

    // ✅ Theme
    themeMode: v.union(v.literal("dark"), v.literal("light")),

    // ✅ Visibility
    showTestimonials: v.boolean(),
    showCourses: v.boolean(),
    showGallery: v.boolean(),

    // ✅ Contact
    contactEmail: v.string(),
    contactPhone: v.string(),
    whatsappLink: v.string(),
    address: v.string(),
    addressAr: v.string(),

    // ✅ Footer
    footerDescription: v.string(),
    footerDescriptionAr: v.string(),

    // ✅ SEO
    seoTitle: v.string(),
    seoTitleAr: v.string(),
    seoDescription: v.string(),
    seoDescriptionAr: v.string(),

  }),


  landingSections: defineTable({
    slug: v.string(),
    displayOrder: v.number(),
    isEnabled: v.boolean(),
    title: v.optional(v.string()),
    titleAr: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    subtitleAr: v.optional(v.string()),
    body: v.optional(v.string()),
    bodyAr: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    ctaTextAr: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    features: v.optional(
      v.array(
        v.object({
          icon: v.string(),
          title: v.string(),
          titleAr: v.string(),
          desc: v.string(),
          descAr: v.string(),
        }),
      ),
    ),
    cards: v.optional(
      v.array(
        v.object({
          icon: v.string(),
          title: v.string(),
          titleAr: v.string(),
          desc: v.string(),
          descAr: v.string(),
        }),
      ),
    ),
    steps: v.optional(
      v.array(
        v.object({
          number: v.string(),
          title: v.string(),
          titleAr: v.string(),
          desc: v.string(),
          descAr: v.string(),
        }),
      ),
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_order", ["displayOrder"])
    .index("by_enabled", ["isEnabled"]),

  landingCourses: defineTable({
    title: v.string(),
    titleAr: v.string(),
    summary: v.string(),
    summaryAr: v.string(),
    instructor: v.string(),
    rating: v.number(),
    priceLabel: v.optional(v.string()),
    priceLabelAr: v.optional(v.string()),
    ctaText: v.string(),
    ctaTextAr: v.string(),
    ctaUrl: v.string(),
    imageUrl: v.string(),
    displayOrder: v.number(),
    isPublished: v.boolean(),
    isFeatured: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["displayOrder"])
    .index("by_published", ["isPublished"])
    .index("by_featured", ["isFeatured"]),

  landingTestimonials: defineTable({
    name: v.string(),
    nameAr: v.string(),
    role: v.string(),
    roleAr: v.string(),
    text: v.string(),
    textAr: v.string(),
    rating: v.number(),
    avatarUrl: v.optional(v.string()),
    displayOrder: v.number(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["displayOrder"])
    .index("by_published", ["isPublished"]),

  landingVideoTestimonials: defineTable({
    title: v.string(),
    titleAr: v.string(),
    description: v.string(),
    descriptionAr: v.string(),
    videoUrl: v.string(), // رابط الفيديو (YouTube, Vimeo, أو ملف)
    thumbnailUrl: v.optional(v.string()),
    embedType: v.union(
      v.literal("youtube"),
      v.literal("vimeo"),
      v.literal("file"),
    ),
    displayOrder: v.number(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["displayOrder"])
    .index("by_published", ["isPublished"]),

  landingGallery: defineTable({
    title: v.string(),
    titleAr: v.string(),
    caption: v.string(),
    captionAr: v.string(),
    category: v.string(),
    imageUrl: v.string(),
    displayOrder: v.number(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["displayOrder"])
    .index("by_published", ["isPublished"])
    .index("by_category", ["category"]),

  landingAnnouncements: defineTable({
    title: v.string(),
    titleAr: v.string(),
    description: v.string(),
    descriptionAr: v.string(),
    points: v.array(v.string()),
    pointsAr: v.array(v.string()),
    imageUrl: v.string(),
    displayOrder: v.number(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["displayOrder"])
    .index("by_published", ["isPublished"]),

  subscriptions: defineTable({
    title: v.string(),
    titleAr: v.string(),
    description: v.string(),
    descriptionAr: v.string(),
    type: v.union(
      v.literal("single"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly"),
    ),
    price: v.number(),
    priceAr: v.string(),
    sessionsCount: v.number(),
    grade: v.union(
      v.literal("primary"),
      v.literal("middle"),
      v.literal("high"),
    ),
    features: v.array(v.string()),
    featuresAr: v.array(v.string()),
    isPopular: v.boolean(),
    displayOrder: v.number(),
    isPublished: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_order", ["displayOrder"])
    .index("by_published", ["isPublished"])
    .index("by_grade", ["grade"]),

  teacherMaterials: defineTable({
    teacherId: v.id("users"),
    title: v.string(),
    titleAr: v.string(),
    description: v.optional(v.string()),
    descriptionAr: v.optional(v.string()),
    type: v.union(
      v.literal("pdf"),
      v.literal("video"),
      v.literal("exam"),
      v.literal("assignment"),
      v.literal("revision"),
    ),
    fileUrl: v.optional(v.string()), // رابط الملف أو الفيديو
    fileSize: v.optional(v.string()), // حجم الملف
    duration: v.optional(v.string()), // مدة الفيديو
    subject: v.string(),
    grade: v.string(),
    questions: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          options: v.optional(v.array(v.string())),
          correctAnswer: v.optional(v.string()),
          marks: v.number(),
        }),
      ),
    ), // للامتحانات
    deadline: v.optional(v.number()), // للواجبات
    isPublished: v.boolean(),
    displayOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_type", ["type"])
    .index("by_subject", ["subject"])
    .index("by_published", ["isPublished"]),

  payments: defineTable({
    parentId: v.id("users"),
    studentId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("refunded"),
    ),
    paymentMethod: v.union(
      v.literal("card"),
      v.literal("bank_transfer"),
      v.literal("wallet"),
      v.literal("cash"),
    ),
    description: v.string(),
    transactionId: v.optional(v.string()),
    paymentDate: v.optional(v.number()),
    dueDate: v.optional(v.number()),
    invoiceUrl: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_parent", ["parentId"])
    .index("by_student", ["studentId"])
    .index("by_status", ["status"]),

  notifications: defineTable({
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("teacher_message"),
      v.literal("exam_published"),
      v.literal("exam_reminder"),
      v.literal("new_assignment"),
      v.literal("system_announcement"),
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent"),
    ),
    recipientType: v.union(
      v.literal("group"),
      v.literal("grade"),
      v.literal("student"),
      v.literal("all_teachers"),
      v.literal("teacher"),
      v.literal("parent"),      // ✅ أضف هذا
      v.literal("all_users"), 
    ),
    recipientId: v.optional(
      v.union(v.id("users"), v.id("groups"), v.id("grades")),
    ),
    status: v.union(
      v.literal("sent"),
      v.literal("read"),
      v.literal("archived"),
    ),
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_recipient", ["recipientId"])
    .index("by_status", ["status"])
    .index("by_type", ["type"]),

  liveClasses: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    groupId: v.id("groups"), // المجموعة المستهدفة
    teacherId: v.id("users"), // المعلم المنشئ
    startTime: v.number(), // timestamp
    endTime: v.number(), // timestamp
    platform: v.union(
      v.literal("zoom"),
      v.literal("google_meet"),
      v.literal("youtube"),
      v.literal("teams"),
      v.literal("other"),
    ),
    link: v.string(), // رابط الحصة
    meetingId: v.optional(v.string()), // معرف الاجتماع (للZoom)
    password: v.optional(v.string()), // كلمة المرور (للZoom)
    recordingLink: v.optional(v.string()), // رابط التسجيل بعد الحصة
    status: v.union(
      v.literal("scheduled"), // مجدولة
      v.literal("live"), // مباشرة الآن
      v.literal("ended"), // انتهت
      v.literal("cancelled"), // ملغاة
    ),
    attendance: v.array(
    v.object({
      studentId: v.id("users"),
      joinedAt: v.number(),
      leftAt: v.optional(v.number()),
      duration: v.optional(v.number()),
      status: v.union(
        v.literal("pending"),    // في انتظار تأكيد المعلم
        v.literal("approved"),   // تم التأكيد - حضر
        v.literal("rejected"),   // لم يحضر
      ),
      confirmedBy: v.optional(v.id("users")), // المعلم الذي أكد
      confirmedAt: v.optional(v.number()),
    })
  ),
    maxStudents: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_group", ["groupId"])
    .index("by_status", ["status"])
    .index("by_startTime", ["startTime"]),

  // ✅ جدول تعريف الأسعار حسب الصف
  gradePricing: defineTable({
    gradeId: v.id("grades"),
    price: v.number(),
    currency: v.string(),
    description: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_grade", ["gradeId"])
    .index("by_active", ["isActive"]),

  // ✅ جدول طلبات الموافقة على الاشتراك
  approvalRequests: defineTable({
    userId: v.id("users"), // من قام بالطلب (طالب أو ولي أمر)
    studentId: v.id("users"), // الطالب المستهدف
    gradeId: v.id("grades"), // الصف الدراسي
    amount: v.number(),
    currency: v.string(),
    paymentProof: v.string(), // رابط الصورة المرفوعة (Base64 أو URL)
    referenceNumber: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    adminNotes: v.optional(v.string()),
    reviewedBy: v.optional(v.id("users")),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_student", ["studentId"])
    .index("by_status", ["status"])
    .index("by_grade", ["gradeId"]),

  // ============================================
  // STORE TABLES
  // ============================================

  // ── المخازن ──────────────────────────────────────────────
  warehouses: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    isActive: v.boolean(),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_isActive", ["isActive"]),

  // ── الوحدات ──────────────────────────────────────────────
  units: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    isActive: v.boolean(),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_isActive", ["isActive"]),

  // ── مجموعات الأصناف ──────────────────────────────────────
  categories: defineTable({
    name: v.string(),
    createdBy: v.id("users"),
    isActive: v.boolean(),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_isActive", ["isActive"]),

  // ── الأصناف ──────────────────────────────────────────────
  items: defineTable({
    code: v.string(),
    name: v.string(),
    purchasePrice: v.number(),
    sellingPrice: v.number(),
    averageCost: v.number(),
    unitId: v.id("units"),
    categoryId: v.id("categories"),
    warehouseId: v.id("warehouses"),
    createdBy: v.id("users"),
    isActive: v.boolean(),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_warehouseId", ["warehouseId"])
    .index("by_categoryId", ["categoryId"])
    .index("by_unitId", ["unitId"])
    .index("by_code", ["code"])
    .index("by_isActive", ["isActive"]),

  // ── الفواتير ──────────────────────────────────────────────
  invoices: defineTable({
    invoiceNumber: v.string(),
    date: v.number(), // timestamp
    warehouseId: v.id("warehouses"),
    createdBy: v.id("users"),
    totalAmount: v.number(),
    status: v.union(
      v.literal("draft"),
      v.literal("saved"),
      v.literal("cancelled"),
    ),
    notes: v.optional(v.string()),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_warehouseId", ["warehouseId"])
    .index("by_date", ["date"])
    .index("by_status", ["status"])
    .index("by_invoiceNumber", ["invoiceNumber"]),

  // ── تفاصيل الفاتورة ──────────────────────────────────────
  invoiceItems: defineTable({
    invoiceId: v.id("invoices"),
    itemId: v.id("items"),
    quantity: v.number(),
    purchasePrice: v.number(),
    totalPrice: v.number(),
  })
    .index("by_invoiceId", ["invoiceId"])
    .index("by_itemId", ["itemId"]),

  // convex/schema.ts - أضف هذه الجداول في نهاية ملف schema

  // ============================================
  // CHAT TABLES
  // ============================================

  // ✅ مجموعات المحادثة
  chatGroups: defineTable({
    name: v.string(), // اسم المجموعة
    description: v.optional(v.string()), // وصف المجموعة
    type: v.union(
      v.literal("group"), // مجموعة عادية
      v.literal("class"), // فصل دراسي
      v.literal("grade"), // صف دراسي
      v.literal("direct"), // محادثة مباشرة (2 شخص)
    ),
    createdBy: v.id("users"), // منشئ المجموعة
    isPrivate: v.boolean(), // مجموعة خاصة (دعوة فقط)
    isActive: v.boolean(), // هل المجموعة نشطة
    avatar: v.optional(v.string()), // صورة المجموعة
    lastMessage: v.optional(v.string()), // آخر رسالة
    lastMessageAt: v.optional(v.number()), // وقت آخر رسالة
    lastMessageSender: v.optional(v.id("users")), // مرسل آخر رسالة
    unreadCount: v.optional(v.number()), // عدد الرسائل غير المقروءة
    groupId: v.optional(v.id("groups")), // ✅ إضافة هذا الحقل
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_createdBy", ["createdBy"])
    .index("by_type", ["type"])
    .index("by_isActive", ["isActive"])
    .index("by_groupId", ["groupId"]), // ✅ إضافة index

  // ✅ المشاركون في المحادثة
  chatParticipants: defineTable({
    chatId: v.id("chatGroups"), // معرف المجموعة
    userId: v.id("users"), // معرف المستخدم
    role: v.union(
      v.literal("admin"), // مدير المجموعة
      v.literal("member"), // عضو عادي
    ),
    status: v.union(
      v.literal("active"), // نشط
      v.literal("inactive"), // غير نشط
      v.literal("kicked"), // مطرود
    ),
    joinedAt: v.number(),
    lastReadAt: v.optional(v.number()), // آخر قراءة
    isMuted: v.boolean(), // كتم الإشعارات
    pinned: v.boolean(), // تثبيت المحادثة
  })
    .index("by_chat_user", ["chatId", "userId"])
    .index("by_user", ["userId"])
    .index("by_chat", ["chatId"])
    .index("by_status", ["status"]),

  // ✅ الرسائل
  chatMessages: defineTable({
    chatId: v.id("chatGroups"), // معرف المجموعة
    senderId: v.id("users"), // معرف المرسل
    content: v.string(), // نص الرسالة
    type: v.union(
      v.literal("text"), // نص عادي
      v.literal("image"), // صورة
      v.literal("file"), // ملف
      v.literal("voice"), // صوت
      v.literal("video"), // فيديو
      v.literal("system"), // رسالة نظام
    ),
    mediaUrl: v.optional(v.string()), // رابط الملف/الصورة
    mediaKey: v.optional(v.string()), // مفتاح R2
    replyTo: v.optional(v.id("chatMessages")), // رد على رسالة
    isEdited: v.boolean(),
    isDeleted: v.boolean(),
    isPinned: v.boolean(), // رسالة مثبتة
    readBy: v.array(v.id("users")), // من قرأ الرسالة
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_chat", ["chatId"])
    .index("by_sender", ["senderId"])
    .index("by_createdAt", ["createdAt"]),

  // ✅ إشعارات المحادثة
  chatNotifications: defineTable({
    userId: v.id("users"), // المستخدم المستهدف
    chatId: v.id("chatGroups"), // المجموعة
    messageId: v.id("chatMessages"), // الرسالة
    isRead: v.boolean(), // هل تمت القراءة
    readAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_chat", ["chatId"])
    .index("by_user_chat", ["userId", "chatId"])
    .index("by_isRead", ["isRead"]),

  // ── طلبات الشراء (Purchases) ──────────────────────────────
  purchases: defineTable({
    itemId: v.id("items"),
    studentId: v.id("users"),
    quantity: v.number(),
    totalPrice: v.number(),
    paymentProof: v.string(), // رابط الصورة
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("completed"),
    ),
    rejectionReason: v.optional(v.string()), // سبب الرفض
    adminNotes: v.optional(v.string()), // ✅ ملاحظات الأدمن (للموافقة أو الرفض)
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_studentId", ["studentId"])
    .index("by_itemId", ["itemId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  // ── مواد التحصيلي (Academic Materials) ──────────────────────────
  academicMaterials: defineTable({
    teacherId: v.id("users"),
    title: v.string(),
    titleAr: v.string(),
    description: v.optional(v.string()),
    descriptionAr: v.optional(v.string()),
    type: v.union(
      v.literal("pdf"),
      v.literal("video"),
      v.literal("exam"),
      v.literal("assignment"),
      v.literal("revision"),
    ),
    fileUrl: v.optional(v.string()),
    fileSize: v.optional(v.string()),
    duration: v.optional(v.string()),
    subject: v.string(),
    grade: v.string(),
    // ✅ حقل للمواد التحصيلية فقط
    academicLevel: v.optional(
      v.union(v.literal("primary"), v.literal("middle"), v.literal("high")),
    ),
    // ✅ حقل للامتحانات
    questions: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          options: v.optional(v.array(v.string())),
          correctAnswer: v.optional(v.string()),
          marks: v.number(),
        }),
      ),
    ),
    deadline: v.optional(v.number()),
    isPublished: v.boolean(),
    displayOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_teacher", ["teacherId"])
    .index("by_subject", ["subject"])
    .index("by_type", ["type"])
    .index("by_published", ["isPublished"])
    .index("by_grade", ["grade"]),

  // ── مواد القدرات (Aptitude Materials) ──────────────────────────
  aptitudeMaterials: defineTable({
    teacherId: v.id("users"),
    title: v.string(),
    titleAr: v.optional(v.string()),
    type: v.union(
      v.literal("pdf"),
      v.literal("video"),
      v.literal("exam"),
      v.literal("assignment"),
      v.literal("revision"),
    ),
    url: v.string(),
    size: v.optional(v.string()),
    duration: v.optional(v.string()),
    description: v.optional(v.string()),
    descriptionAr: v.optional(v.string()),
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_teacherId", ["teacherId"]),

  // ── طلبات شراء التحصيلي ──────────────────────────────────────────
  academicPurchases: defineTable({
    teacherId: v.id("users"),
    studentId: v.id("users"),
    amount: v.number(),
    currency: v.string(),
    paymentProof: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    rejectionReason: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_studentId", ["studentId"])
    .index("by_teacherId", ["teacherId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),

  // ── طلبات شراء القدرات ──────────────────────────────────────────
  aptitudePurchases: defineTable({
    teacherId: v.id("users"),
    studentId: v.id("users"),
    amount: v.number(),
    paymentProof: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
    ),
    rejectionReason: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_studentId", ["studentId"])
    .index("by_teacherId", ["teacherId"])
    .index("by_status", ["status"])
    .index("by_createdAt", ["createdAt"]),



// ── جدول المعاملات ──────────────────────────────────────────────
transactions: defineTable({
  studentId: v.id("users"),
  parentId: v.optional(v.id("users")),
  type: v.union(
    v.literal("platform"),
    v.literal("aptitude"),
    v.literal("academic"), // ✅ أضف academic
    v.literal("purchase")
  ),
  category: v.string(),
  amount: v.number(),
  currency: v.string(),
  status: v.union(
    v.literal("pending"),
    v.literal("completed"),
    v.literal("approved"),    // ✅ أضف approved
    v.literal("rejected"),    // ✅ أضف rejected
    v.literal("refunded"),
    v.literal("failed")
  ),
  referenceId: v.string(),
  referenceType: v.string(),
  description: v.string(),
  descriptionAr: v.string(),
  paymentProof: v.optional(v.string()),
  createdAt: v.number(),
  updatedAt: v.optional(v.number()),
})
  .index("by_student", ["studentId"])
  .index("by_parent", ["parentId"])
  .index("by_type", ["type"])
  .index("by_status", ["status"])
  .index("by_createdAt", ["createdAt"])
  .index("by_reference", ["referenceId"]),

  // ── سندات القبض (Receipt Vouchers) ────────────────────────────
  receiptVouchers: defineTable({
    voucherNumber: v.string(), // رقم السند (auto-generated)
    recipientId: v.id("users"), // المستلم (الطالب أو ولي الأمر)
    recipientName: v.string(), // اسم المستلم (للعرض السريع)
    amount: v.number(), // المبلغ
    currency: v.string(), // العملة
    notes: v.optional(v.string()), // البيان / الملاحظات
    date: v.number(), // تاريخ السند
    createdBy: v.id("users"), // من قام بالإضافة
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_voucherNumber", ["voucherNumber"])
    .index("by_recipient", ["recipientId"])
    .index("by_date", ["date"])
    .index("by_createdBy", ["createdBy"]),

  // ── سندات الصرف (Payment Vouchers) ────────────────────────────
  paymentVouchers: defineTable({
    voucherNumber: v.string(), // رقم السند (auto-generated)
    payeeId: v.id("users"), // المدفوع له
    payeeName: v.string(), // اسم المدفوع له (للعرض السريع)
    amount: v.number(), // المبلغ
    currency: v.string(), // العملة
    notes: v.optional(v.string()), // البيان / الملاحظات
    date: v.number(), // تاريخ السند
    createdBy: v.id("users"), // من قام بالإضافة
    createdAt: v.number(),
    updatedAt: v.optional(v.number()),
  })
    .index("by_voucherNumber", ["voucherNumber"])
    .index("by_payee", ["payeeId"])
    .index("by_date", ["date"])
    .index("by_createdBy", ["createdBy"]),
});
