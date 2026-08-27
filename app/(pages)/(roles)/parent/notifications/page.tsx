// app/(pages)/(roles)/parent/notifications/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  Megaphone,
  Calendar,
  Users,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  X,
  Eye,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { IconBase } from "react-icons/lib";

// ── Helpers ───────────────────────────────────────────────────────
function formatDate(ts?: number) {
  if (!ts) return "—";
  return format(new Date(ts), "dd MMM yyyy - HH:mm", { locale: ar });
}

function getTimeAgo(timestamp: number) {
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
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "teacher_message":
      return <Users className="h-5 w-5" />;
    case "exam_published":
      return <FileText className="h-5 w-5" />;
    case "exam_reminder":
      return <Calendar className="h-5 w-5" />;
    case "new_assignment":
      return <BookOpen className="h-5 w-5" />;
    case "system_announcement":
      return <Megaphone className="h-5 w-5" />;
    default:
      return <Bell className="h-5 w-5" />;
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case "teacher_message":
      return "bg-blue-100 text-blue-600 border-blue-200";
    case "exam_published":
      return "bg-purple-100 text-purple-600 border-purple-200";
    case "exam_reminder":
      return "bg-amber-100 text-amber-600 border-amber-200";
    case "new_assignment":
      return "bg-green-100 text-green-600 border-green-200";
    case "system_announcement":
      return "bg-red-100 text-red-600 border-red-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
}

function getPriorityBadge(priority: string) {
  switch (priority) {
    case "urgent":
      return <Badge className="bg-red-500 text-white">عاجل</Badge>;
    case "high":
      return <Badge className="bg-amber-500 text-white">هام</Badge>;
    case "normal":
      return <Badge className="bg-blue-500 text-white">عادي</Badge>;
    case "low":
      return <Badge className="bg-gray-500 text-white">منخفض</Badge>;
    default:
      return null;
  }
}

// ── Main Page ────────────────────────────────────────────────────

