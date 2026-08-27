// app/(pages)/(roles)/teacher/live-classes/[id]/page.tsx

"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowRight,
  Calendar,
  Clock,
  Users,
  Link2,
  Video,
  Copy,
  CheckCircle,
  XCircle,
  Play,
  Loader2,
  Eye,
  UserCheck,
  UserX,
  ExternalLink,
  Edit,
  Save,
  Trash2,
  Download,
  Share2,
  FileText,
  History,
  Smartphone,
  Monitor,
  Info,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { toast } from "sonner";

// أيقونات المنصات
const PlatformIcon = ({ platform }: { platform: string }) => {
  switch (platform) {
    case "zoom":
      return <span className="text-[#0B5CFF] font-bold text-sm bg-blue-50 px-2 py-1 rounded">Zoom</span>;
    case "google_meet":
      return <span className="text-[#1A73E8] font-bold text-sm bg-blue-50 px-2 py-1 rounded">Meet</span>;
    case "youtube":
      return <span className="text-[#FF0000] font-bold text-sm bg-red-50 px-2 py-1 rounded">YouTube</span>;
    case "teams":
      return <span className="text-[#6264A7] font-bold text-sm bg-purple-50 px-2 py-1 rounded">Teams</span>;
    default:
      return <span className="text-gray-500 text-sm bg-gray-100 px-2 py-1 rounded">أخرى</span>;
  }
};

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "scheduled":
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200 text-sm px-3 py-1">مجدولة</Badge>;
    case "live":
      return <Badge className="bg-green-100 text-green-700 border-green-200 text-sm px-3 py-1 animate-pulse">مباشرة الآن</Badge>;
    case "ended":
      return <Badge className="bg-gray-100 text-gray-600 border-gray-200 text-sm px-3 py-1">انتهت</Badge>;
    case "cancelled":
      return <Badge className="bg-red-100 text-red-700 border-red-200 text-sm px-3 py-1">ملغاة</Badge>;
    default:
      return <Badge className="text-sm px-3 py-1">{status}</Badge>;
  }
};

