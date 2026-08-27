"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  Bell, Send, FileText, Search, Loader2,
  Users, GraduationCap, User, ChevronDown,
  Trash2, AlertCircle, CheckCircle, Radio,
  Building2, Info, UserCog,
  ArrowRight,
} from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type SendTo = "group" | "class" | "student" | "all_teachers" | "teacher" | "parent" | "all_users" | "specific_user";
type RecipientType = "group" | "grade" | "student" | "all_teachers" | "teacher" | "parent" | "all_users";
type NotifType = "teacher_message" | "exam_published" | "exam_reminder" | "new_assignment" | "system_announcement";
type Priority = "low" | "normal" | "high" | "urgent";

const TYPE_OPTIONS: { value: NotifType; label: string; color: string }[] = [
  { value: "teacher_message", label: "رسالة معلم", color: "text-blue-600" },
  { value: "exam_published", label: "نشر امتحان", color: "text-green-600" },
  { value: "exam_reminder", label: "تذكير امتحان", color: "text-amber-600" },
  { value: "new_assignment", label: "واجب جديد", color: "text-purple-600" },
  { value: "system_announcement", label: "إعلان النظام", color: "text-gray-600" },
];

const PRIORITY_OPTIONS: { value: Priority; label: string; badge: string }[] = [
  { value: "low", label: "منخفضة", badge: "bg-gray-100  text-gray-600" },
  { value: "normal", label: "عادية", badge: "bg-blue-100  text-blue-700" },
  { value: "high", label: "عالية", badge: "bg-amber-100 text-amber-700" },
  { value: "urgent", label: "عاجلة", badge: "bg-red-100   text-red-600" },
];

const QUICK_TEMPLATES = [
  { label: "تذكير امتحان", icon: Bell, type: "exam_reminder" as NotifType, priority: "high" as Priority, title: "تذكير بالامتحان", message: "نذكركم بوجود امتحان قريب. يرجى المراجعة والاستعداد الجيد." },
  { label: "واجب جديد", icon: FileText, type: "new_assignment" as NotifType, priority: "normal" as Priority, title: "واجب جديد", message: "تم إضافة واجب جديد. يرجى الاطلاع عليه والتسليم في الموعد." },
  { label: "إعلان هام", icon: Bell, type: "system_announcement" as NotifType, priority: "normal" as Priority, title: "إعلان هام", message: "" },
];

const SEND_TO_OPTIONS: { value: SendTo; label: string; icon: any }[] = [
  { value: "group", label: "مجموعة", icon: Users },
  { value: "class", label: "صف", icon: Building2 },
  { value: "student", label: "طالب", icon: User },
  { value: "teacher", label: "معلم", icon: GraduationCap },
  { value: "parent", label: "ولي أمر", icon: UserCog },
  { value: "all_teachers", label: "جميع المعلمين", icon: GraduationCap },
  { value: "all_users", label: "جميع المستخدمين", icon: Users },
  { value: "specific_user", label: "شخص محدد", icon: User },
];

function formatDate(ts?: number) {
  if (!ts) return "—";
  return format(new Date(ts), "dd MMM yyyy – HH:mm", { locale: ar });
}

