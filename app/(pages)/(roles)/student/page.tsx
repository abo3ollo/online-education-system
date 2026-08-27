// app/(pages)/(roles)/student/dashboard/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { toast } from "sonner";
import {
  Bell,
  Calendar,
  CheckCircle,
  Clock,
  BookOpen,
  FileText,
  Users,
  MessageSquare,
  FolderOpen,
  Award,
  Wallet,
  Megaphone,
  User,
  Settings,
  TrendingUp,
  Star,
  PlayCircle,
  FileCheck,
  GraduationCap,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Ban,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Loader2,
  Video,
} from "lucide-react";
import { MdOutlinePermMedia } from "react-icons/md";
import { SiGoogleclassroom } from "react-icons/si";
import { FaChalkboardTeacher } from "react-icons/fa";
import { RiParentFill } from "react-icons/ri";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// أيام الأسبوع
const DAYS: Record<string, string> = {
  saturday: "السبت",
  sunday: "الأحد",
  monday: "الإثنين",
  tuesday: "الثلاثاء",
  wednesday: "الأربعاء",
  thursday: "الخميس",
  friday: "الجمعة",
};

// ✅ دالة مساعدة لتنسيق الوقت
const getTimeAgo = (timestamp: number) => {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `منذ ${days} يوم${days > 1 ? 'ين' : ''}`;
  }
  if (hours > 0) {
    return `منذ ${hours} ساعة${hours > 1 ? 'ين' : ''}`;
  }
  if (minutes > 0) {
    return `منذ ${minutes} دقيقة${minutes > 1 ? 'ين' : ''}`;
  }
  return "الآن";
};

// ✅ دالة للحصول على أيقونة الإشعار
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "teacher_message":
    case "system_announcement":
      return Megaphone;
    case "exam_published":
    case "exam_reminder":
      return FileText;
    case "new_assignment":
      return FileCheck;
    case "submission":
      return CheckCircle;
    default:
      return Bell;
  }
};

// ✅ دالة للحصول على لون الإشعار
const getNotificationColor = (type: string) => {
  switch (type) {
    case "teacher_message":
      return "bg-blue-100 text-blue-600";
    case "exam_published":
    case "exam_reminder":
      return "bg-purple-100 text-purple-600";
    case "new_assignment":
      return "bg-green-100 text-green-600";
    case "system_announcement":
      return "bg-amber-100 text-amber-600";
    case "submission":
      return "bg-teal-100 text-teal-600";
    default:
      return "bg-gray-100 text-gray-600";
  }
};

