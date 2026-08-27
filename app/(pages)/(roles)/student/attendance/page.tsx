// app/(pages)/(roles)/student/attendance/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Users,
  Loader2,
  CheckCircle,
  XCircle,
  Video,
  ArrowRight,
  Search,
  Filter,
  Eye,
  PlayCircle,
  ExternalLink,
  Clock as ClockIcon,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "live":
      return <Badge className="bg-green-100 text-green-700 border-green-200 animate-pulse">مباشرة الآن</Badge>;
    case "scheduled":
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">مجدولة</Badge>;
    case "ended":
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200">انتهت</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

// ✅ دالة عرض حالة الحضور للطالب
const getAttendanceStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">⏳ قيد المراجعة</Badge>;
    case "approved":
      return <Badge className="bg-green-100 text-green-700 border-green-200">✅ حضرت</Badge>;
    case "rejected":
      return <Badge className="bg-red-100 text-red-600 border-red-200">❌ لم تحضر</Badge>;
    default:
      return <Badge className="bg-gray-100 text-gray-600">غير محدد</Badge>;
  }
};

export default function StudentAttendancePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [joiningClassId, setJoiningClassId] = useState<string | null>(null);

  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // ✅ جلب سجل الحضور
  const attendanceHistory = useQuery(
    api.liveClasses.liveClasses.getStudentAttendance,
    currentUser?._id ? { studentId: currentUser._id as any } : "skip"
  );

  // ✅ جلب الحصص القادمة
  const upcomingClasses = useQuery(
    api.liveClasses.liveClasses.getStudentLiveClasses,
    currentUser?._id ? { studentId: currentUser._id as any } : "skip"
  );

  // ✅ Mutation لتسجيل الحضور
  const joinLiveClass = useMutation(api.liveClasses.liveClasses.joinLiveClass);

  if (!currentUser || attendanceHistory === undefined || upcomingClasses === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ✅ دالة تسجيل الحضور عند الضغط على "انضم الآن"
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

  const stats = {
    total: attendanceHistory?.length || 0,
    upcoming: upcomingClasses?.length || 0,
    live: upcomingClasses?.filter((c: any) => c.status === "live").length || 0,
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#001f24] flex items-center gap-2">
            <Calendar className="h-6 w-6 text-[#1a7a8a]" />
            حضوري
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            سجل حضورك في الحصص المباشرة
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-[#1a7a8a]">{stats.total}</p>
              <p className="text-xs text-gray-500">إجمالي الحصص المحضورة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.upcoming}</p>
              <p className="text-xs text-gray-500">حصص قادمة</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-green-600 animate-pulse">{stats.live}</p>
              <p className="text-xs text-gray-500">مباشرة الآن</p>
            </CardContent>
          </Card>
        </div>

        {/* الحصص القادمة */}
        {upcomingClasses && upcomingClasses.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-[#001f24] mb-4 flex items-center gap-2">
              <Video className="h-5 w-5 text-[#1a7a8a]" />
              الحصص القادمة
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {upcomingClasses.slice(0, 4).map((cls: any) => {
                const isLive = cls.status === "live";
                const isJoining = joiningClassId === cls._id;
                
                return (
                  <Card key={cls._id} className={`border ${isLive ? "border-green-500 border-2" : "border-[#c0c8c9]"}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-[#001f24] truncate">{cls.title}</p>
                            <StatusBadge status={cls.status} />
                          </div>
                          <p className="text-sm text-gray-500">{cls.groupName}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(cls.startTime), "dd MMM yyyy", { locale: ar })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(cls.startTime), "HH:mm", { locale: ar })}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          {/* ✅ زر انضم الآن - يسجل الحضور ويفتح الرابط */}
                          <Button
                            size="sm"
                            onClick={() => {
                              handleJoinClass(cls._id);
                              setTimeout(() => {
                                window.open(cls.link, "_blank");
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
                          {/* ✅ رابط مباشر بدون تسجيل الحضور (اختياري) */}
                          <a
                            href={cls.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#1a7a8a] hover:underline text-center"
                          >
                            <ExternalLink className="h-3 w-3 inline ml-1" />
                            فتح الرابط مباشرة
                          </a>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* سجل الحضور */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[#001f24] flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-[#1a7a8a]" />
              سجل الحضور
              <Badge className="bg-[#1a7a8a] text-white">
                {attendanceHistory?.length || 0} حصة
              </Badge>
            </h2>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <div className="flex-1 min-w-48 relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="بحث عن حصة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pr-10 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
              />
            </div>
          </div>

          {/* Attendance List */}
          {attendanceHistory?.length === 0 ? (
            <Card className="p-12 text-center">
              <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-2" />
              <p className="text-gray-500">لا يوجد سجل حضور</p>
              <p className="text-sm text-gray-400">لم تحضر أي حصة مباشرة بعد</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {attendanceHistory?.map((item: any) => {
                // ✅ حساب وقت الانضمام
                const joinedTime = item.joinedAt ? format(new Date(item.joinedAt), "HH:mm", { locale: ar }) : "—";
                
                return (
                  <Card key={item._id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-[#001f24]">{item.title}</p>
                            <Badge className="bg-gray-100 text-gray-600 text-xs">{item.groupName}</Badge>
                            {/* ✅ عرض حالة الحضور مع اللون المناسب */}
                            {getAttendanceStatusBadge(item.attendanceStatus || "pending")}
                          </div>
                          <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {format(new Date(item.startTime), "dd MMM yyyy", { locale: ar })}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {format(new Date(item.startTime), "HH:mm", { locale: ar })}
                            </span>
                            {item.duration && (
                              <span className="flex items-center gap-1 text-green-600">
                                <ClockIcon className="h-3 w-3" />
                                {item.duration} دقيقة
                              </span>
                            )}
                            <span className="flex items-center gap-1 text-gray-400">
                              <PlayCircle className="h-3 w-3" />
                              انضم في {joinedTime}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.recordingLink && (
                            <a
                              href={item.recordingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                            >
                              <Video className="h-4 w-4" />
                              تسجيل
                            </a>
                          )}
                          {item.attendanceStatus === "pending" && (
                            <Badge className="bg-amber-100 text-amber-700 animate-pulse">
                              <Loader2 className="h-3 w-3 animate-spin ml-1" />
                              في انتظار التأكيد
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}