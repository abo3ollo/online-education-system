// app/(pages)/(roles)/student/layout.tsx

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useClerk } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Circle,
  LogOut,
  Menu,
  X,
  BarChart3,
  Bell,
  User,
  Wallet,
  MessageSquare,
  Award,
  FileText,
  Megaphone,
  School,
  Home,
  CreditCard,
  Library,
} from "lucide-react";
import { Loader2 } from "lucide-react";
import { SiGoogleclassroom, SiWikibooks } from "react-icons/si";
import { BsFileCheck } from "react-icons/bs";
import { PiExam } from "react-icons/pi";
import { IoChatbubbleOutline } from "react-icons/io5";
import { FaStore } from "react-icons/fa";
import { IoIosCheckmarkCircleOutline } from "react-icons/io";
import { AiOutlineTransaction } from "react-icons/ai";
import { FaClipboardQuestion } from "react-icons/fa6";
import { HiAcademicCap } from "react-icons/hi";
import { TbLivePhoto } from "react-icons/tb";

export default function StudentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoaded, isSignedIn } = useAuth();
  const { signOut } = useClerk();
  const pathname = usePathname();
  const router = useRouter();

  const currentUser = useQuery(api.user.auth.getCurrentUser);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ✅ التحقق من حالة الاشتراك
  const subscriptionStatus = currentUser?.subscriptionStatus;
  const hasActiveSubscription = subscriptionStatus === "active";
  const hasPendingApproval = subscriptionStatus === "pending" || subscriptionStatus === "awaiting_approval";

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) { router.push("/"); return; }
    if (currentUser !== undefined && currentUser?.role !== "student") {
      router.push("/dashboard");
    }
  }, [isLoaded, isSignedIn, currentUser, router]);

  if (!isLoaded || currentUser === undefined || currentUser === null) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f7fafa]">
        <Loader2 className="h-10 w-10 animate-spin text-[#001f24]" />
      </div>
    );
  }

  if (currentUser.role !== "student") return null;

  // ✅ قائمة التنقل الكاملة (تظهر عند دفع الاشتراك)
  const allNavItems = [
    { label: "مجموعاتي", icon: SiGoogleclassroom, href: "/student/groups" },
    { label: "واجبائي", icon: FileText, href: "/student/my-assignments" },
    { label: "امتحاناتي", icon: PiExam, href: "/student/my-exams" },
    { label: "وسائطي", icon: Library, href: "/student/my-media" },
    { label: "حصص الاونلاين و الحضور", icon: TbLivePhoto , href: "/student/attendance" },
    { label: "Chatbox", icon: IoChatbubbleOutline, href: "/student/chatbox" },
    { label: "المشتريات", icon: FaStore, href: "/student/purchases" },
    { label: "القدرات", icon: IoIosCheckmarkCircleOutline, href: "/aptitude" },
    { label: "التحصيلي", icon: HiAcademicCap, href: "/academic" },
    { label: "كشف الحساب", icon: AiOutlineTransaction, href: "/student/transactions" },
  ];

  // ✅ أيقونة الاشتراك - مع تمرير userId و gradeId من currentUser
  const subscriptionNavItem = [
    {
      label: "الاشتراك",
      icon: CreditCard,
      href: `/subscription?userId=${currentUser._id}&gradeId=${currentUser.gradeId || ''}&role=student`,
      highlight: true
    },
    {
      label: "التحصيلي",
      icon: HiAcademicCap,
      href: `/academic`,
      highlight: false
    },
    {
      label: "القدرات",
      icon: IoIosCheckmarkCircleOutline,
      href: `/aptitude`,
      highlight: false
    },
  ];

  // ✅ تحديد الأيقونات التي تظهر
  const showFullSidebar = hasActiveSubscription;
  const navItems = showFullSidebar ? allNavItems : subscriptionNavItem;

  return (
    <div className="flex h-screen bg-[#f7fafa] font-sans" dir="rtl">
      {/* Sidebar */}
      <div
        className={`${sidebarOpen ? "w-64" : "w-20"
          } bg-[#001f24] text-white transition-all duration-300 flex flex-col shrink-0`}
      >
        {/* Logo */}
        <div className="p-5 flex items-center justify-between border-b border-[#03363d]">
          {sidebarOpen ? (
            <Link href="/student" className="text-xl font-semibold tracking-tight">
              LMS Student
            </Link>
          ) : (
            <Link href="/student" className="text-xl font-semibold">
              📚
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-[#03363d] rounded-lg transition-colors"
          >
            {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            const isHighlight = (item as any).highlight || false;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive
                  ? "bg-[#03363d] text-white"
                  : isHighlight
                    ? "bg-amber-600 hover:bg-amber-700 text-white animate-pulse"
                    : "text-[#a3ced6] hover:bg-[#03363d] hover:text-white"
                  }`}
              >
                <Icon size={19} className="shrink-0" />
                {sidebarOpen && (
                  <span className="text-sm font-medium">{item.label}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User + Home + Logout */}
        <div className="border-t border-[#03363d] p-4">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-xs text-[#a3ced6] tracking-widest uppercase font-mono">
                Logged in as
              </p>
              <p className="font-semibold text-sm mt-1 truncate">{currentUser.name}</p>
              <p className="text-xs text-[#759fa7] truncate">{currentUser.email}</p>
              {!showFullSidebar && (
                <div className="mt-2 text-xs text-amber-400 bg-amber-900/30 px-2 py-1 rounded-lg text-center">
                  ⚠️ يرجى دفع الاشتراك
                </div>
              )}
            </div>
          )}

          
          {/* <Link href="/">
            <button className="flex items-center gap-3 w-full bg-[#03363d] hover:bg-[#032a30] text-white py-2.5 px-3 rounded-lg transition-colors text-sm font-medium mb-2">
              <Home size={17} />
              {sidebarOpen && <span>الرئيسية</span>}
            </button>
          </Link> */}

          {/* ✅ زر Logout */}
          <button
            onClick={async () => {
              await signOut();
              router.push("/");
            }}
            className="flex items-center gap-3 w-full bg-red-600 hover:bg-red-700 text-white py-2.5 px-3 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={17} />
            {sidebarOpen && <span>تسجيل الخروج</span>}
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* ✅ رسالة تنبيه في أعلى الصفحة لو لم يدفع */}
        {!showFullSidebar && (
          <div className="bg-amber-500 text-white px-6 py-3 text-center font-medium">
            ⚠️ يرجى دفع الاشتراك للوصول إلى جميع خدمات المنصة
          </div>
        )}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}