export default function StudentDashboard() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const [showSchedule, setShowSchedule] = useState<string | null>(null);
  const [activeEventTab, setActiveEventTab] = useState<"all" | "assignments" | "exams" | "live">("all");
  const [joiningClassId, setJoiningClassId] = useState<string | null>(null);

  // ✅ التحقق من حالة الاشتراك
  const subscriptionStatus = currentUser?.subscriptionStatus;
  const hasActiveSubscription = subscriptionStatus === "active";

  // ✅ جلب الإشعارات من قاعدة البيانات
  const notifications = useQuery(
    api.notifications.notifications.getMyNotifications,
    currentUser?._id ? { unreadOnly: false } : "skip"
  );

  // ✅ جلب عدد الإشعارات غير المقروءة
  const unreadCount = useQuery(
    api.notifications.notifications.getUnreadCount,
    currentUser?._id ? {} : "skip"
  );

  // جلب مجموعات الطالب
  const studentGroups = useQuery(
    api.groups.groups.getStudentGroups,
    currentUser?._id ? { studentId: currentUser._id as any } : "skip"
  );

  // جلب الواجبات القادمة
  const upcomingAssignments = useQuery(
    api.assignments.assignments.getUpcomingForStudent,
    currentUser?._id ? { studentId: currentUser._id as any } : "skip"
  );

  // جلب الامتحانات القادمة
  const upcomingExams = useQuery(
    api.exams.exams.getUpcomingForStudent,
    currentUser?._id ? { studentId: currentUser._id as any } : "skip"
  );

  // ✅ جلب الحصص المباشرة للطالب
  const liveClasses = useQuery(
    api.liveClasses.liveClasses.getStudentLiveClasses,
    currentUser?._id ? { studentId: currentUser._id as any } : "skip"
  );

  // ✅ جلب الجدول للمجموعة المحددة
  const schedule = useQuery(
    api.schedules.schedules.getScheduleByGroup,
    showSchedule ? { groupId: showSchedule as any } : "skip"
  );

  // ✅ Mutation لتسجيل الحضور
  const joinLiveClass = useMutation(api.liveClasses.liveClasses.joinLiveClass);

  // ✅ دالة تسجيل الحضور
  const handleJoinClass = async (liveClassId: string) => {
    if (!currentUser?._id) return;
    
    setJoiningClassId(liveClassId);
    try {
      const result = await joinLiveClass({
        liveClassId: liveClassId as any,
        studentId: currentUser._id as any,
      });

      if (result.alreadyJoined) {
        toast.info("✅ تم تسجيل حضورك مسبقاً");
      } else {
        toast.success("✅ تم تسجيل حضورك بنجاح (في انتظار تأكيد المعلم)");
      }
    } catch (error: any) {
      toast.error(error.message || "❌ فشل تسجيل الحضور");
    } finally {
      setJoiningClassId(null);
    }
  };

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      router.push("/");
      return;
    }

    if (currentUser !== undefined && currentUser?.role !== "student") {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  if (!isLoaded || !currentUser || currentUser.role !== "student") {
    return (
      <div className="flex items-center justify-center h-full bg-[#f7fafa]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001f24]"></div>
      </div>
    );
  }

  // الحصول على أيام الأسبوع للعرض
  const getDayLabel = (day: string) => DAYS[day] || day;

  // ✅ دالة عرض الجدول
  const renderScheduleTable = () => {
    if (!schedule) return (
      <div className="mt-3 p-4 text-center">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-[#1a7a8a]" />
        <p className="text-xs text-gray-400 mt-2">جاري تحميل الجدول...</p>
      </div>
    );

    if (!schedule.weekDays || schedule.weekDays.length === 0) {
      return (
        <div className="mt-3 p-4 text-center border border-dashed border-gray-200 rounded-lg">
          <Calendar className="h-8 w-8 mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">لا يوجد جدول لهذه المجموعة</p>
        </div>
      );
    }

    return (
      <div className="mt-3 space-y-3">
        <div className="border-t border-gray-200 pt-3">
          <div className="flex items-center justify-end text-xs text-gray-400 mb-2">
            <span>📅 الأسبوع الدراسي</span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto">
            {schedule.weekDays.map((day: any) => (
              <div key={day.day} className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                <p className="text-xs font-semibold text-[#1a7a8a] mb-1 flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {getDayLabel(day.day)}
                  {day.periods && day.periods.length > 0 && (
                    <span className="text-[10px] text-gray-400 font-normal">
                      ({day.periods.length} حصة)
                    </span>
                  )}
                </p>
                {day.periods?.length === 0 ? (
                  <p className="text-xs text-gray-400 px-2 py-1">لا توجد حصص</p>
                ) : (
                  <div className="space-y-1">
                    {day.periods?.map((period: any, index: number) => (
                      <div 
                        key={index} 
                        className={`flex items-center justify-between text-xs p-1.5 rounded ${
                          period.isBreak ? "bg-amber-50" : "hover:bg-white"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-3 w-3 text-gray-400" />
                          <span className="text-gray-600 font-mono text-[10px]">
                            {period.startTime} - {period.endTime}
                          </span>
                          {period.periodNumber && (
                            <span className="text-gray-400 text-[10px]">
                              #{period.periodNumber}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {period.isBreak ? (
                            <span className="text-amber-600 text-[10px] font-medium">☕ استراحة</span>
                          ) : (
                            <>
                              <span className="font-medium text-gray-700">
                                {period.subject}
                              </span>
                              {period.teacherName && (
                                <span className="text-gray-400 text-[10px] flex items-center gap-1">
                                  <FaChalkboardTeacher className="h-2.5 w-2.5" />
                                  {period.teacherName}
                                </span>
                              )}
                              {period.room && (
                                <span className="text-gray-400 text-[10px]">
                                  🚪 {period.room}
                                </span>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ✅ الإجازات */}
          {schedule.holidays && schedule.holidays.length > 0 && (
            <div className="mt-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
              <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                <Ban className="h-3 w-3" />
                الإجازات:
              </p>
              <div className="space-y-1 mt-1">
                {schedule.holidays.map((holiday: any, idx: number) => (
                  <p key={idx} className="text-xs text-amber-600">
                    {new Date(holiday.date).toLocaleDateString('ar-EG', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })} - {holiday.reason}
                    {holiday.type === "holiday" ? " 🎉" : " ⚠️"}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // دمج الأحداث القادمة
  const allUpcomingEvents = [
    ...(upcomingAssignments || []).map((a: any) => ({
      ...a,
      type: "assignment" as const,
      date: a.dueDate,
      label: "واجب",
      icon: FileCheck,
      color: "blue",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      textColor: "text-blue-600",
      iconBg: "bg-blue-100",
      dateLabel: "موعد التسليم",
    })),
    ...(upcomingExams || []).map((e: any) => ({
      ...e,
      type: "exam" as const,
      date: e.date,
      label: "امتحان",
      icon: FileText,
      color: "purple",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      textColor: "text-purple-600",
      iconBg: "bg-purple-100",
      dateLabel: "تاريخ الامتحان",
    })),
    // ✅ إضافة الحصص المباشرة للأحداث القادمة
    ...(liveClasses || []).map((lc: any) => ({
      ...lc,
      type: "live" as const,
      date: lc.startTime,
      label: lc.status === "live" ? "مباشر الآن" : "حصة مباشرة",
      icon: Video,
      color: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-600",
      iconBg: "bg-green-100",
      dateLabel: "تاريخ الحصة",
      title: lc.title,
      link: lc.link,
      groupName: lc.groupName,
      status: lc.status,
    })),
  ].sort((a, b) => a.date - b.date);

  // فلترة الأحداث حسب التاب المحدد
  const filteredEvents = allUpcomingEvents.filter((event) => {
    if (activeEventTab === "all") return true;
    if (activeEventTab === "assignments") return event.type === "assignment";
    if (activeEventTab === "exams") return event.type === "exam";
    if (activeEventTab === "live") return event.type === "live";
    return true;
  });

  // ✅ إحصائيات
  const stats = {
    assignments: upcomingAssignments?.length || 0,
    exams: upcomingExams?.length || 0,
    live: liveClasses?.filter((lc: any) => lc.status === "live" || lc.status === "scheduled").length || 0,
    total: allUpcomingEvents.length,
    groups: studentGroups?.length || 0,
    unread: unreadCount || 0,
  };

  // ✅ قائمة الإشعارات (من قاعدة البيانات)
  const notificationList = notifications || [];

  // ✅ تحديد ما إذا كان المحتوى الرئيسي يظهر (فقط عند الاشتراك النشط)
  const showContent = hasActiveSubscription;

  return (
    <div className="min-h-full bg-[#f7fafa] p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#001f24]">لوحة التحكم</h1>
            <p className="text-sm text-gray-500 mt-0.5">مرحباً بك، {currentUser.name}</p>
            {!hasActiveSubscription && (
              <div className="mt-1 text-xs text-amber-600 bg-amber-100 px-3 py-1 rounded-full inline-flex items-center gap-1">
                <CreditCard className="h-3 w-3" />
                ⚠️ يرجى دفع الاشتراك للوصول إلى جميع الخدمات
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 bg-white rounded-xl border border-[#c0c8c9] hover:border-[#1a7a8a] transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
              {stats.unread > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">
                  {stats.unread}
                </span>
              )}
            </button>
            <div className="w-10 h-10 rounded-xl bg-[#e0f5f7] flex items-center justify-center cursor-pointer">
              <span className="font-bold text-[#1a7a8a]">
                {currentUser.name?.charAt(0)?.toUpperCase() || "S"}
              </span>
            </div>
          </div>
        </div>

        {!showContent ? (
          <Card className="p-12 text-center border-2 border-dashed border-amber-300 bg-amber-50/50">
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center">
                <CreditCard className="h-10 w-10 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-amber-700">⚠️ يرجى دفع الاشتراك</h2>
                <p className="text-gray-500 mt-2 max-w-md">
                  لتتمكن من الوصول إلى جميع خدمات المنصة، يرجى دفع الاشتراك أولاً.
                </p>
              </div>
              <div className="w-full max-w-md bg-blue-50 border border-blue-200 rounded-xl p-4 mt-2">
                <p className="text-sm font-semibold text-blue-800 mb-3 flex items-center gap-2">
                  <span className="text-lg">💳</span>
                 معلومات الدفع
                </p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center border-b border-blue-100 pb-2">
                    <span className="text-gray-600">📱 رقم الهاتف:</span>
                    <span className="font-mono font-bold text-blue-700 text-lg">01555743737</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-gray-600">💳 رقم المحفظة:</span>
                    <span className="font-mono font-bold text-blue-700 text-lg">01170557555</span>
                  </div>
                  <div className="mt-2 text-xs text-gray-400 text-center border-t border-blue-100 pt-2">
                    ⚠️ يرجى إرسال المبلغ على أحد الأرقام أعلاه ثم رفع إيصال الدفع
                  </div>
                </div>
              </div>
              <Link href={`/subscription?userId=${currentUser._id}&gradeId=${currentUser.gradeId || ''}&role=student`}>
                <Button className="mt-4 bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 text-lg">
                  <CreditCard className="h-5 w-5 ml-2" />
                  دفع الاشتراك الآن
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-[#1a7a8a]">{stats.groups}</p>
                  <p className="text-xs text-gray-500">مجموعات</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-blue-600">{stats.assignments}</p>
                  <p className="text-xs text-gray-500">واجبات</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-purple-600">{stats.exams}</p>
                  <p className="text-xs text-gray-500">امتحانات</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3 text-center">
                  <p className="text-xl font-bold text-green-600">{stats.live}</p>
                  <p className="text-xs text-gray-500">حصص مباشرة</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - 2/3 */}
              <div className="lg:col-span-2 space-y-6">
                {/* My Groups */}
                <div>
                  <h2 className="text-lg font-semibold text-[#001f24] mb-4 flex items-center gap-2">
                    <Users className="h-5 w-5 text-[#1a7a8a]" />
                    مجموعاتي الدراسية
                  </h2>

                  {!studentGroups || studentGroups.length === 0 ? (
                    <Card className="p-8 text-center">
                      <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500">لم تسجل في أي مجموعة بعد</p>
                      <Link href="/student/groups">
                        <Button className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white">
                          تصفح المجموعات
                        </Button>
                      </Link>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {studentGroups.map((group: any) => {
                        const holidays = group.schedule?.holidays || [];

                        return (
                          <Card key={group._id} className="border border-[#c0c8c9] hover:border-[#1a7a8a] transition-all">
                            <CardHeader className="pb-2">
                              <div className="flex justify-between items-start">
                                <div>
                                  <CardTitle className="text-base">{group.name}</CardTitle>
                                  <p className="text-xs text-gray-500">{group.subject}</p>
                                </div>
                                <Badge className="bg-green-100 text-green-700">نشط</Badge>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Users className="h-4 w-4 text-[#1a7a8a]" />
                                  <span>{group.students?.length || 0} طالب</span>
                                </div>
                                {group.supervisorName && (
                                  <div className="flex items-center gap-2 text-gray-600">
                                    <FaChalkboardTeacher className="h-4 w-4 text-[#1a7a8a]" />
                                    <span>المعلم: {group.supervisorName}</span>
                                  </div>
                                )}
                                <div className="text-gray-500 text-xs">{group.gradeName}</div>

                                {/* الإجازات */}
                                {holidays.length > 0 && (
                                  <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                                    <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                                      <Ban className="h-3 w-3" />
                                      الإجازات القادمة:
                                    </p>
                                    <div className="space-y-1 mt-1">
                                      {holidays.map((holiday: any, idx: number) => (
                                        <p key={idx} className="text-xs text-amber-600">
                                          {new Date(holiday.date).toLocaleDateString('ar-EG')} - {holiday.reason}
                                        </p>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* الحصص المباشرة للمجموعة */}
                                {group.liveClasses && group.liveClasses.length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-gray-200">
                                    <p className="text-xs font-medium text-[#1a7a8a] flex items-center gap-1 mb-2">
                                      <Video className="h-3 w-3" />
                                      الحصص المباشرة:
                                      <Badge className="bg-[#1a7a8a] text-white text-[10px]">
                                        {group.liveClasses.filter((lc: any) => lc.status === "live" || lc.status === "scheduled").length}
                                      </Badge>
                                    </p>
                                    <div className="space-y-2">
                                      {group.liveClasses
                                        .filter((lc: any) => lc.status === "live" || lc.status === "scheduled")
                                        .map((lc: any) => {
                                          const isLive = lc.status === "live";
                                          const isJoining = joiningClassId === lc._id;
                                          
                                          return (
                                            <div key={lc._id} className="flex items-center justify-between p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                                              <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-[#001f24] truncate">{lc.title}</p>
                                                <p className="text-[10px] text-gray-500">
                                                  {new Date(lc.startTime).toLocaleString('ar-EG', {
                                                    day: 'numeric',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                  })}
                                                  {lc.status === "live" && (
                                                    <span className="text-green-600 font-medium mr-2">• مباشر الآن 🔴</span>
                                                  )}
                                                </p>
                                              </div>
                                              <Button
                                                size="sm"
                                                onClick={() => {
                                                  handleJoinClass(lc._id);
                                                  setTimeout(() => {
                                                    window.open(lc.link, "_blank");
                                                  }, 500);
                                                }}
                                                disabled={isJoining}
                                                className={`gap-2 ${isLive ? "bg-green-600 hover:bg-green-700" : "bg-[#1a7a8a] hover:bg-[#15707e]"}`}
                                              >
                                                {isJoining ? (
                                                  <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                  <PlayCircle className="h-4 w-4" />
                                                )}
                                                {isLive ? "انضم الآن" : "عرض"}
                                              </Button>
                                            </div>
                                          );
                                        })}
                                    </div>
                                  </div>
                                )}

                                {/* زر عرض الجدول */}
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="w-full mt-2 gap-2"
                                  onClick={() => setShowSchedule(showSchedule === group._id ? null : group._id)}
                                >
                                  <Calendar className="h-4 w-4" />
                                  {showSchedule === group._id ? "إخفاء الجدول" : "عرض الجدول"}
                                  {showSchedule === group._id ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </Button>

                                {/* عرض الجدول */}
                                {showSchedule === group._id && renderScheduleTable()}
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - 1/3 */}
              <div className="space-y-6">
                {/* Upcoming Events */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#1a7a8a]" />
                        الأحداث القادمة
                      </CardTitle>
                      <Badge className="bg-[#1a7a8a] text-white">{stats.total}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="all" className="w-full" onValueChange={(value) => setActiveEventTab(value as any)}>
                      <TabsList className="grid grid-cols-4 mb-4">
                        <TabsTrigger value="all">الكل</TabsTrigger>
                        <TabsTrigger value="assignments">واجبات</TabsTrigger>
                        <TabsTrigger value="exams">امتحانات</TabsTrigger>
                        <TabsTrigger value="live">مباشر</TabsTrigger>
                      </TabsList>

                      <TabsContent value="all" className="mt-0">
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {filteredEvents.length === 0 ? (
                            <div className="text-center py-6">
                              <Calendar className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                              <p className="text-sm text-gray-500">لا توجد أحداث قادمة</p>
                            </div>
                          ) : (
                            filteredEvents.map((event: any) => {
                              const Icon = event.icon;
                              const isLive = event.status === "live";
                              const isJoining = joiningClassId === event._id;
                              
                              return (
                                <div
                                  key={event._id || event.id}
                                  className={`p-3 rounded-lg border ${event.bgColor} ${event.borderColor}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full ${event.iconBg} flex items-center justify-center shrink-0`}>
                                      <Icon className={`h-4 w-4 ${event.textColor}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-medium text-[#001f24]">{event.title}</p>
                                        <Badge className={`text-[10px] ${event.bgColor} ${event.textColor} border-0`}>
                                          {event.label}
                                        </Badge>
                                        {event.status === "live" && (
                                          <Badge className="bg-red-500 text-white text-[10px] animate-pulse">
                                            🔴 مباشر
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {event.dateLabel}: {new Date(event.date).toLocaleDateString('ar-EG')}
                                      </p>
                                      {event.subject && <p className="text-xs text-gray-400">المادة: {event.subject}</p>}
                                      {event.groupName && <p className="text-xs text-gray-400">المجموعة: {event.groupName}</p>}
                                      {event.type === "live" && event.link && (
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            handleJoinClass(event._id);
                                            setTimeout(() => {
                                              window.open(event.link, "_blank");
                                            }, 500);
                                          }}
                                          disabled={isJoining}
                                          className={`mt-2 ${isLive ? "bg-green-600 hover:bg-green-700" : "bg-[#1a7a8a] hover:bg-[#15707e]"}`}
                                        >
                                          {isJoining ? (
                                            <Loader2 className="h-3 w-3 animate-spin ml-1" />
                                          ) : (
                                            <PlayCircle className="h-3 w-3 ml-1" />
                                          )}
                                          {isLive ? "انضم الآن" : "عرض الحصة"}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="assignments" className="mt-0">
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {filteredEvents.length === 0 ? (
                            <div className="text-center py-6">
                              <FileCheck className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                              <p className="text-sm text-gray-500">لا توجد واجبات قادمة</p>
                            </div>
                          ) : (
                            filteredEvents.map((event: any) => {
                              const Icon = event.icon;
                              return (
                                <div
                                  key={event._id}
                                  className={`p-3 rounded-lg border ${event.bgColor} ${event.borderColor}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full ${event.iconBg} flex items-center justify-center shrink-0`}>
                                      <Icon className={`h-4 w-4 ${event.textColor}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-[#001f24]">{event.title}</p>
                                      <p className="text-xs text-gray-500">
                                        {event.dateLabel}: {new Date(event.date).toLocaleDateString('ar-EG')}
                                      </p>
                                      {event.subject && <p className="text-xs text-gray-400">المادة: {event.subject}</p>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="exams" className="mt-0">
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {filteredEvents.length === 0 ? (
                            <div className="text-center py-6">
                              <FileText className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                              <p className="text-sm text-gray-500">لا توجد امتحانات قادمة</p>
                            </div>
                          ) : (
                            filteredEvents.map((event: any) => {
                              const Icon = event.icon;
                              return (
                                <div
                                  key={event._id}
                                  className={`p-3 rounded-lg border ${event.bgColor} ${event.borderColor}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full ${event.iconBg} flex items-center justify-center shrink-0`}>
                                      <Icon className={`h-4 w-4 ${event.textColor}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-[#001f24]">{event.title}</p>
                                      <p className="text-xs text-gray-500">
                                        {event.dateLabel}: {new Date(event.date).toLocaleDateString('ar-EG')}
                                      </p>
                                      {event.subject && <p className="text-xs text-gray-400">المادة: {event.subject}</p>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </TabsContent>

                      <TabsContent value="live" className="mt-0">
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                          {filteredEvents.length === 0 ? (
                            <div className="text-center py-6">
                              <Video className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                              <p className="text-sm text-gray-500">لا توجد حصص مباشرة</p>
                            </div>
                          ) : (
                            filteredEvents.map((event: any) => {
                              const Icon = event.icon;
                              const isLive = event.status === "live";
                              const isJoining = joiningClassId === event._id;
                              
                              return (
                                <div
                                  key={event._id || event.id}
                                  className={`p-3 rounded-lg border ${isLive ? 'border-green-500 bg-green-50' : event.bgColor} ${event.borderColor}`}
                                >
                                  <div className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-full ${isLive ? 'bg-green-100' : event.iconBg} flex items-center justify-center shrink-0`}>
                                      <Icon className={`h-4 w-4 ${isLive ? 'text-green-600' : event.textColor}`} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <p className="text-sm font-medium text-[#001f24]">{event.title}</p>
                                        {isLive ? (
                                          <Badge className="bg-red-500 text-white text-[10px] animate-pulse">
                                            🔴 مباشر الآن
                                          </Badge>
                                        ) : (
                                          <Badge className={`text-[10px] ${event.bgColor} ${event.textColor} border-0`}>
                                            مجدولة
                                          </Badge>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-500">
                                        {event.dateLabel}: {new Date(event.date).toLocaleString('ar-EG')}
                                      </p>
                                      {event.groupName && <p className="text-xs text-gray-400">المجموعة: {event.groupName}</p>}
                                      {event.link && (
                                        <Button
                                          size="sm"
                                          onClick={() => {
                                            handleJoinClass(event._id);
                                            setTimeout(() => {
                                              window.open(event.link, "_blank");
                                            }, 500);
                                          }}
                                          disabled={isJoining}
                                          className={`mt-2 ${isLive ? "bg-green-600 hover:bg-green-700" : "bg-[#1a7a8a] hover:bg-[#15707e]"}`}
                                        >
                                          {isJoining ? (
                                            <Loader2 className="h-3 w-3 animate-spin ml-1" />
                                          ) : (
                                            <PlayCircle className="h-3 w-3 ml-1" />
                                          )}
                                          {isLive ? "انضم الآن" : "عرض الحصة"}
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>

                {/* Notifications */}
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Bell className="h-4 w-4 text-[#1a7a8a]" />
                        الإشعارات
                        {stats.unread > 0 && (
                          <Badge className="bg-red-500 text-white text-[10px]">
                            {stats.unread} جديد
                          </Badge>
                        )}
                      </CardTitle>
                      <Link href="/student/notifications">
                        <span className="text-xs text-[#1a7a8a] hover:underline cursor-pointer">عرض الكل</span>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-56 overflow-y-auto">
                    {notificationList.length === 0 ? (
                      <div className="text-center py-6">
                        <Bell className="h-8 w-8 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm text-gray-500">لا توجد إشعارات</p>
                      </div>
                    ) : (
                      notificationList.slice(0, 5).map((notification: any) => {
                        const Icon = getNotificationIcon(notification.type);
                        const colorClasses = getNotificationColor(notification.type);

                        return (
                          <div
                            key={notification._id}
                            className={`p-2.5 rounded-lg border transition-colors ${
                              notification.status === "read"
                                ? "bg-white border-gray-200"
                                : "bg-[#e0f5f7] border-[#1a7a8a]/20 shadow-sm"
                            }`}
                          >
                            <div className="flex items-start gap-2.5">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${colorClasses}`}>
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-[#001f24] flex items-center gap-1.5">
                                  {notification.title}
                                  {notification.status === "sent" && (
                                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full inline-block animate-pulse"></span>
                                  )}
                                  {notification.priority === "urgent" && (
                                    <Badge className="bg-red-500 text-white text-[8px] px-1 py-0">عاجل</Badge>
                                  )}
                                  {notification.priority === "high" && (
                                    <Badge className="bg-amber-500 text-white text-[8px] px-1 py-0">هام</Badge>
                                  )}
                                </p>
                                <p className="text-xs text-gray-500 truncate">{notification.message}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">
                                  {getTimeAgo(notification.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    {notificationList.length > 5 && (
                      <Link href="/student/notifications">
                        <p className="text-center text-xs text-[#1a7a8a] hover:underline py-1">
                          عرض {notificationList.length - 5} إشعارات أخرى
                        </p>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}