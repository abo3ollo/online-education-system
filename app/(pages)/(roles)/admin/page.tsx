"use client";

import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Users,
  BookOpen,
  GraduationCap,
  FileQuestion,
  MapPin,
  Handshake,
  TrendingUp,
  BarChart3,
  UserPlus,
  Library,
  Settings,
  Clock,
  Search,
  Bell,
  HelpCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  MessageSquare,
  Star,
  Award,
  Zap,
  Activity,
  PieChart,
  MoreVertical,
  ChevronRight,
  FolderOpen,
  Package,
  Loader2,
} from "lucide-react";
import { PiStudentBold, PiTreasureChestFill } from "react-icons/pi";
import { FaChalkboardTeacher, FaHandshake } from "react-icons/fa";
import { LuBaggageClaim } from "react-icons/lu";
import { IoMdTrendingUp } from "react-icons/io";
import { SiGoogleclassroom } from "react-icons/si";
import { IoChatbubbleOutline } from "react-icons/io5";
import { useMemo } from "react";

// ── Stats Card Component ─────────────────────────────────────────
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  up,
  iconBg,
  iconColor,
  isLoading,
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  up?: boolean;
  iconBg: string;
  iconColor: string;
  isLoading?: boolean;
}) {
  return (
    <div className="group bg-white rounded-2xl px-5 py-4 border border-gray-100 hover:border-[#1a7a8a]/20 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-start justify-between">
        <div
          className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </div>
        {trend && (
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1 ${
              up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
            }`}
          >
            {trend}
            {up ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
          </span>
        )}
      </div>
      <div className="mt-3">
        {isLoading ? (
          <div className="h-9 flex items-center">
            <Loader2 className="h-5 w-5 animate-spin text-[#1a7a8a]" />
          </div>
        ) : (
          <p className="text-2xl font-bold text-[#001f24]">{value}</p>
        )}
        <p className="text-sm text-gray-500 mt-0.5">{title}</p>
      </div>
    </div>
  );
}


export default function AdminDashboard() {
  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const pendingUsers = useQuery(api.user.admin.getPendingRegistrations);
  const studentsData = useQuery(api.user.students.getStudents,{});
  const teachersData = useQuery(api.user.teachers.getTeachers,{});
  const groupsData = useQuery(api.groups.groups.getGroups,{});

  const isLoading =
    studentsData === undefined ||
    teachersData === undefined ||
    groupsData === undefined;


    const stats = useMemo(() => {
    const students = studentsData || [];
    const teachers = teachersData || [];
    const groups = groupsData || [];

    // ✅ حساب الإحصائيات
    const totalStudents = students.length;
    const totalTeachers = teachers.length;
    const totalGroups = groups.length;

    // ✅ حساب النسبة المئوية للتغير (مثال: يمكنك تعديل المنطق حسب الحاجة)
    // هنا نفترض أن النسبة المئوية محسوبة من البيانات الفعلية أو يمكنك إضافة منطق خاص
    const studentGrowth = totalStudents > 0 ? "+12%" : "0%";
    const teacherGrowth = totalTeachers > 0 ? "+8%" : "0%";
    const groupGrowth = totalGroups > 0 ? "+15%" : "0%";

    return [
      {
        title: "الطلاب",
        value: totalStudents,
        icon: PiStudentBold,
        trend: studentGrowth,
        up: true,
        iconBg: "bg-blue-50",
        iconColor: "text-blue-500",
      },
      {
        title: "المعلمون",
        value: totalTeachers,
        icon: FaChalkboardTeacher,
        trend: teacherGrowth,
        up: true,
        iconBg: "bg-teal-50",
        iconColor: "text-teal-500",
      },
      {
        title: "المجموعات",
        value: totalGroups,
        icon: SiGoogleclassroom,
        trend: groupGrowth,
        up: true,
        iconBg: "bg-green-50",
        iconColor: "text-green-500",
      },
    ];
  }, [studentsData, teachersData, groupsData]);

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001f24]" />
      </div>
    );
  }

  

  const quickActionsGrid = [
    { title: "المعلمون", icon: FaChalkboardTeacher, href: "/admin/teachers", color: "emerald" },
    { title: "إضافة طالب", icon: PiStudentBold, href: "/admin/students", color: "teal" },
    { title: "اولياء الامور", icon: Users, href: "/admin/parents", color: "cyan" },
    { title: "خطط الصفوف", icon: BookOpen, href: "/admin/grades", color: "indigo" },
    { title: "معرض الوسائط", icon: Library, href: "/admin/media", color: "purple" },
    { title: "بنك الأسئلة", icon: FileQuestion, href: "/admin/questions", color: "amber" },
    { title: "انشاء واجب", icon: UserPlus, href: "/admin/assignments", color: "red" },
    { title: "إنشاء امتحان", icon: GraduationCap, href: "/admin/exams", color: "blue" },
    { title: "البورتفوليو", icon: FolderOpen, href: "/admin/landing", color: "violet" },
    { title: "chatBox", icon: IoChatbubbleOutline, href: "/admin/chatbox", color: "green" },
    { title: "الإشعارات", icon: Bell, href: "/admin/notifications", color: "pink" },
    { title: "المستودعات", icon: Package, href: "/admin/inventory", color: "slate" },
    { title: "الخزينة", icon: PiTreasureChestFill, href: "/admin/treasury", color: "gray" },
  ];
  const colorMap: Record<string, { bg: string, iconBg: string, from: string, to: string }> = {
    blue: { bg: "bg-blue-50", iconBg: "bg-blue-600", from: "from-blue-50", to: "to-blue-100/50" },
    purple: { bg: "bg-purple-50", iconBg: "bg-purple-600", from: "from-purple-50", to: "to-purple-100/50" },
    amber: { bg: "bg-amber-50", iconBg: "bg-amber-600", from: "from-amber-50", to: "to-amber-100/50" },
    green: { bg: "bg-green-50", iconBg: "bg-green-600", from: "from-green-50", to: "to-green-100/50" },
    red: { bg: "bg-red-50", iconBg: "bg-red-600", from: "from-red-50", to: "to-red-100/50" },
    teal: { bg: "bg-teal-50", iconBg: "bg-teal-600", from: "from-teal-50", to: "to-teal-100/50" },
    slate: { bg: "bg-slate-50", iconBg: "bg-slate-700", from: "from-slate-50", to: "to-slate-100/50" },
    indigo: { bg: "bg-indigo-50", iconBg: "bg-indigo-600", from: "from-indigo-50", to: "to-indigo-100/50" },
    pink: { bg: "bg-pink-50", iconBg: "bg-pink-600", from: "from-pink-50", to: "to-pink-100/50" },
    gray: { bg: "bg-gray-50", iconBg: "bg-gray-700", from: "from-gray-50", to: "to-gray-100/50" },
    cyan: { bg: "bg-cyan-50", iconBg: "bg-cyan-600", from: "from-cyan-50", to: "to-cyan-100/50" },
    emerald: { bg: "bg-emerald-50", iconBg: "bg-emerald-600", from: "from-emerald-50", to: "to-emerald-100/50" },
    violet: { bg: "bg-violet-50", iconBg: "bg-violet-600", from: "from-violet-50", to: "to-violet-100/50" },
  };

  const pendingCount = pendingUsers?.length ?? 0;

  return (
    <div className="min-h-screen bg-[#f8fafc]" dir="rtl">
      {/* الشريط العلوي */}
      <header className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-5 flex items-center justify-between sticky top-0 z-10 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">لوحة التحكم</h1>
            <p className="text-xs text-[#a3ced6]">مرحباً بعودتك، {currentUser.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {/* <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="بحث..."
              className="pr-9 pl-4 py-2 text-sm bg-white/10 backdrop-blur border border-white/20 rounded-xl w-56 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          </div> */}
          <button className="relative p-2 hover:bg-white/10 rounded-xl transition-all">
            <Bell className="h-5 w-5 text-white/80" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-sm font-semibold text-white border border-white/20">
            {currentUser.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </header>

      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* تنبيه الطلبات المعلقة */}
          {pendingCount > 0 && (
            <div className="flex items-center justify-between bg-linear-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-6 py-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {pendingCount} طلب {pendingCount === 1 ? "تسجيل" : "تسجيلات"} معلق
                  </p>
                  <p className="text-sm text-gray-500">مراجعة وقبول الحسابات الجديدة</p>
                </div>
              </div>
              <Link
                href="/admin/approvals"
                className="flex items-center gap-2 text-sm font-medium bg-[#001f24] text-white px-5 py-2.5 rounded-xl hover:bg-[#03363d] transition-all shadow-lg hover:shadow-xl"
              >
                مراجعة الآن
                <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}

        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {stats.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              trend={stat.trend}
              up={stat.up}
              iconBg={stat.iconBg}
              iconColor={stat.iconColor}
              isLoading={isLoading}
            />
          ))}
        </div>

        {/* قسم المخططات والنشاط */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[#001f24]">إجراءات سريعة</h3>
            <span className="text-xs text-gray-400">{quickActionsGrid.length} إجراء</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {quickActionsGrid.map((action) => {
              const Icon = action.icon;
              const colors = colorMap[action.color];
              return (
                <Link
                  key={action.title}
                  href={action.href}
                  className={`group flex flex-col items-center gap-2 p-4 rounded-xl bg-linear-to-br ${colors.from} ${colors.to} hover:${colors.from.replace('50', '100')} hover:${colors.to.replace('50', '200/50')} transition-all duration-300 hover:shadow-md hover:-translate-y-1`}
                >
                  <div className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">{action.title}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* القسم السفلي */}
        {/* القسم السفلي - 3 أعمدة */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* النشاط الأخير */}
          {/* <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[#001f24]">النشاط الأخير</h3>
                <p className="text-sm text-gray-500">أحدث إجراءات المستخدمين</p>
              </div>
              <button className="text-sm text-[#1a7a8a] hover:underline">عرض الكل</button>
            </div>
            <div className="space-y-4 max-h-80 overflow-y-auto">
              {recentActivities.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all">
                  <div className="w-10 h-10 rounded-full bg-linear-to-br from-[#1a7a8a] to-[#2d9cdb] flex items-center justify-center text-white font-semibold text-sm shrink-0">
                    {item.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.user} <span className="text-gray-500 font-normal">{item.action}</span>
                    </p>
                    <p className="text-xs text-gray-400 truncate">{item.course}</p>
                  </div>
                  <span className="text-xs text-gray-400 shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
          </div> */}

          {/* الأحداث القادمة */}
          {/* <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="h-5 w-5 text-[#1a7a8a]" />
              <h3 className="text-lg font-semibold text-[#001f24]">الأحداث القادمة</h3>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {upcomingEvents.map((event, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-all">
                  <div className={`w-2 h-12 rounded-full ${event.color}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                    <p className="text-xs text-gray-500">{event.time}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                </div>
              ))}

              
              <button className="w-full p-3 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:text-[#1a7a8a] hover:border-[#1a7a8a]/30 transition-all">
                + إضافة حدث جديد
              </button>
            </div>
          </div> */}

          {/* أفضل الدورات */}
          {/* <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm"> */}
            {/* <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5 text-[#1a7a8a]" />
              <h3 className="text-lg font-semibold text-[#001f24]">أفضل الدورات</h3>
            </div> */}
            {/* <div className="space-y-4 max-h-80 overflow-y-auto"> */}
              {/* {topCourses.map((course, idx) => (
                <div key={idx} className="group p-3 rounded-xl hover:bg-gray-50 transition-all">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-900 group-hover:text-[#1a7a8a] transition-colors">{course.name}</span>
                    <span className="text-gray-500">{course.students} طالب</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 group-hover:opacity-80"
                      style={{ width: `${course.progress}%`, backgroundColor: course.color }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>تقدم {course.progress}%</span>
                    <span>{course.progress >= 70 ? '🚀 ممتاز' : course.progress >= 50 ? '📈 جيد' : '📚 قيد التقدم'}</span>
                  </div>
                </div>
              ))} */}

              {/* عرض جميع الدورات */}
              {/* <Link
                href="/admin/courses"
                className="flex items-center justify-center gap-2 w-full p-2 text-sm text-[#1a7a8a] hover:bg-[#1a7a8a]/5 rounded-lg transition-all"
              >
                عرض جميع الدورات
                <ChevronRight className="h-4 w-4" />
              </Link> */}
            {/* </div> */}
          {/* </div> */}
        </div>

        {/* التذييل */}
        <div className="text-center text-xs text-gray-400 pt-4 border-t border-gray-100">
          © ٢٠٢٤ أكاديمية مارين. جميع الحقوق محفوظة.
        </div>
      </div>
    </div>
  );
}