export default function LiveClassDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const liveClassId = params.id as string;

  const [isRecordingDialogOpen, setIsRecordingDialogOpen] = useState(false);
  const [recordingLink, setRecordingLink] = useState("");
  const [isUpdatingRecording, setIsUpdatingRecording] = useState(false);
  const [copied, setCopied] = useState(false);

  // ✅ جلب بيانات الحصة
  const liveClass = useQuery(
    api.liveClasses.liveClasses.getLiveClassById,
    liveClassId ? { liveClassId: liveClassId as any } : "skip"
  );

  // ✅ جلب الحضور
  const attendance = useQuery(
    api.liveClasses.liveClasses.getLiveClassAttendance,
    liveClassId ? { liveClassId: liveClassId as any } : "skip"
  );

  const confirmAttendance = useMutation(api.liveClasses.liveClasses.confirmStudentAttendance);

  // ✅ جلب المستخدم الحالي
  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // ✅ Mutations
  const updateStatus = useMutation(api.liveClasses.liveClasses.updateLiveClassStatus);
  const updateRecording = useMutation(api.liveClasses.liveClasses.updateRecordingLink);
  const deleteLiveClass = useMutation(api.liveClasses.liveClasses.deleteLiveClass);

  useEffect(() => {
    if (liveClass?.recordingLink) {
      setRecordingLink(liveClass.recordingLink);
    }
  }, [liveClass]);

  if (!currentUser || liveClass === undefined || attendance === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  if (!liveClass) {
    return (
      <div className="min-h-screen bg-[#f7fafa] flex items-center justify-center">
        <Card className="p-12 text-center max-w-md">
          <Video className="h-16 w-16 mx-auto text-gray-300 mb-4" />
          <h2 className="text-xl font-bold text-gray-700">الحصة غير موجودة</h2>
          <p className="text-gray-500 text-sm mt-2">لم يتم العثور على هذه الحصة</p>
          <Link href="/teacher/live-classes">
            <Button className="mt-4">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للقائمة
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isTeacher = currentUser._id === liveClass.teacherId;
  const isLive = liveClass.status === "live";
  const isScheduled = liveClass.status === "scheduled";
  const isEnded = liveClass.status === "ended";
  const isCancelled = liveClass.status === "cancelled";

  // ✅ دوال الإجراءات
  const handleStartClass = async () => {
    try {
      await updateStatus({ liveClassId: liveClassId as any, status: "live" });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء بدء الحصة");
    }
  };

  const handleEndClass = async () => {
    if (!confirm("هل أنت متأكد من إنهاء الحصة؟")) return;
    try {
      await updateStatus({ liveClassId: liveClassId as any, status: "ended" });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء إنهاء الحصة");
    }
  };

  const handleCancelClass = async () => {
    if (!confirm("هل أنت متأكد من إلغاء الحصة؟")) return;
    try {
      await updateStatus({ liveClassId: liveClassId as any, status: "cancelled" });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء إلغاء الحصة");
    }
  };

  const handleSaveRecording = async () => {
    if (!recordingLink.trim()) {
      alert("يرجى إدخال رابط التسجيل");
      return;
    }
    setIsUpdatingRecording(true);
    try {
      await updateRecording({
        liveClassId: liveClassId as any,
        recordingLink: recordingLink.trim(),
      });
      setIsRecordingDialogOpen(false);
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء حفظ رابط التسجيل");
    } finally {
      setIsUpdatingRecording(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذه الحصة؟")) return;
    try {
      await deleteLiveClass({ liveClassId: liveClassId as any });
      router.push("/teacher/live-classes");
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء حذف الحصة");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // ✅ دالة تأكيد حضور الطالب
const handleConfirmAttendance = async (studentId: string, status: "approved" | "rejected") => {
  try {
    await confirmAttendance({
      liveClassId: liveClassId as any,
      studentId: studentId as any,
      status: status,
    });
    toast.success(status === "approved" ? "✅ تم تأكيد حضور الطالب" : "❌ تم رفض حضور الطالب");
  } catch (error: any) {
    toast.error(error.message || "حدث خطأ أثناء تأكيد الحضور");
  }
};

  // ✅ حساب مدة الحصة
  const duration = Math.round((liveClass.endTime - liveClass.startTime) / 60000);

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/teacher/live-classes" className="text-sm text-[#1a7a8a] hover:underline flex items-center gap-1">
              <ArrowRight className="h-4 w-4" />
              العودة للحصص المباشرة
            </Link>
            <h1 className="text-2xl font-bold text-[#001f24] mt-2 flex items-center gap-3">
              {liveClass.title}
              {isLive && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                </span>
              )}
            </h1>
          </div>
          <StatusBadge status={liveClass.status} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2/3 */}
          <div className="lg:col-span-2 space-y-6">
            {/* معلومات الحصة */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-[#1a7a8a]" />
                  معلومات الحصة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {liveClass.description && (
                  <div>
                    <p className="text-sm text-gray-500">الوصف</p>
                    <p className="text-gray-700">{liveClass.description}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">المجموعة</p>
                    <p className="font-medium text-[#001f24]">{liveClass.groupName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">المنصة</p>
                    <PlatformIcon platform={liveClass.platform} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">المعلم</p>
                    <p className="font-medium text-[#001f24]">{liveClass.teacherName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">المدة</p>
                    <p className="font-medium text-[#001f24]">{duration} دقيقة</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      التاريخ
                    </p>
                    <p className="font-medium text-[#001f24]">
                      {format(new Date(liveClass.startTime), "dd MMMM yyyy", { locale: ar })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-4 w-4 text-gray-400" />
                      الوقت
                    </p>
                    <p className="font-medium text-[#001f24]">
                      {format(new Date(liveClass.startTime), "HH:mm", { locale: ar })} - {format(new Date(liveClass.endTime), "HH:mm", { locale: ar })}
                    </p>
                  </div>
                </div>

                {/* رابط الحصة */}
                <div className="bg-[#f7fafa] rounded-lg p-4 border border-[#c0c8c9]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-[#1a7a8a]" />
                      <span className="text-sm font-medium">رابط الحصة</span>
                    </div>
                    {(isLive || isScheduled) && (
                      <a
                        href={liveClass.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#1a7a8a] hover:underline flex items-center gap-1"
                      >
                        فتح الرابط
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs text-gray-600 bg-white px-3 py-1 rounded border border-gray-200 flex-1 truncate">
                      {liveClass.link}
                    </code>
                    <button
                      onClick={() => copyToClipboard(liveClass.link)}
                      className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"
                      title="نسخ الرابط"
                    >
                      {copied ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  </div>
                  {liveClass.meetingId && (
                    <p className="text-xs text-gray-500 mt-2">معرف الاجتماع: {liveClass.meetingId}</p>
                  )}
                  {liveClass.password && (
                    <p className="text-xs text-gray-500">كلمة المرور: {liveClass.password}</p>
                  )}
                </div>

                {/* رابط التسجيل */}
                {liveClass.recordingLink && (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-700">تسجيل الحصة</span>
                      </div>
                      <a
                        href={liveClass.recordingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                      >
                        مشاهدة التسجيل
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 truncate">{liveClass.recordingLink}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* الحضور */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-[#1a7a8a]" />
                  الحضور
                  <Badge className="bg-[#1a7a8a] text-white">
                    {attendance?.length || 0} طالب
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {attendance?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <UserX className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p>لم يسجل أي طالب حضوره بعد</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto">    
                    {attendance?.map((att: any) => (
                      <div
                        key={att.studentId}
                        className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                            <UserCheck className="h-4 w-4 text-[#1a7a8a]" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#001f24]">
                              {att.studentName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {format(new Date(att.joinedAt), "HH:mm", { locale: ar })}
                              {att.duration && (
                                <>
                                  {" • "}
                                  <span className="text-green-600">{att.duration} دقيقة</span>
                                </>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* ✅ عرض حالة التأكيد */}
                          <Badge className={att.statusColor}>
                            {att.statusLabel}
                          </Badge>

                          {/* ✅ أزرار التأكيد (تظهر فقط إذا كانت الحصة منتهية و الحالة pending) */}
                          {liveClass.status === "ended" && att.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                onClick={() => handleConfirmAttendance(att.studentId, "approved")}
                              >
                                <CheckCircle className="h-3 w-3 ml-1" />
                                تأكيد
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleConfirmAttendance(att.studentId, "rejected")}
                              >
                                <XCircle className="h-3 w-3 ml-1" />
                                رفض
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - 1/3 */}
          <div className="space-y-6">
            {/* إجراءات المعلم */}
            {isTeacher && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Play className="h-4 w-4 text-[#1a7a8a]" />
                    الإجراءات
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isScheduled && (
                    <>
                      <Button
                        onClick={handleStartClass}
                        className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
                      >
                        <Play className="h-4 w-4" />
                        بدء الحصة الآن
                      </Button>
                      <Button
                        onClick={handleCancelClass}
                        variant="outline"
                        className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2"
                      >
                        <XCircle className="h-4 w-4" />
                        إلغاء الحصة
                      </Button>
                    </>
                  )}

                  {isLive && (
                    <Button
                      onClick={handleEndClass}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      إنهاء الحصة
                    </Button>
                  )}

                  {isEnded && !liveClass.recordingLink && (
                    <Button
                      onClick={() => setIsRecordingDialogOpen(true)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white gap-2"
                    >
                      <Video className="h-4 w-4" />
                      إضافة رابط التسجيل
                    </Button>
                  )}

                  {/* {(isScheduled || isEnded) && (
                    // <Button
                    //   onClick={handleDelete}
                    //   variant="outline"
                    //   className="w-full text-red-600 border-red-200 hover:bg-red-50 gap-2"
                    // >
                    //   <Trash2 className="h-4 w-4" />
                    //   حذف الحصة
                    // </Button>
                  )} */}

                  {isLive && (
                    <a
                      href={liveClass.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full"
                    >
                      <Button className="w-full bg-[#001f24] hover:bg-[#03363d] text-white gap-2">
                        <ExternalLink className="h-4 w-4" />
                        فتح رابط الحصة
                      </Button>
                    </a>
                  )}
                </CardContent>
              </Card>
            )}

            {/* إحصائيات سريعة */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-[#1a7a8a]" />
                  إحصائيات سريعة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#1a7a8a]" />
                    <span className="text-sm">الحضور</span>
                  </div>
                  <span className="font-bold text-[#001f24]">{attendance?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-[#1a7a8a]" />
                    <span className="text-sm">المدة</span>
                  </div>
                  <span className="font-bold text-[#001f24]">{duration} دقيقة</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-[#1a7a8a]" />
                    <span className="text-sm">الحالة</span>
                  </div>
                  <StatusBadge status={liveClass.status} />
                </div>
                {liveClass.maxStudents && (
                  <div className="flex items-center justify-between p-3 bg-[#f7fafa] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4 text-[#1a7a8a]" />
                      <span className="text-sm">الحد الأقصى</span>
                    </div>
                    <span className="font-bold text-[#001f24]">{liveClass.maxStudents}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* مشاركة */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="h-4 w-4 text-[#1a7a8a]" />
                  مشاركة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: liveClass.title,
                        text: `انضم للحصة المباشرة: ${liveClass.title}`,
                        url: liveClass.link,
                      });
                    } else {
                      copyToClipboard(liveClass.link);
                    }
                  }}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Share2 className="h-4 w-4" />
                  مشاركة رابط الحصة
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* ✅ Dialog إضافة رابط التسجيل */}
      <Dialog open={isRecordingDialogOpen} onOpenChange={setIsRecordingDialogOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#001f24] flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-600" />
              إضافة رابط التسجيل
            </DialogTitle>
            <p className="text-sm text-gray-500">
              أضف رابط تسجيل الحصة بعد انتهائها لمشاهدته لاحقاً
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recordingLink">رابط التسجيل</Label>
              <Input
                id="recordingLink"
                value={recordingLink}
                onChange={(e) => setRecordingLink(e.target.value)}
                placeholder="https://drive.google.com/..."
                className="dir-ltr"
              />
              <p className="text-xs text-gray-400">
                أدخل رابط من Google Drive, YouTube, أو أي منصة أخرى
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setIsRecordingDialogOpen(false)}
              disabled={isUpdatingRecording}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveRecording}
              disabled={isUpdatingRecording}
              className="bg-purple-600 hover:bg-purple-700 text-white gap-2"
            >
              {isUpdatingRecording ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  حفظ الرابط
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}