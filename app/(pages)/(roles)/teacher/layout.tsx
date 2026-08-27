// app/(pages)/(roles)/teacher/layout.tsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, UserButton, SignOutButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  LayoutDashboard,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
  ChevronDown,
  GraduationCap,
  ClipboardList,
  Bell,
  Search,
  User,
  School,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  Home,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Input } from "@/components/ui/input";
import { IoChatbubbleOutline } from "react-icons/io5";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { HiAcademicCap } from "react-icons/hi";
import { TbLivePhoto } from "react-icons/tb";

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoaded, isSignedIn, userId, signOut } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // جلب بيانات المعلم
  const teacher = useQuery(api.user.auth.getCurrentUser);

  // التحقق من الصلاحية
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
      return;
    }
    if (isLoaded && isSignedIn && teacher && teacher.role !== "teacher" && teacher.role !== "admin") {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, teacher, router]);

  if (!isLoaded || !teacher) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#f7fafa]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001f24]"></div>
      </div>
    );
  }

  // قائمة الروابط
  const menuItems = [
    { label: "لوحة التحكم", icon: LayoutDashboard, href: "/teacher" },
    { label: "مجموعاتي", icon: FolderOpen, href: "/teacher/groups" },
    { label: "الامتحانات", icon: ClipboardList, href: "/teacher/exams" },
    { label: "الواجبات", icon: FileText, href: "/teacher/assignments" },
    { label: "القدرات", icon: IoIosCheckmarkCircleOutline, href: "/teacher/aptitude" },
    { label: "التحصيلي", icon: HiAcademicCap, href: "/teacher/academic" },

    { label: "المحاضرات المباشرة", icon: TbLivePhoto, href: "/teacher/live-classes" },
    { label: " Chatbox", icon: IoChatbubbleOutline, href: "/teacher/chatbox" },
  ];

  const isActive = (href: string) => {
    if (href === "/teacher") {
      return pathname === href;
    }
    return pathname?.startsWith(href);
  };

  // ✅ دالة تسجيل الخروج
  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  // ✅ دالة الذهاب للصفحة الرئيسية
  const handleGoHome = () => {
    router.push("/");
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Sidebar */}
      <aside
        className={`fixed right-0 top-0 z-40 h-screen bg-white border-l border-[#c0c8c9] transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        } ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-[#c0c8c9]">
          <div className="flex items-center gap-2">
            <School className="h-8 w-8 text-[#1a7a8a]" />
            {isSidebarOpen && (
              <span className="text-lg font-bold text-[#001f24]">
                نظام المعلم
              </span>
            )}
          </div>
        </div>

        {/* Teacher Info */}
        {isSidebarOpen && (
          <div className="p-4 border-b border-[#c0c8c9]">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[#e0f5f7] text-[#1a7a8a]">
                  {teacher.name?.charAt(0)?.toUpperCase() || "م"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#001f24] truncate">
                  {teacher.name}
                </p>
                <p className="text-xs text-gray-500">معلم</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-280px)]">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                  active
                    ? "bg-[#e0f5f7] text-[#1a7a8a]"
                    : "text-gray-600 hover:bg-[#f0f4f4] hover:text-[#001f24]"
                }`}
              >
                <Icon className={`h-5 w-5 ${active ? "text-[#1a7a8a]" : ""}`} />
                {isSidebarOpen && (
                  <span className={`text-sm font-medium ${active ? "text-[#1a7a8a]" : ""}`}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* ✅ Home + Logout Buttons - في أسفل الـ Sidebar */}
        <div className="absolute bottom-0 right-0 left-0 p-4 border-t border-[#c0c8c9] bg-white space-y-2">
          {/* زر Home */}
          {/* <button
            onClick={handleGoHome}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full text-[#001f24] hover:bg-[#f0f4f4] ${
              !isSidebarOpen && "justify-center"
            }`}
          >
            <Home className="h-5 w-5" />
            {isSidebarOpen && (
              <span className="text-sm font-medium">الرئيسية</span>
            )}
          </button> */}
          
          {/* زر Logout */}
          <button
            onClick={handleSignOut}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 w-full text-red-600 hover:bg-red-50 hover:text-red-700 ${
              !isSidebarOpen && "justify-center"
            }`}
          >
            <LogOut className="h-5 w-5" />
            {isSidebarOpen && (
              <span className="text-sm font-medium">تسجيل الخروج</span>
            )}
          </button>
        </div>

        {/* Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -left-3 top-1/2 -translate-y-1/2 bg-white border border-[#c0c8c9] rounded-full p-1.5 hover:bg-[#f0f4f4] transition-colors shadow-sm"
        >
          {isSidebarOpen ? (
            <ChevronRight className="h-4 w-4 text-gray-500" />
          ) : (
            <ChevronLeft className="h-4 w-4 text-gray-500" />
          )}
        </button>
      </aside>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "mr-64" : "mr-20"
        }`}
      >
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white border-b border-[#c0c8c9] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 hover:bg-[#f0f4f4] rounded-lg transition-colors"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>

              {/* Breadcrumb or Title */}
              <div className="hidden md:block">
                <h2 className="text-lg font-semibold text-[#001f24]">
                  {menuItems.find((item) => isActive(item.href))?.label || "لوحة التحكم"}
                </h2>
              </div>

              {/* Search */}
              {/* <div className="hidden lg:flex items-center relative">
                <Search className="absolute right-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="بحث..."
                  className="w-64 pr-10 py-1.5 text-sm border-[#c0c8c9] focus:ring-[#1a7a8a]"
                />
              </div> */}
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              {/* <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="relative p-2 hover:bg-[#f0f4f4] rounded-lg transition-colors">
                    <Bell className="h-5 w-5 text-gray-600" />
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                      3
                    </span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <DropdownMenuLabel>الإشعارات</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                    <p className="text-sm font-medium">واجب جديد</p>
                    <p className="text-xs text-gray-500">تم إضافة واجب جديد في مادة الرياضيات</p>
                    <span className="text-xs text-gray-400">منذ 5 دقائق</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                    <p className="text-sm font-medium">تسليم واجب</p>
                    <p className="text-xs text-gray-500">قام أحمد بتسليم الواجب المنزلي</p>
                    <span className="text-xs text-gray-400">منذ ساعة</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                    <p className="text-sm font-medium">تذكير</p>
                    <p className="text-xs text-gray-500">امتحان غداً في مادة العلوم</p>
                    <span className="text-xs text-gray-400">منذ 3 ساعات</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}

              {/* User Menu */}
              {/* <DropdownMenu>
                <DropdownMenuTrigger>
                  <div className="flex items-center gap-2 hover:bg-[#f0f4f4] rounded-lg px-2 py-1.5 transition-colors">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-[#e0f5f7] text-[#1a7a8a] text-sm">
                        {teacher.name?.charAt(0)?.toUpperCase() || "م"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden lg:inline text-sm text-[#001f24]">
                      {teacher.name}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500 hidden lg:block" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>حسابي</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>
                    <User className="h-4 w-4 ml-2" />
                    الملف الشخصي
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="h-4 w-4 ml-2" />
                    الإعدادات
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    className="text-red-600 cursor-pointer"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4 ml-2" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu> */}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}