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
  Video,
  UserCheck,
  UserX,
  TrendingUp,
  BarChart3,
  ChevronLeft,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";

// ── Helpers ───────────────────────────────────────────────────────
function formatDate(ts?: number) {
  if (!ts) return "—";
  return format(new Date(ts), "dd MMM yyyy", { locale: ar });
}

function formatTime(ts?: number) {
  if (!ts) return "—";
  return format(new Date(ts), "HH:mm", { locale: ar });
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

const attendanceStatusMap: Record<
  string,
  { label: string; cls: string; icon: any }
> = {
  pending: {
    label: "قيد المراجعة",
    cls: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  approved: {
    label: "✅ حضر",
    cls: "bg-green-100 text-green-700",
    icon: CheckCircle,
  },
  rejected: {
    label: "❌ لم يحضر",
    cls: "bg-red-100 text-red-600",
    icon: XCircle,
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
  const [selectedStudentId, setSelectedStudentId] =
    useState<Id<"users"> | null>(null);
  const [activeTab, setActiveTab] = useState<
    "children" | "grades" | "groups" | "payments" | "attendance"
  >("children");
  const [isMobileChildrenOpen, setIsMobileChildrenOpen] = useState(false);

  // ── Queries ───────────────────────────────────────────────────
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  const childrenWithTransactions = useQuery(
    api.user.parents.getChildrenWithTransactions,
    currentUser?._id ? { parentId: currentUser._id as Id<"users"> } : "skip",
  );

  const grades = useQuery(
    api.user.parents.getStudentGrades,
    selectedStudentId ? { studentId: selectedStudentId } : "skip",
  );

  const groups = useQuery(
    api.groups.groups.getStudentGroups,
    selectedStudentId ? { studentId: selectedStudentId } : "skip",
  );

  const childrenAttendance = useQuery(
    api.liveClasses.liveClasses.getChildrenAttendance,
    currentUser?._id ? { parentId: currentUser._id as Id<"users"> } : "skip",
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

  const attendanceStats = {
    total: childrenAttendance?.length || 0,
    approved:
      childrenAttendance?.filter((a: any) => a.status === "approved").length ||
      0,
    pending:
      childrenAttendance?.filter((a: any) => a.status === "pending").length || 0,
    rejected:
      childrenAttendance?.filter((a: any) => a.status === "rejected").length ||
      0,
  };

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
    tab: "grades" | "groups" | "payments" | "attendance" = "grades",
  ) => {
    setSelectedStudentId(id);
    setActiveTab(tab);
    setIsMobileChildrenOpen(false);
  };

  const tabs = [
    { key: "children" as const, label: "الأبناء", icon: Users },
    { key: "grades" as const, label: "الدرجات", icon: Award },
    { key: "groups" as const, label: "المجموعات", icon: FolderOpen },
    { key: "payments" as const, label: "المدفوعات", icon: CreditCard },
    { key: "attendance" as const, label: "الحضور", icon: Video },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 md:py-5">
        <div className="max-w-6xl mx-auto flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900">
              لوحة تحكم ولي الأمر
            </h1>
            <p className="text-xs md:text-sm text-gray-500 mt-1 flex items-center gap-1">
              <span>🎓</span> مرحباً {currentUser.name}
            </p>
            <div className="flex flex-wrap gap-2 md:gap-4 mt-2">
              {currentUser.phoneNumber && (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                  <Phone className="h-3 w-3" />
                  <span className="hidden sm:inline">{currentUser.phoneNumber}</span>
                </span>
              )}
              {currentUser.email && (
                <span className="flex items-center gap-1 text-xs bg-teal-600 text-white px-2 py-1 rounded-full">
                  <Mail className="h-3 w-3" />
                  <span className="hidden sm:inline">{currentUser.email}</span>
                </span>
              )}
            </div>
          </div>
          <span className="bg-teal-600 text-white text-xs font-semibold px-3 py-1.5 rounded-full shrink-0">
            {childrenList.length} طالب
          </span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* ── Stats ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
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
                className="bg-white rounded-xl border border-gray-100 p-3 md:p-5 flex items-center justify-between"
              >
                <div>
                  <p className="text-lg md:text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-[10px] md:text-xs text-gray-500 mt-0.5 md:mt-1">{s.label}</p>
                </div>
                <div
                  className={`w-8 h-8 md:w-10 md:h-10 rounded-xl ${s.bg} flex items-center justify-center`}
                >
                  <Icon className={`h-4 w-4 md:h-5 md:w-5 ${s.iconCls}`} />
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Quick child picker ─────────────────────────────── */}
        {childrenList.length > 0 && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
            <span className="text-xs md:text-sm text-gray-500 shrink-0">عرض بيانات:</span>
            <div className="flex flex-wrap gap-1.5 md:gap-2 w-full sm:w-auto">
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
                    className={`flex items-center gap-1.5 md:gap-2 px-2 md:px-4 py-1.5 md:py-2 rounded-full text-xs md:text-sm font-medium cursor-pointer border-2 transition-all ${isSelected
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-gray-700 border-gray-200 hover:border-teal-400"
                      }`}
                  >
                    <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                      {child.name?.charAt(0)}
                    </span>
                    <span className="truncate max-w-16 md:max-w-none">{child.name}</span>
                    {child.isPrimary && (
                      <span
                        className={`text-[8px] md:text-xs px-1 md:px-1.5 py-0.5 rounded-full hidden sm:inline ${isSelected
                            ? "bg-white/20 text-white"
                            : "bg-amber-100 text-amber-700"
                          }`}
                      >
                        رئيسي
                      </span>
                    )}
                    <span
                      className={`w-2 h-2 rounded-full ${statusDotColor}`}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Tabs ───────────────────────────────────────────────── */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Tab bar - موبايل friendly */}
          <div className="border-b border-gray-100 flex overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 md:gap-3 px-3 md:px-6 py-3 md:py-4 text-sm md:text-lg font-bold cursor-pointer border-b-2 whitespace-nowrap transition-colors shrink-0 ${isActive
                      ? "border-teal-600 text-teal-600 bg-teal-50/50"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                    }`}
                >
                  <Icon className="h-3.5 w-3.5 md:h-5 md:w-5" />
                  <span className="text-xs md:text-base">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* ── TAB: الأبناء ─────────────────────────────────────── */}
          {activeTab === "children" && (
            <div className="p-3 md:p-6">
              {childrenList.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Users className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm md:text-base text-gray-500">لا يوجد أبناء مرتبطون بحسابك</p>
                  <p className="text-xs text-gray-400 mt-1">تواصل مع الإدارة لربط حسابات الأبناء</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
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
                        className="border border-gray-100 rounded-xl p-4 md:p-5 hover:border-teal-300 hover:shadow-sm transition-all"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2 md:gap-3">
                            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-base md:text-lg">
                              {child.name?.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-gray-900 text-sm md:text-base">
                                {child.name}
                              </p>
                              <p className="text-[10px] md:text-xs text-gray-400">
                                رقم الطالب: {child.studentId ?? "—"}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1 flex-wrap justify-end">
                            {child.relationship && (
                              <span className="text-[8px] md:text-xs bg-blue-100 text-blue-700 px-1.5 md:px-2 py-0.5 rounded-full">
                                {child.relationship}
                              </span>
                            )}
                            {child.isPrimary && (
                              <span className="text-[8px] md:text-xs bg-amber-100 text-amber-700 px-1.5 md:px-2 py-0.5 rounded-full">
                                رئيسي
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="space-y-1.5 mb-3 md:mb-4">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <GraduationCap className="h-3 w-3 text-teal-500" />
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
                              <Wallet className="h-3 w-3 text-teal-500" />
                              <span>إجمالي المدفوع: {totalPaidChild} ج.م</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-1.5 md:gap-2">
                          <button
                            onClick={() =>
                              handleSelectStudent(
                                child._id as Id<"users">,
                                "grades",
                              )
                            }
                            className="flex flex-col items-center gap-0.5 md:gap-1 p-1.5 md:p-2 bg-green-50 hover:bg-green-100 text-green-700 rounded-lg text-[10px] md:text-xs transition-colors"
                          >
                            <Award className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            الدرجات
                          </button>
                          <button
                            onClick={() =>
                              handleSelectStudent(
                                child._id as Id<"users">,
                                "groups",
                              )
                            }
                            className="flex flex-col items-center gap-0.5 md:gap-1 p-1.5 md:p-2 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-[10px] md:text-xs transition-colors"
                          >
                            <FolderOpen className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            المجموعات
                          </button>
                          <button
                            onClick={() =>
                              handleSelectStudent(
                                child._id as Id<"users">,
                                "payments",
                              )
                            }
                            className="flex flex-col items-center gap-0.5 md:gap-1 p-1.5 md:p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-lg text-[10px] md:text-xs transition-colors"
                          >
                            <CreditCard className="h-3.5 w-3.5 md:h-4 md:w-4" />
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
            <div className="p-3 md:p-6">
              {!selectedStudentId ? (
                <div className="text-center py-8 md:py-12">
                  <Award className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm md:text-base text-gray-500">اختر طالباً لعرض درجاته</p>
                  <p className="text-xs text-gray-400 mt-1">اضغط على اسم الطالب في الأعلى</p>
                </div>
              ) : grades === undefined ? (
                <div className="flex items-center justify-center py-8 md:py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  <p className="text-sm text-gray-500">
                    درجات:{" "}
                    <span className="font-semibold text-gray-800">
                      {selectedChild?.name}
                    </span>
                  </p>

                  {/* Exam grades */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2 md:mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-teal-600" />
                      درجات الامتحانات ({gradeData.examGrades?.length ?? 0})
                    </h3>
                    {(gradeData.examGrades?.length ?? 0) === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4 md:py-6 bg-gray-50 rounded-xl">
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
                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 transition-all gap-2"
                            >
                              <div className="flex-1 w-full">
                                <p className="text-sm font-semibold text-gray-900">
                                  {g.examTitle}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {g.examSubject} — {formatDate(g.examDate)}
                                </p>
                              </div>
                              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-center">
                                  {g.status === "graded" ? (
                                    <>
                                      <p className={`text-lg md:text-xl font-bold ${isPassing ? 'text-teal-600' : 'text-red-500'}`}>
                                        {g.totalMarks}
                                      </p>
                                      {g.maxMarks > 0 && (
                                        <p className="text-[10px] md:text-xs text-gray-400">
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

                                {g.status === "graded" && g.examId && (
                                  <Link
                                    href={`/parent/exam/${g.examId}?student=${selectedStudentId}`}
                                    className="p-2 bg-white hover:bg-teal-50 rounded-lg border border-gray-200 hover:border-teal-300 transition-all group shrink-0"
                                    title="عرض الامتحان"
                                  >
                                    <Eye className="h-4 w-4 md:h-5 md:w-5 text-gray-500 group-hover:text-teal-600 transition-colors" />
                                  </Link>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Assignment grades */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 mb-2 md:mb-3 flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-teal-600" />
                      درجات الواجبات ({gradeData.assignmentGrades?.length ?? 0})
                    </h3>
                    {(gradeData.assignmentGrades?.length ?? 0) === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4 md:py-6 bg-gray-50 rounded-xl">
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
                              className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 transition-all gap-2"
                            >
                              <div className="flex-1 w-full">
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
                                    <p className={`text-lg md:text-xl font-bold ${isPassing ? 'text-teal-600' : 'text-red-500'}`}>
                                      {g.grade}
                                    </p>
                                    {g.maxGrade > 0 && (
                                      <p className="text-[10px] md:text-xs text-gray-400">
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
            <div className="p-3 md:p-6">
              {!selectedStudentId ? (
                <div className="text-center py-8 md:py-12">
                  <FolderOpen className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm md:text-base text-gray-500">اختر طالباً لعرض مجموعاته</p>
                </div>
              ) : groups === undefined ? (
                <div className="flex items-center justify-center py-8 md:py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : groupList.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <FolderOpen className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm md:text-base text-gray-500">
                    لا توجد مجموعات للطالب {selectedChild?.name}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  <p className="text-sm text-gray-500">
                    مجموعات:{" "}
                    <span className="font-semibold text-gray-800">
                      {selectedChild?.name}
                    </span>
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                    {groupList.map((group: any) => {
                      if (!group) return null;
                      return (
                        <div
                          key={group._id}
                          className="border border-gray-100 rounded-xl p-4 md:p-5 hover:shadow-sm transition-shadow"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="font-bold text-gray-900 text-sm md:text-base">
                              {group.name}
                            </p>
                            <span
                              className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full ${group.status === "active"
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
                                <BookOpen className="h-3 w-3 text-teal-500" />
                                <span>{group.subject}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <GraduationCap className="h-3 w-3 text-teal-500" />
                              <span>{group.gradeName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Users className="h-3 w-3 text-teal-500" />
                              <span>المشرف: {group.supervisorName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <Users className="h-3 w-3 text-teal-500" />
                              <span>{group.studentCount} طالب</span>
                            </div>
                            {group.schedule && (
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="h-3 w-3 text-teal-500" />
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
            <div className="p-3 md:p-6">
              <div className="space-y-4 md:space-y-6">
                {/* Subscription status */}
                {childrenList.length > 0 && (
                  <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                        <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                          اشتراكات الأبناء
                        </h3>
                        <p className="text-[10px] md:text-xs text-gray-500">
                          حالة اشتراك كل ابن في المنصة
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 md:space-y-3">
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
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 rounded-xl border border-gray-100 hover:border-teal-300 transition-all gap-2"
                          >
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <div className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                                <span className="text-teal-700 font-bold text-xs md:text-sm">
                                  {child.name?.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 text-sm">
                                  {child.name}
                                </p>
                                <p className="text-[10px] md:text-xs text-gray-400">
                                  {child.studentId || "رقم غير محدد"}
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                              {isActive && (
                                <span className="text-[10px] md:text-xs text-green-600 font-medium flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3" />
                                  مدفوع
                                </span>
                              )}
                              {isPending && (
                                <span className="text-[10px] md:text-xs text-amber-600 font-medium flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  قيد المراجعة
                                </span>
                              )}
                              {isRejected && (
                                <span className="text-[10px] md:text-xs text-red-600 font-medium flex items-center gap-1">
                                  <XCircle className="h-3 w-3" />
                                  مرفوض
                                </span>
                              )}
                              {!isActive && !isPending && !isRejected && (
                                <span className="text-[10px] md:text-xs text-gray-400 font-medium flex items-center gap-1">
                                  <AlertCircle className="h-3 w-3" />
                                  لم يدفع
                                </span>
                              )}
                              {totalPaidChild > 0 && (
                                <span className="text-[10px] md:text-xs text-gray-500">
                                  {totalPaidChild} ج.م
                                </span>
                              )}
                              {childTxs.length > 0 && (
                                <span className="text-[10px] md:text-xs text-gray-400">
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

                {/* Transaction details */}
                {selectedStudentId ? (
                  <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-purple-50 flex items-center justify-center">
                        <Receipt className="h-4 w-4 md:h-5 md:w-5 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm md:text-base">
                          تفاصيل المعاملات
                        </h3>
                        <p className="text-[10px] md:text-xs text-gray-500">
                          {selectedChild?.name} — {studentTransactions.length}{" "}
                          معاملة
                        </p>
                      </div>
                    </div>

                    {studentTransactions.length === 0 ? (
                      <p className="text-center text-gray-400 py-4 md:py-6 text-sm">
                        لا توجد معاملات للطالب {selectedChild?.name}
                      </p>
                    ) : (
                      <div className="space-y-2 md:space-y-3 max-h-80 md:max-h-96 overflow-y-auto">
                        {studentTransactions.map((tx: any) => (
                          <div
                            key={tx._id}
                            className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 rounded-xl border border-gray-100 hover:border-purple-200 transition-all gap-2"
                          >
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                              <span className="text-lg md:text-xl shrink-0">
                                {typeIcons[tx.type] || "💳"}
                              </span>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {tx.descriptionAr ||
                                    tx.description ||
                                    "معاملة"}
                                </p>
                                <p className="text-[10px] md:text-xs text-gray-400 flex flex-wrap items-center gap-1 md:gap-2">
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
                            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                              <span className="text-sm md:text-base font-bold text-gray-900">
                                {tx.amount} {tx.currency || "ج.م"}
                              </span>
                              <span
                                className={`text-[10px] md:text-xs px-2 py-1 rounded-full ${statusLabels[tx.status]?.cls || "bg-gray-100 text-gray-600"}`}
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
                  <div className="bg-white rounded-xl border border-gray-200 p-4 md:p-5 text-center">
                    <p className="text-sm md:text-base text-gray-400">
                      اختر طالباً لعرض تفاصيل معاملاته
                    </p>
                  </div>
                )}

                {/* Quick summary */}
                <div className="grid grid-cols-3 gap-2 md:gap-4">
                  <div className="bg-green-50 rounded-xl p-3 md:p-4 border border-green-200">
                    <p className="text-[10px] md:text-xs text-green-600 font-medium">المدفوع</p>
                    <p className="text-lg md:text-xl font-bold text-green-700 mt-1">
                      {
                        allTransactions.filter(
                          (t: any) =>
                            t.status === "completed" || t.status === "approved",
                        ).length
                      }
                    </p>
                    <p className="text-[8px] md:text-xs text-green-500">معاملات مكتملة</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 md:p-4 border border-amber-200">
                    <p className="text-[10px] md:text-xs text-amber-600 font-medium">قيد الانتظار</p>
                    <p className="text-lg md:text-xl font-bold text-amber-700 mt-1">
                      {
                        allTransactions.filter(
                          (t: any) => t.status === "pending",
                        ).length
                      }
                    </p>
                    <p className="text-[8px] md:text-xs text-amber-500">قيد المراجعة</p>
                  </div>
                  <div className="bg-red-50 rounded-xl p-3 md:p-4 border border-red-200">
                    <p className="text-[10px] md:text-xs text-red-600 font-medium">مرفوض</p>
                    <p className="text-lg md:text-xl font-bold text-red-700 mt-1">
                      {
                        allTransactions.filter(
                          (t: any) =>
                            t.status === "rejected" || t.status === "failed",
                        ).length
                      }
                    </p>
                    <p className="text-[8px] md:text-xs text-red-500">معاملات مرفوضة</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAB: الحضور ──────────────────────────────────────── */}
          {activeTab === "attendance" && (
            <div className="p-3 md:p-6">
              {childrenList.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Video className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm md:text-base text-gray-500">لا يوجد أبناء مرتبطون بحسابك</p>
                  <p className="text-xs text-gray-400 mt-1">تواصل مع الإدارة لربط حسابات الأبناء</p>
                </div>
              ) : childrenAttendance === undefined ? (
                <div className="flex items-center justify-center py-8 md:py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                </div>
              ) : childrenAttendance.length === 0 ? (
                <div className="text-center py-8 md:py-12">
                  <Video className="h-10 w-10 md:h-12 md:w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm md:text-base text-gray-500">لا يوجد سجل حضور</p>
                  <p className="text-xs text-gray-400 mt-1">لم يحضر أي من أبنائك حصصاً مباشرة بعد</p>
                </div>
              ) : (
                <div className="space-y-4 md:space-y-6">
                  {/* Attendance Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                    <div className="bg-blue-50 rounded-xl p-3 md:p-4 border border-blue-200">
                      <p className="text-[10px] md:text-xs text-blue-600 font-medium">إجمالي الحصص</p>
                      <p className="text-lg md:text-2xl font-bold text-blue-700 mt-1">
                        {attendanceStats.total}
                      </p>
                    </div>
                    <div className="bg-green-50 rounded-xl p-3 md:p-4 border border-green-200">
                      <p className="text-[10px] md:text-xs text-green-600 font-medium">حضر</p>
                      <p className="text-lg md:text-2xl font-bold text-green-700 mt-1">
                        {attendanceStats.approved}
                      </p>
                      <p className="text-[8px] md:text-xs text-green-500">
                        {attendanceStats.total > 0
                          ? Math.round(
                            (attendanceStats.approved / attendanceStats.total) *
                            100,
                          )
                          : 0}
                        %
                      </p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-3 md:p-4 border border-amber-200">
                      <p className="text-[10px] md:text-xs text-amber-600 font-medium">قيد المراجعة</p>
                      <p className="text-lg md:text-2xl font-bold text-amber-700 mt-1">
                        {attendanceStats.pending}
                      </p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-3 md:p-4 border border-red-200">
                      <p className="text-[10px] md:text-xs text-red-600 font-medium">لم يحضر</p>
                      <p className="text-lg md:text-2xl font-bold text-red-700 mt-1">
                        {attendanceStats.rejected}
                      </p>
                    </div>
                  </div>

                  {/* Attendance list by child */}
                  {childrenList.map((child: any) => {
                    const childAttendance = childrenAttendance.filter(
                      (a: any) => a.studentId === child._id,
                    );

                    if (childAttendance.length === 0) return null;

                    const childStats = {
                      total: childAttendance.length,
                      approved: childAttendance.filter(
                        (a: any) => a.status === "approved",
                      ).length,
                      pending: childAttendance.filter(
                        (a: any) => a.status === "pending",
                      ).length,
                      rejected: childAttendance.filter(
                        (a: any) => a.status === "rejected",
                      ).length,
                    };

                    return (
                      <div key={child._id} className="space-y-2 md:space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1 sm:gap-0">
                          <h3 className="text-sm md:text-base font-semibold text-gray-800 flex items-center gap-2">
                            <UserCheck className="h-4 w-4 text-teal-600" />
                            {child.name}
                            <span className="text-[10px] md:text-xs text-gray-400 font-normal">
                              ({childAttendance.length} حصة)
                            </span>
                          </h3>
                          <div className="flex items-center gap-2 md:gap-3 text-[10px] md:text-xs">
                            <span className="text-green-600">✅ {childStats.approved}</span>
                            <span className="text-amber-600">⏳ {childStats.pending}</span>
                            <span className="text-red-600">❌ {childStats.rejected}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 md:space-y-2">
                          {childAttendance.map((att: any) => {
                            const statusInfo = attendanceStatusMap[
                              att.status || "pending"
                            ] || {
                              label: "غير محدد",
                              cls: "bg-gray-100 text-gray-600",
                              icon: AlertCircle,
                            };
                            const StatusIcon = statusInfo.icon;

                            return (
                              <div
                                key={att._id}
                                className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-teal-200 transition-all gap-2"
                              >
                                <div className="flex-1 w-full">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-sm font-semibold text-gray-900">
                                      {att.title}
                                    </p>
                                    <span
                                      className={`text-[10px] md:text-xs px-2 py-0.5 rounded-full ${statusInfo.cls} flex items-center gap-0.5 md:gap-1`}
                                    >
                                      <StatusIcon className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                      {statusInfo.label}
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-1.5 md:gap-3 mt-1 text-[10px] md:text-xs text-gray-500">
                                    <span className="flex items-center gap-0.5 md:gap-1">
                                      <GraduationCap className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                      {att.groupName || "غير محدد"}
                                    </span>
                                    <span className="flex items-center gap-0.5 md:gap-1">
                                      <UserCheck className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                      {att.teacherName || "غير محدد"}
                                    </span>
                                    <span className="flex items-center gap-0.5 md:gap-1">
                                      <Calendar className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                      {formatDate(att.startTime)}
                                    </span>
                                    <span className="flex items-center gap-0.5 md:gap-1">
                                      <Clock className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                      {formatTime(att.startTime)}
                                    </span>
                                    {att.duration && (
                                      <span className="flex items-center gap-0.5 md:gap-1 text-green-600">
                                        <CheckCircle className="h-2.5 w-2.5 md:h-3 md:w-3" />
                                        {att.duration} دقيقة
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {att.recordingLink && (
                                  <a
                                    href={att.recordingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs md:text-sm text-purple-600 hover:underline flex items-center gap-1 shrink-0"
                                  >
                                    <Video className="h-3.5 w-3.5 md:h-4 md:w-4" />
                                    تسجيل
                                  </a>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}