function PriorityBadge({ priority }: { priority: string }) {
  const p = PRIORITY_OPTIONS.find((o) => o.value === priority);
  return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${p?.badge ?? "bg-gray-100 text-gray-600"}`}>{p?.label ?? priority}</span>;
}

function TypeBadge({ type }: { type: string }) {
  const t = TYPE_OPTIONS.find((o) => o.value === type);
  return <span className={`text-xs font-medium ${t?.color ?? "text-gray-600"}`}>{t?.label ?? type}</span>;
}

// ── Clean dropdown ────────────────────────────────────────────────
function Dropdown({
  value, onChange, options, placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 hover:border-[#1a7a8a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20"
      >
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        <span className={selected ? "text-gray-800" : "text-gray-400"}>
          {selected?.label ?? placeholder ?? "اختر..."}
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 overflow-hidden max-h-52 overflow-y-auto">
            {options.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => { onChange(opt.value); setOpen(false); }}
                className={`w-full text-right px-4 py-2.5 text-sm transition-colors ${value === opt.value
                  ? "bg-[#001f24] text-white"
                  : "text-gray-700 hover:bg-gray-50"
                  }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── All Users Dropdown ────────────────────────────────────────────────
function AllUsersDropdown({
  value, onChange, placeholder, users,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  users: any[];
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const selected = users.find((u) => u._id === value);

  const filteredUsers = users.filter((u) =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between bg-white border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-800 hover:border-[#1a7a8a] transition-colors focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20"
      >
        <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
        <span className={selected ? "text-gray-800" : "text-gray-400"}>
          {selected ? `${selected.name} (${selected.role})` : (placeholder ?? "اختر مستخدم...")}
        </span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg z-20 overflow-hidden max-h-72 overflow-y-auto">
            <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
              <input
                type="text"
                placeholder="بحث..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#1a7a8a]"
              />
            </div>
            {filteredUsers.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">لا توجد نتائج</div>
            ) : (
              filteredUsers.map((u) => (
                <button
                  key={u._id}
                  type="button"
                  onClick={() => { onChange(u._id); setOpen(false); setSearch(""); }}
                  className={`w-full text-right px-4 py-2.5 text-sm transition-colors flex items-center justify-between ${value === u._id
                    ? "bg-[#001f24] text-white"
                    : "text-gray-700 hover:bg-gray-50"
                    }`}
                >
                  <span className="text-xs text-gray-400">{u.role}</span>
                  <span>{u.name}</span>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
export default function AdminNotificationsPage() {
  const [sendTo, setSendTo] = useState<SendTo>("group");
  const [groupId, setGroupId] = useState("");
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [parentId, setParentId] = useState("");
  const [specificUserId, setSpecificUserId] = useState("");
  const [type, setType] = useState<NotifType>("exam_published");
  const [priority, setPriority] = useState<Priority>("urgent");
  const [title, setTitle] = useState("إعلان هام");
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const groups = useQuery(api.groups.groups.getGroups, {});
  const grades = useQuery(api.grades.grades.getActiveGrades, {});
  const students = useQuery(api.user.students.getStudents, {});
  const teachers = useQuery(api.user.teachers.getTeachers, {});
  const parents = useQuery(api.user.parents.getParents, {});
  const allUsers = useQuery(api.user.auth.getAllUsers, {});
  const notifications = useQuery(api.notifications.notifications.listNotifications, {});

  const sendNotification = useMutation(api.notifications.notifications.createNotification);

  const groupList = groups ?? [];
  const gradesList = grades ?? [];
  const studentList = students ?? [];
  const teacherList = teachers ?? [];
  const parentList = parents ?? [];
  const usersList = allUsers ?? [];
  const notifList = notifications ?? [];

  const selectedGroup = groupList.find((g: any) => g._id === groupId);
  const selectedUser = usersList.find((u: any) => u._id === specificUserId);

  // ✅ حساب عدد المستلمين
  const getRecipientCount = () => {
    if (sendTo === "group") return selectedGroup?.currentStudents ?? selectedGroup?.students?.length ?? 0;
    if (sendTo === "all_teachers") return teacherList.length;
    if (sendTo === "all_users") return usersList.length;
    if (sendTo === "specific_user") return 1;
    if (sendTo === "student") return 1;
    if (sendTo === "teacher") return 1;
    if (sendTo === "parent") return 1;
    return 1;
  };

  const recipientCount = getRecipientCount();

  const filtered = useMemo(() =>
    notifList.filter((n: any) =>
      !search ||
      n.title?.toLowerCase().includes(search.toLowerCase()) ||
      n.message?.toLowerCase().includes(search.toLowerCase())
    ), [notifList, search]);

  const applyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setType(tpl.type);
    setPriority(tpl.priority);
    setTitle(tpl.title);
    setMessage(tpl.message);
  };

  const getRecipientType = (sendToValue: SendTo): RecipientType => {
    if (sendToValue === "class") return "grade";
    if (sendToValue === "all_users") return "all_users";
    if (sendToValue === "specific_user") return "student"; // نعتبره طالب ولكن يمكن تعديله حسب الحاجة
    return sendToValue as RecipientType;
  };

  const getRecipientId = (): Id<"users"> | Id<"groups"> | Id<"grades"> | undefined => {
    if (sendTo === "group") return groupId as Id<"groups">;
    if (sendTo === "class") return classId as Id<"grades">;
    if (sendTo === "student") return studentId as Id<"users">;
    if (sendTo === "teacher") return teacherId as Id<"users">;
    if (sendTo === "parent") return parentId as Id<"users">;
    if (sendTo === "specific_user") return specificUserId as Id<"users">;
    return undefined;
  };

  const getSelectedGradeName = () => {
    if (!classId) return "اختر الصف";
    const grade = gradesList.find((g: any) => g._id === classId);
    if (!grade) return "اختر الصف";
    return grade.name || grade.nameEn || classId;
  };

  const getRecipientLabel = () => {
    if (sendTo === "group") return "مجموعة";
    if (sendTo === "class") return "صف";
    if (sendTo === "student") return "طالب";
    if (sendTo === "teacher") return "معلم";
    if (sendTo === "parent") return "ولي أمر";
    if (sendTo === "all_teachers") return "جميع المعلمين";
    if (sendTo === "all_users") return "جميع المستخدمين";
    if (sendTo === "specific_user") return "شخص محدد";
    return "";
  };

  const handleSend = async () => {
    setError(null);
    if (!title.trim()) return setError("يرجى إدخال العنوان");
    if (!message.trim()) return setError("يرجى إدخال الرسالة");
    if (sendTo === "group" && !groupId) return setError("يرجى اختيار المجموعة");
    if (sendTo === "class" && !classId) return setError("يرجى اختيار الصف");
    if (sendTo === "student" && !studentId) return setError("يرجى اختيار الطالب");
    if (sendTo === "teacher" && !teacherId) return setError("يرجى اختيار المعلم");
    if (sendTo === "parent" && !parentId) return setError("يرجى اختيار ولي الأمر");
    if (sendTo === "specific_user" && !specificUserId) return setError("يرجى اختيار المستخدم");

    setIsSending(true);
    try {
      await sendNotification({
        title: title.trim(),
        message: message.trim(),
        type,
        priority,
        recipientType: getRecipientType(sendTo),
        recipientId: getRecipientId(),
      });
      setSuccess(true);
      setTitle("");
      setMessage("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "حدث خطأ أثناء الإرسال");
    } finally {
      setIsSending(false);
    }
  };

  const recipientLabel = (n: any) => {
    if (n.recipientType === "group") return n.recipientName ?? "مجموعة";
    if (n.recipientType === "grade") return n.recipientName ?? "صف";
    if (n.recipientType === "student") return n.recipientName ?? "طالب";
    if (n.recipientType === "all_teachers") return "جميع المعلمين";
    if (n.recipientType === "all_users") return "جميع المستخدمين";
    if (n.recipientType === "teacher") return n.recipientName ?? "معلم";
    if (n.recipientType === "parent") return n.recipientName ?? "ولي أمر";
    return "—";
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8]" dir="rtl">
      {/* Header */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <Bell className="h-5 w-5" /> الإشعارات
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">إرسال وإدارة إشعارات الطلاب والمعلمين وأولياء الأمور</p>
          </div>
          <Link href="/admin/notifications">
            <Button className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-lg text-white">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للاشعارات
            </Button>
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="grid lg:grid-cols-5 gap-6">

          {/* ── Left: Compose ───────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
                <Send className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-semibold text-gray-700">إنشاء إشعار</span>
              </div>

              <div className="p-6 space-y-5">

                {/* Send To — icon buttons */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-3">إرسال إلى</label>
                  <div className="grid grid-cols-4 gap-2">
                    {SEND_TO_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const isActive = sendTo === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setSendTo(opt.value)}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl border-2 text-xs font-medium transition-all ${isActive
                            ? "border-[#001f24] bg-[#001f24] text-white"
                            : "border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-300 hover:bg-white"
                            }`}
                        >
                          <Icon className="h-5 w-5" />
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Recipient selector — full width */}
                {sendTo === "group" && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">اختر المجموعة</label>
                    <Dropdown
                      value={groupId}
                      onChange={setGroupId}
                      placeholder="اختر المجموعة"
                      options={groupList.map((g: any) => ({ value: g._id, label: g.name }))}
                    />
                    {groupId && (
                      <p className="flex items-center gap-1.5 text-xs text-[#1a7a8a] mt-2">
                        <Users className="h-3.5 w-3.5" />
                        {recipientCount} طالب في هذه المجموعة
                      </p>
                    )}
                  </div>
                )}

                {sendTo === "class" && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">اختر الصف</label>
                    <Dropdown
                      value={classId}
                      onChange={setClassId}
                      placeholder="اختر الصف"
                      options={gradesList.map((g: any) => ({ value: g._id, label: g.name || g.nameEn || g._id }))}
                    />
                    {classId && (
                      <p className="flex items-center gap-1.5 text-xs text-[#1a7a8a] mt-2">
                        <Building2 className="h-3.5 w-3.5" />
                        الصف المختار: {getSelectedGradeName()}
                      </p>
                    )}
                  </div>
                )}

                {sendTo === "student" && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">اختر الطالب</label>
                    <Dropdown
                      value={studentId}
                      onChange={setStudentId}
                      placeholder="اختر الطالب"
                      options={studentList.map((s: any) => ({ value: s._id, label: s.name }))}
                    />
                  </div>
                )}

                {sendTo === "teacher" && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">اختر المعلم</label>
                    <Dropdown
                      value={teacherId}
                      onChange={setTeacherId}
                      placeholder="اختر المعلم"
                      options={teacherList.map((t: any) => ({ value: t._id, label: t.name }))}
                    />
                  </div>
                )}

                {sendTo === "parent" && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">اختر ولي الأمر</label>
                    <Dropdown
                      value={parentId}
                      onChange={setParentId}
                      placeholder="اختر ولي الأمر"
                      options={parentList.map((p: any) => ({ value: p._id, label: p.name }))}
                    />
                  </div>
                )}

                {sendTo === "specific_user" && (
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-2">اختر المستخدم</label>
                    <AllUsersDropdown
                      value={specificUserId}
                      onChange={setSpecificUserId}
                      placeholder="اختر مستخدم..."
                      users={usersList}
                    />
                    {specificUserId && selectedUser && (
                      <p className="flex items-center gap-1.5 text-xs text-[#1a7a8a] mt-2">
                        <User className="h-3.5 w-3.5" />
                        {selectedUser.name} ({selectedUser.role})
                      </p>
                    )}
                  </div>
                )}

                {sendTo === "all_teachers" && (
                  <div className="bg-purple-50 border border-purple-100 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-purple-700">
                    <GraduationCap className="h-4 w-4 shrink-0" />
                    سيتم إرسال الإشعار لجميع المعلمين ({teacherList.length})
                  </div>
                )}

                {sendTo === "all_users" && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3 flex items-center gap-2 text-sm text-blue-700">
                    <Users className="h-4 w-4 shrink-0" />
                    سيتم إرسال الإشعار لجميع المستخدمين ({usersList.length})
                  </div>
                )}

                {/* Type */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">النوع</label>
                  <Dropdown
                    value={type}
                    onChange={(v) => setType(v as NotifType)}
                    options={TYPE_OPTIONS.map((t) => ({ value: t.value, label: t.label }))}
                  />
                </div>

                {/* Priority */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">الأولوية</label>
                  <Dropdown
                    value={priority}
                    onChange={(v) => setPriority(v as Priority)}
                    options={PRIORITY_OPTIONS.map((p) => ({ value: p.value, label: p.label }))}
                  />
                </div>

                {/* Title */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">العنوان</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="أدخل عنوان الإشعار"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] bg-gray-50 transition-colors"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 block mb-2">الرسالة</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="أدخل نص الرسالة"
                    rows={4}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm text-right resize-none focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]/20 focus:border-[#1a7a8a] bg-gray-50 transition-colors"
                  />
                </div>

                {/* Error / success */}
                {error && (
                  <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 px-4 py-3 rounded-2xl">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 px-4 py-3 rounded-2xl">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    تم إرسال الإشعار بنجاح
                  </div>
                )}

                {/* Send */}
                <button
                  onClick={handleSend}
                  disabled={isSending}
                  className="w-full flex items-center justify-center gap-2 bg-[#001f24] hover:bg-[#03363d] disabled:opacity-60 text-white font-semibold py-3.5 rounded-2xl transition-colors"
                >
                  {isSending
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Send className="h-4 w-4" />
                  }
                  إرسال الإشعار
                </button>
              </div>
            </div>
          </div>

          {/* ── Right: Preview + templates ───────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Live preview */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">معاينة</span>
                <span className="text-gray-400">👁</span>
              </div>
              <div className="p-5">
                <div className="bg-[#f7fafa] rounded-2xl p-4 min-h-27.5 space-y-2 border border-dashed border-gray-200">
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <PriorityBadge priority={priority} />
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_OPTIONS.find((t) => t.value === type)?.color ?? "text-gray-600"
                      } bg-gray-100`}>
                      {TYPE_OPTIONS.find((t) => t.value === type)?.label}
                    </span>
                  </div>
                  <p className="font-bold text-gray-900 text-sm text-right">
                    {title || <span className="text-gray-300 font-normal">عنوان الإشعار</span>}
                  </p>
                  <p className="text-xs text-gray-400 text-right leading-relaxed">
                    {message || <span>نص الرسالة</span>}
                  </p>
                </div>
                <div className="flex items-center justify-end gap-1.5 mt-2 text-xs text-gray-400">
                  <span>المستلمون: {recipientCount} {sendTo === "all_users" ? "مستخدم" : sendTo === "all_teachers" ? "معلم" : "شخص"}</span>
                  <Users className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>

            {/* Quick templates */}
            <div className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-700">قوالب سريعة</span>
                <FileText className="h-4 w-4 text-gray-400" />
              </div>
              <div className="divide-y divide-gray-50">
                {QUICK_TEMPLATES.map((tpl) => {
                  const Icon = tpl.icon;
                  return (
                    <button
                      key={tpl.label}
                      onClick={() => applyTemplate(tpl)}
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#f7fafa] transition-colors text-sm text-gray-700 font-medium"
                    >
                      {tpl.label}
                      <Icon className="h-4 w-4 text-gray-300" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tips */}
            <div className="bg-[#e8f4f8] rounded-3xl p-5 border border-[#c0dde8]">
              <div className="flex items-center gap-2 mb-3">
                <Info className="h-4 w-4 text-[#1a7a8a]" />
                <span className="text-sm font-semibold text-[#1a7a8a]">نصائح للإشعارات الفعالة</span>
              </div>
              <ul className="space-y-1.5 text-xs text-[#2a6a7a] list-disc list-inside">
                <li>استخدم عناوين واضحة ومختصرة</li>
                <li>حدد أولوية مناسبة للأهمية</li>
                <li>أضف رابطاً إذا كان هناك إجراء مطلوب</li>
              </ul>
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}