export default function ParentNotificationsPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // ── Queries ───────────────────────────────────────────────────
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  const notifications = useQuery(
    api.notifications.notifications.getMyNotifications,
    currentUser?._id ? { unreadOnly: false } : "skip"
  );

  const unreadCount = useQuery(
    api.notifications.notifications.getUnreadCount,
    currentUser?._id ? {} : "skip"
  );

  // ── Mutations ─────────────────────────────────────────────────
  const updateNotificationStatus = useMutation(
    api.notifications.notifications.updateNotificationStatus
  );

  // ── Handlers ──────────────────────────────────────────────────
  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await updateNotificationStatus({
        notificationId: notificationId as any,
        status: "read",
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!notifications) return;
    try {
      for (const notif of notifications) {
        if (notif.status === "sent") {
          await updateNotificationStatus({
            notificationId: notif._id,
            status: "read",
          });
        }
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  const handleOpenDetails = (notification: any) => {
    setSelectedNotification(notification);
    setIsDetailsOpen(true);
    if (notification.status === "sent") {
      handleMarkAsRead(notification._id);
    }
  };

  // ── Filters ──────────────────────────────────────────────────
  const filteredNotifications = notifications?.filter((n: any) => {
    if (filterType === "all") return true;
    if (filterType === "unread") return n.status === "sent";
    if (filterType === "read") return n.status === "read";
    return true;
  });

  const unreadNotifications = notifications?.filter((n: any) => n.status === "sent") || [];

  // ── Loading ──────────────────────────────────────────────────
  if (currentUser === undefined || notifications === undefined || unreadCount === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (currentUser?.role !== "parent") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="text-gray-600">غير مصرح بالوصول</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/parent">
              <Button variant="ghost" size="sm" className="gap-2">
                <ChevronRight className="h-4 w-4" />
                رجوع
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Bell className="h-5 w-5 text-teal-600" />
                الإشعارات
              </h1>
              <p className="text-sm text-gray-500">
                {unreadCount > 0
                  ? `لديك ${unreadCount} إشعار${unreadCount > 1 ? 'ات' : ''} غير مقروء`
                  : "جميع الإشعارات مقروءة"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAllAsRead}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                تعليم الكل كمقروء
              </Button>
            )}
            <Badge className="bg-teal-600 text-white">
              {notifications.length} إشعار
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-6" onValueChange={setFilterType}>
          <TabsList className="grid grid-cols-3 max-w-md">
            <TabsTrigger value="all" className="flex items-center gap-2">
              الكل
              <Badge className="bg-gray-200 text-gray-700 text-[10px]">
                {notifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="unread" className="flex items-center gap-2">
              غير مقروء
              <Badge className="bg-red-500 text-white text-[10px]">
                {unreadNotifications.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="read">مقروء</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications?.length === 0 ? (
            <Card className="p-12 text-center">
              <Bell className="h-16 w-16 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 text-lg">
                {filterType === "unread"
                  ? "🎉 لا توجد إشعارات غير مقروءة"
                  : "لا توجد إشعارات"}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {filterType === "unread"
                  ? "جميع الإشعارات مقروءة"
                  : "ستظهر هنا الإشعارات الخاصة بك"}
              </p>
            </Card>
          ) : (
            filteredNotifications?.map((notification: any) => {
              const isUnread = notification.status === "sent";
              const Icon = getNotificationIcon(notification.type);
              const colorClasses = getNotificationColor(notification.type);

              return (
                <div
                  key={notification._id}
                  className={cn(
                    "bg-white rounded-xl border p-4 transition-all cursor-pointer hover:shadow-md",
                    isUnread
                      ? "border-teal-200 bg-teal-50/30"
                      : "border-gray-200 hover:border-gray-300",
                    "relative"
                  )}
                  onClick={() => handleOpenDetails(notification)}
                >
                  {isUnread && (
                    <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  )}

                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${colorClasses}`}
                    >
                     
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-semibold text-gray-900">
                            {notification.title}
                          </h3>
                          {getPriorityBadge(notification.priority)}
                          {isUnread && (
                            <Badge className="bg-teal-100 text-teal-700 text-[10px]">
                              جديد
                            </Badge>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {getTimeAgo(notification.createdAt)}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {notification.message}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                        <span>
                          {notification.type === "teacher_message"
                            ? "📨 من معلم"
                            : notification.type === "exam_published"
                            ? "📝 امتحان"
                            : notification.type === "exam_reminder"
                            ? "⏰ تذكير"
                            : notification.type === "new_assignment"
                            ? "📚 واجب"
                            : "📢 إعلان"}
                        </span>
                        {notification.recipientName && (
                          <>
                            <span>•</span>
                            <span>إلى: {notification.recipientName}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-gray-400 hover:text-gray-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenDetails(notification);
                      }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Notification Count */}
        {notifications.length > 0 && (
          <div className="mt-4 text-center text-xs text-gray-400">
            عرض {filteredNotifications?.length || 0} من {notifications.length} إشعار
          </div>
        )}
      </div>

      {/* ── Notification Details Modal ─────────────────────────── */}
      {selectedNotification && isDetailsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setIsDetailsOpen(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Header */}
            <div className="bg-linear-to-r from-[#001f24] to-[#03363d] px-6 py-4 flex items-center justify-between">
              <button
                onClick={() => setIsDetailsOpen(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Bell className="h-5 w-5" />
                تفاصيل الإشعار
              </h2>
              <div className="w-8" />
            </div>

            <div className="p-6 space-y-4">
              {/* Priority Badge */}
              <div className="flex items-center gap-2">
                {getPriorityBadge(selectedNotification.priority)}
                <span className="text-xs text-gray-400">
                  {formatDate(selectedNotification.createdAt)}
                </span>
              </div>

              {/* Title */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${getNotificationColor(
                    selectedNotification.type
                  )}`}
                >
                  {getNotificationIcon(selectedNotification.type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {selectedNotification.title}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {selectedNotification.type === "teacher_message"
                      ? "من معلم"
                      : selectedNotification.type === "exam_published"
                      ? "امتحان"
                      : selectedNotification.type === "exam_reminder"
                      ? "تذكير"
                      : selectedNotification.type === "new_assignment"
                      ? "واجب"
                      : "إعلان"}
                  </p>
                </div>
              </div>

              {/* Message */}
              <div className="bg-[#f7fafa] rounded-xl p-4 border border-gray-200">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selectedNotification.message}
                </p>
              </div>

              {/* Meta Info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-[#f7fafa] rounded-lg p-3">
                  <p className="text-xs text-gray-400">الحالة</p>
                  <p className="font-medium text-gray-800">
                    {selectedNotification.status === "sent"
                      ? "📩 غير مقروء"
                      : selectedNotification.status === "read"
                      ? "✅ مقروء"
                      : "📁 مؤرشف"}
                  </p>
                </div>
                <div className="bg-[#f7fafa] rounded-lg p-3">
                  <p className="text-xs text-gray-400">الأولوية</p>
                  <p className="font-medium text-gray-800 capitalize">
                    {selectedNotification.priority === "urgent"
                      ? "⚡ عاجل"
                      : selectedNotification.priority === "high"
                      ? "🔴 هام"
                      : selectedNotification.priority === "normal"
                      ? "🟡 عادي"
                      : "🟢 منخفض"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                {selectedNotification.status === "sent" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      handleMarkAsRead(selectedNotification._id);
                      setSelectedNotification({
                        ...selectedNotification,
                        status: "read",
                      });
                    }}
                    className="gap-2"
                  >
                    <CheckCheck className="h-4 w-4" />
                    تعليم كمقروء
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsDetailsOpen(false)}
                >
                  إغلاق
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}