"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Users,
  BookOpen,
  CreditCard,
  Award,
  GraduationCap,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  Phone,
  Mail,
  FileText,
  FolderOpen,
  Eye,
  ChevronRight,
  Clock,
  XCircle,
  Wallet,
  Receipt,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────────────
function formatDate(ts?: number) {
  if (!ts) return "—";
  return format(new Date(ts), "dd MMM yyyy", { locale: ar });
}

const statusLabels: Record<string, { label: string; cls: string; icon: any }> =
{
  completed: {
    label: "مكتمل",
    cls: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  approved: {
    label: "موافق عليه",
    cls: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  pending: { label: "معلق", cls: "bg-amber-100 text-amber-700", icon: Clock },
  rejected: { label: "مرفوض", cls: "bg-red-100 text-red-600", icon: XCircle },
  failed: { label: "فشل", cls: "bg-red-100 text-red-600", icon: XCircle },
  refunded: {
    label: "مُسترد",
    cls: "bg-blue-100 text-blue-700",
    icon: Wallet,
  },
};

const typeIcons: Record<string, string> = {
  platform: "💻",
  aptitude: "🎯",
  academic: "📚",
  purchase: "🛒",
};

const typeLabels: Record<string, string> = {
  platform: "منصة",
  aptitude: "قدرات",
  academic: "تحصيلي",
  purchase: "مشتريات",
};

// ═══════════════════════════════════════════════════════════════════
export default function ParentDashboard() {
  // ✅ Single source of truth — one state for selected student
  const [selectedStudentId, setSelectedStudentId] =
    useState<Id<"users"> | null>(null);
  const [activeTab, setActiveTab] = useState<
    "children" | "grades" | "groups" | "payments"
  >("children");

  // ── Queries ───────────────────────────────────────────────────
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // ✅ جلب الأبناء مع معاملاتهم
  const childrenWithTransactions = useQuery(
    api.user.parents.getChildrenWithTransactions,
    currentUser?._id ? { parentId: currentUser._id as Id<"users"> } : "skip",
  );

  const grades = useQuery(
    api.user.parents.getStudentGrades,
    selectedStudentId ? { studentId: selectedStudentId } : "skip",
  );
  console.log(grades);

  const groups = useQuery(
    api.groups.groups.getStudentGroups,
    selectedStudentId ? { studentId: selectedStudentId } : "skip",
  );

  // ── Loading / auth guard ──────────────────────────────────────
  if (currentUser === undefined || childrenWithTransactions === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (!currentUser || currentUser.role !== "parent") {
    return (
      <div className="flex items-center justify-center min-h-screen" dir="rtl">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <p className="text-gray-600">غير مصرح بالوصول</p>
        </div>
      </div>
    );
  }

  // ── Derived data ──────────────────────────────────────────────
  const childrenList = childrenWithTransactions ?? [];

  const getChildTransactions = (childId: Id<"users">) => {
    const child = childrenList.find((c: any) => c?._id === childId);
    return child?.transactions || [];
  };

  const allTransactions = childrenList.flatMap(
    (child: any) => child?.transactions || [],
  );
  const studentTransactions = selectedStudentId
    ? getChildTransactions(selectedStudentId)
    : allTransactions;

  const gradeData = grades ?? { examGrades: [], assignmentGrades: [] };
  const groupList = groups ?? [];

  const selectedChild = childrenList.find(
    (c: any) => c?._id === selectedStudentId,
  );

  const getSubscriptionStatus = (transactions: any[]) => {
    if (!transactions || transactions.length === 0) return "inactive";
    const sorted = [...transactions].sort(
      (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
    );
    const latest = sorted[0];
    if (latest.status === "completed" || latest.status === "approved")
      return "active";
    if (latest.status === "pending") return "awaiting_approval";
    if (latest.status === "rejected" || latest.status === "failed")
      return "rejected";
    return "inactive";
  };

  const totalPaid = studentTransactions
    .filter((t: any) => t.status === "completed" || t.status === "approved")
    .reduce((s: number, t: any) => s + (t.amount || 0), 0);

  const totalPending = studentTransactions
    .filter((t: any) => t.status === "pending")
    .reduce((s: number, t: any) => s + (t.amount || 0), 0);

  const unpaidCount = studentTransactions.filter(
    (t: any) =>
      t.status === "pending" ||
      t.status === "failed" ||
      t.status === "rejected",
  ).length;

  const gradedCount =
    gradeData.examGrades?.filter((g: any) => g.status === "graded").length ?? 0;

  const handleSelectStudent = (
    id: Id<"users">,
    tab: "grades" | "groups" | "payments" = "grades",
  ) => {
    setSelectedStudentId(id);
    setActiveTab(tab);
  };

  const tabs = [
    { key: "children" as const, label: "الأبناء", icon: Users },
    { key: "grades" as const, label: "الدرجات", icon: Award },
    { key: "groups" as const, label: "المجموعات", icon: FolderOpen },
    { key: "payments" as const, label: "المدفوعات", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              لوحة تحكم ولي الأمر
            </h1>
            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
              <span>🎓</span> مرحباً {currentUser.name}
            </p>
            <div className="flex flex-wrap gap-4 mt-2">
              {currentUser.phoneNumber && (
                <span className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone className="h-3.5 w-3.5" />
                  {currentUser.phoneNumber}
                </span>
              )}
              {currentUser.email && (
                <span className="flex items-center gap-1.5 text-xs bg-teal-600 text-white px-2 py-1 rounded-full">
                  <Mail className="h-3.5 w-3.5" />
                  {currentUser.email}
                </span>
              )}
            </div>
          </div>
          <span className="bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full">
            {childrenList.length} طالب
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {/* ── Stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "الأبناء",
              value: childrenList.length,
              icon: Users,
              iconCls: "text-blue-500",
              bg: "bg-blue-50",
            },
            {
              label: "الدرجات المصححة",
              value: gradedCount,
              icon: Award,
              iconCls: "text-green-500",
              bg: "bg-green-50",
            },
            {
              label: "مدفوعات معلقة",
              value: totalPending > 0 ? `${totalPending} ج.م` : "0",
              icon: CreditCard,
              iconCls: "text-amber-500",
              bg: "bg-amber-50",
            },
            {
              label: "يجب الدفع",
              value: unpaidCount,
              icon: AlertCircle,
              iconCls: "text-red-500",
              bg: "bg-red-50",
            },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="bg-white rounded-xl border border-gray-100 p-5 flex items-center justify-between"
              >
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{s.label}</p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center`}
                >
                  <Icon className={`h-5 w-5 ${s.iconCls}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Quick child picker ─────────────────────────────── */}
        {childrenList.length > 0 && (
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm text-gray-500">عرض بيانات:</span>
            {childrenList.map((child: any) => {
              if (!child) return null;
              const isSelected = selectedStudentId === child._id;
              const childTxs = getChildTransactions(child._id);
              const status = getSubscriptionStatus(childTxs);
              const statusDotColor =
                {
                  active: "bg-green-500",
                  awaiting_approval: "bg-amber-500",
                  rejected: "bg-red-500",
                  inactive: "bg-gray-300",
                }[status] || "bg-gray-300";

              return (
                <button
                  key={child._id}
                  onClick={() =>
                    setSelectedStudentId(
                      isSelected ? null : (child._id as Id<"users">),
                    )
                  }
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium cursor-pointer border-2 transition-all ${isSelected
                    ? "bg-teal-600 text-white border-teal-600"
                    : "bg-white text-gray-700 border-gray-200 hover:border-teal-400"
                    }`}
                >
                  <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                    {child.name?.charAt(0)}
                  </span>
                  {child.name}
                  {child.isPrimary && (
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded-full ${isSelected
                        ? "bg-white/20 text-white"
                        : "bg-amber-100 text-amber-700"
                        }`}
                    >
                      رئيسي
                    </span>
                  )}
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${statusDotColor}`}
                  />
                </button>
              );
            })}
          </div>
        )}

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Tab bar */}
          <div className="border-b border-gray-100 flex overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium cursor-pointer border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.key
                    ? "border-teal-600 text-teal-600 bg-teal-50/50"
                    : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* ── TAB: الأبناء ─────────────────────────────────────── */}
          {activeTab === "children" && (
            <div className="p-6">
              {childrenList.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">لا يوجد أبناء مرتبطون بحسابك</p>
                  <p className="text-xs text-gray-400 mt-1">
                    تواصل مع الإدارة لربط حسابات الأبناء
                  </p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {childrenList.map((child: any) => {
                    if (!child) return null;
                    const childTxs = getChildTransactions(child._id);
                    const status = getSubscriptionStatus(childTxs);

                    const statusLabelsMap: Record<string, string> = {
                      active: "نشط ✅",
                      awaiting_approval: "قيد المراجعة ⏳",
                      rejected: "مرفوض ❌",
                      inactive: "غير مفعل",
                    };

                    const statusColorsMap: Record<string, string> = {
                      active: "bg-green-100 text-green-700",
                      awaiting_approval: "bg-amber-100 text-amber-700",
                      rejected: "bg-red-100 text-red-600",
                      inactive: "bg-gray-100 text-gray-600",
                    };

                    const totalPaidChild = childTxs
                      .filter(
                        (t: any) =>
                          t.status === "completed" || t.status === "approved",
                      )
                      .reduce((s: number, t: any) => s + (t.amount || 0), 0);

                    return (
                      <div
                        key={child._id}
                        className="border border-gray-100 rounded-xl p-5 hover:border-teal-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-lg">
                              {child.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm">
                                {child.name}
                              </p>
                              <p className="text-xs text-gray-400">
                                رقم الطالب: {child.studentId ?? "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {child.relationship && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                                {child.relationship}
                              </span>
                            )}
                            {child.isPrimary && (
                              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                رئيسي
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <GraduationCap className="h-3.5 w-3.5 text-teal-500" />
                            <span>{child.grade ?? "غير محدد"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs">
                            <span
                              className={`px-2 py-0.5 rounded-full ${statusColorsMap[status] || "bg-gray-100 text-gray-600"}`}
                            >
                              {statusLabelsMap[status] || "غير محدد"}
                            </span>
                          </div>
                          {childTxs.length > 0 && (
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Wallet className="h-3.5 w-3.5 text-teal-500" />
                              <span>إجمالي المدفوع: {totalPaidChild} ج.م</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() =>
                              handleSelectStudent(
                                child._id as Id<"users">,
                                "grades",
                              )
                            }
                            className="flex flex-col items-center gap-1 p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-xs transition-colors"
                          >
                            <Award className="h-4 w-4" />
                            الدرجات
                          </button>
                          <button
                            onClick={() =>
                              handleSelectStudent(
                                child._id as Id<"users">,
                                "groups",
                              )
                            }
                            className="flex flex-col items-center gap-1 p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs transition-colors"
                          >
                            <FolderOpen className="h-4 w-4" />
                            المجموعات
                          </button>
                          <button
                            onClick={() =>
                              handleSelectStudent(
                                child._id as Id<"users">,
                                "payments",
                              )
                            }
                            className="flex flex-col items-center gap-1 p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-xs transition-colors"
                          >
                            <CreditCard className="h-4 w-4" />
                            المدفوعات
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── TAB: الدرجات ─────────────────────────────────────── */}
          {activeTab === "grades" && (
            <div className="p-6">
              {!selectedStudentId ? (
                <div className="text-center py-12">
                  <Award className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">اختر طالباً لعرض درجاته</p>
                  <p className="text-xs text-gray-400 mt-1">
                    اضغط على اسم الطالب في الأعلى أو من تبويب الأبناء
                  </p>
                </div>
              ) : grades === undefined ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : (
                <div className="space-y-6">
                  <p className="text-sm text-gray-500">
                    درجات:{" "}
                    <span className="font-semibold text-gray-800">
                      {selectedChild?.name}
                    </span>
                  </p>

                  {/* ✅ Exam grades مع زر Eye */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-teal-600" />
                      درجات الامتحانات ({gradeData.examGrades?.length ?? 0})
                    </h3>
                    {(gradeData.examGrades?.length ?? 0) === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl">
                        لا توجد امتحانات مسجلة
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {gradeData.examGrades.map((g: any) => {
                          const percentage = g.maxMarks > 0
                            ? Math.round((g.totalMarks / g.maxMarks) * 100)
                            : 0;
                          const isPassing = percentage >= 50;

                          return (
                            <div
                              key={g._id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 transition-all"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  {g.examTitle}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {g.examSubject} — {formatDate(g.examDate)}
                                </p>
                              </div>
                              <div className="text-left flex items-center gap-4">
                                <div className="text-center">
                                  {g.status === "graded" ? (
                                    <>
                                      <p className={`text-xl font-bold ${isPassing ? 'text-teal-600' : 'text-red-500'}`}>
                                        {g.totalMarks}
                                      </p>
                                      {g.maxMarks > 0 && (
                                        <p className="text-xs text-gray-400">
                                          / {g.maxMarks} • {percentage}%
                                        </p>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                      انتظار التصحيح
                                    </span>
                                  )}
                                </div>

                                {/* ✅ زر Eye - يظهر فقط بعد التصحيح */}
                                {g.status === "graded" && g.examId && (
                                  <Link
                                    href={`/parent/exam/${g.examId}?student=${selectedStudentId}`}
                                    className="p-2 bg-white hover:bg-teal-50 rounded-lg border border-gray-200 hover:border-teal-300 transition-all group"
                                    title="عرض الامتحان مع الإجابات والتصحيح"
                                  >
                                    <Eye className="h-5 w-5 text-gray-500 group-hover:text-teal-600 transition-colors" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* ✅ Assignment grades */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-teal-600" />
                      درجات الواجبات ({gradeData.assignmentGrades?.length ?? 0})
                    </h3>
                    {(gradeData.assignmentGrades?.length ?? 0) === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-6 bg-gray-50 rounded-xl">
                        لا توجد واجبات مسجلة
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {gradeData.assignmentGrades.map((g: any) => {
                          const percentage = g.maxGrade > 0
                            ? Math.round((g.grade / g.maxGrade) * 100)
                            : 0;
                          const isPassing = percentage >= 50;

                          return (
                            <div
                              key={g._id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 transition-all"
                            >
                              <div>
                                <p className="text-sm font-semibold text-gray-900">
                                  {g.assignmentTitle}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  تاريخ التسليم: {formatDate(g.assignmentDueDate)}
                                </p>
                              </div>
                              <div className="text-left">
                                {g.status === "graded" ? (
                                  <div className="text-center">
                                    <p className={`text-xl font-bold ${isPassing ? 'text-teal-600' : 'text-red-500'}`}>
                                      {g.grade}
                                    </p>
                                    {g.maxGrade > 0 && (
                                      <p className="text-xs text-gray-400">
                                        / {g.maxGrade} • {percentage}%
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                                    انتظار التصحيح
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: المجموعات ───────────────────────────────────── */}
          {activeTab === "groups" && (
            <div className="p-6">
              {!selectedStudentId ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">اختر طالباً لعرض مجموعاته</p>
                </div>
              ) : groups === undefined ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : groupList.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">
                    لا توجد مجموعات للطالب {selectedChild?.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    مجموعات:{" "}
                    <span className="font-semibold text-gray-800">
                      {selectedChild?.name}
                    </span>
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {groupList.map((group: any) => {
                      if (!group) return null;
                      return (
                        <div
                          key={group._id}
                          className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-bold text-gray-900 text-sm">
                              {group.name}
                            </p>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${group.status === "active"
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                                }`}
                            >
                              {group.status === "active"
                                ? "نشطة"
                                : group.status}
                            </span>
                          </div>
                          <div className="space-y-1.5">
                            {group.subject && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <BookOpen className="h-3.5 w-3.5 text-teal-500" />
                                <span>{group.subject}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <GraduationCap className="h-3.5 w-3.5 text-teal-500" />
                              <span>{group.gradeName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Users className="h-3.5 w-3.5 text-teal-500" />
                              <span>المشرف: {group.supervisorName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Users className="h-3.5 w-3.5 text-teal-500" />
                              <span>{group.studentCount} طالب</span>
                            </div>
                            {group.schedule && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="h-3.5 w-3.5 text-teal-500" />
                                <span>
                                  {Array.isArray(group.schedule.days)
                                    ? group.schedule.days.join("، ")
                                    : (group.schedule.days ?? "—")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── TAB: المدفوعات ───────────────────────────────────── */}
          {activeTab === "payments" && (
            <div className="p-6">
              <div className="space-y-6">
                {/* ✅ حالة اشتراك الأبناء من المعاملات */}
                {childrenList.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          اشتراكات الأبناء
                        </h3>
                        <p className="text-xs text-gray-500">
                          حالة اشتراك كل ابن في المنصة
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {childrenList.map((child: any) => {
                        const childTxs = getChildTransactions(child._id);
                        const sortedTxs = [...childTxs].sort(
                          (a, b) => (b.createdAt || 0) - (a.createdAt || 0),
                        );
                        const latestTx = sortedTxs[0];

                        const isActive =
                          latestTx?.status === "completed" ||
                          latestTx?.status === "approved";
                        const isPending = latestTx?.status === "pending";
                        const isRejected =
                          latestTx?.status === "rejected" ||
                          latestTx?.status === "failed";

                        const totalPaidChild = childTxs
                          .filter(
                            (t: any) =>
                              t.status === "completed" ||
                              t.status === "approved",
                          )
                          .reduce(
                            (s: number, t: any) => s + (t.amount || 0),
                            0,
                          );

                        return (
                          <div
                            key={child._id}
                            className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-teal-300 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center">
                                <span className="text-teal-700 font-bold text-sm">
                                  {child.name?.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {child.name}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {child.studentId || "رقم غير محدد"}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {isActive && (
                                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  مدفوع
                                </span>
                              )}
                              {isPending && (
                                <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5" />
                                  قيد المراجعة
                                </span>
                              )}
                              {isRejected && (
                                <span className="text-xs text-red-600 font-medium flex items-center gap-1">
                                  <XCircle className="h-3.5 w-3.5" />
                                  مرفوض
                                </span>
                              )}
                              {!isActive && !isPending && !isRejected && (
                                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  لم يدفع
                                </span>
                              )}
                              {totalPaidChild > 0 && (
                                <span className="text-xs text-gray-500">
                                  {totalPaidChild} ج.م
                                </span>
                              )}
                              {childTxs.length > 0 && (
                                <span className="text-xs text-gray-400">
                                  ({childTxs.length} معاملة)
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ✅ تفاصيل المعاملات للطالب المحدد */}
                {selectedStudentId ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Receipt className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          تفاصيل المعاملات
                        </h3>
                        <p className="text-xs text-gray-500">
                          {selectedChild?.name} — {studentTransactions.length}{" "}
                          معاملة
                        </p>
                      </div>
                    </div>

                    {studentTransactions.length === 0 ? (
                      <p className="text-center text-gray-400 py-6">
                        لا توجد معاملات للطالب {selectedChild?.name}
                      </p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {studentTransactions.map((tx: any) => (
                          <div
                            key={tx._id}
                            className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:border-purple-200 transition-all"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">
                                {typeIcons[tx.type] || "💳"}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {tx.descriptionAr ||
                                    tx.description ||
                                    "معاملة"}
                                </p>
                                <p className="text-xs text-gray-400 flex items-center gap-2">
                                  <span>{typeLabels[tx.type] || tx.type}</span>
                                  <span>•</span>
                                  <span>{formatDate(tx.createdAt)}</span>
                                  {tx.teacherName && (
                                    <>
                                      <span>•</span>
                                      <span>المعلم: {tx.teacherName}</span>
                                    </>
                                  )}
                                </p>
                              </div>
                            </div>
                            <div className="text-left flex items-center gap-3">
                              <span className="text-sm font-bold text-gray-900">
                                {tx.amount} {tx.currency || "ج.م"}
                              </span>
                              <span
                                className={`text-xs px-2 py-1 rounded-full ${statusLabels[tx.status]?.cls || "bg-gray-100 text-gray-600"}`}
                              >
                                {statusLabels[tx.status]?.label || tx.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
                    <p className="text-gray-400">
                      اختر طالباً لعرض تفاصيل معاملاته
                    </p>
                  </div>
                )}

                {/* ✅ ملخص سريع */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-xl p-4 border border-green-200">
                    <p className="text-xs text-green-600 font-medium">
                      المدفوع
                    </p>
                    <p className="text-xl font-bold text-green-700 mt-1">
                      {
                        allTransactions.filter(
                          (t: any) =>
                            t.status === "completed" || t.status === "approved",
                        ).length
                      }
                    </p>
                    <p className="text-xs text-green-500">معاملات مكتملة</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
                    <p className="text-xs text-amber-600 font-medium">
                      قيد الانتظار
                    </p>
                    <p className="text-xl font-bold text-amber-700 mt-1">
                      {
                        allTransactions.filter(
                          (t: any) => t.status === "pending",
                        ).length
                      }
                    </p>
                    <p className="text-xs text-amber-500">
                      معاملات قيد المراجعة
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-4 border border-red-200">
                    <p className="text-xs text-red-600 font-medium">
                      مرفوض / فشل
                    </p>
                    <p className="text-xl font-bold text-red-700 mt-1">
                      {
                        allTransactions.filter(
                          (t: any) =>
                            t.status === "rejected" || t.status === "failed",
                        ).length
                      }
                    </p>
                    <p className="text-xs text-red-500">معاملات مرفوضة</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
