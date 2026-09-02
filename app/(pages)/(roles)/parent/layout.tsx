// app/(pages)/(roles)/parent/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, CreditCard, Bell, Settings, User, LogOut, BellCheck, Menu, X } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";

const navigation = [
  { name: "لوحة التحكم", href: "/parent", icon: LayoutDashboard },
  { name: "أبنائي", href: "/parent/children", icon: Users },
  { name: "المعاملات", href: "/parent/transactions", icon: CreditCard },
  { name: "ChatBox", href: "/parent/chatbox", icon: BellCheck },
  { name: "الإشعارات", href: "/parent/notifications", icon: Bell },
];

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const currentUser = useQuery(api.user.auth.getCurrentUser);

  // ✅ التحقق من حجم الشاشة
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  // ✅ إغلاق القائمة عند تغيير الصفحة
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* ✅ Sidebar - Desktop (كامل) */}
      <aside className={cn(
        "fixed top-0 right-0 h-full bg-white border-l border-gray-200 z-40 flex flex-col transition-all duration-300",
        // Desktop: عرض كامل
        !isMobile && "w-64",
        // Mobile: مضغوط (أيقونات فقط) أو مفتوح
        isMobile && "w-16",
        isMobile && isMobileMenuOpen && "w-64",
        isMobile && !isMobileMenuOpen && "w-16"
      )}>
        {/* Header - Logo */}
        <div className={cn(
          "p-4 shrink-0 flex items-center",
          isMobile && !isMobileMenuOpen ? "justify-center" : "justify-between"
        )}>
          <Link href="/parent" className={cn(
            "flex items-center gap-3",
            isMobile && !isMobileMenuOpen && "justify-center w-full"
          )}>
            <div className={cn(
              "bg-[#001f24] rounded-xl flex items-center justify-center shrink-0",
              isMobile && !isMobileMenuOpen ? "w-10 h-10" : "w-10 h-10"
            )}>
              <User className="h-5 w-5 text-white" />
            </div>
            <span className={cn(
              "text-xl font-bold text-[#001f24] transition-opacity duration-300",
              isMobile && !isMobileMenuOpen ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}>
              ولي الأمر
            </span>
          </Link>
          {/* ✅ زر إغلاق للموبايل (يظهر فقط عند فتح القائمة) */}
          {isMobile && isMobileMenuOpen && (
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="h-6 w-6 text-gray-600" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#e0f5f7] text-[#1a7a8a]"
                    : "text-gray-600 hover:bg-gray-100",
                  isMobile && !isMobileMenuOpen && "justify-center px-2"
                )}
                title={isMobile && !isMobileMenuOpen ? item.name : undefined}
              >
                <item.icon className={cn(
                  "shrink-0",
                  isMobile && !isMobileMenuOpen ? "h-6 w-6" : "h-5 w-5"
                )} />
                <span className={cn(
                  "transition-opacity duration-300 whitespace-nowrap",
                  isMobile && !isMobileMenuOpen ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer - Logout Button */}
        <div className={cn(
          "p-3 border-t border-gray-200 shrink-0",
          isMobile && !isMobileMenuOpen && "flex justify-center"
        )}>
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              "text-red-600 hover:bg-red-50 hover:text-red-700",
              isMobile && !isMobileMenuOpen && "justify-center"
            )}
            title={isMobile && !isMobileMenuOpen ? "تسجيل الخروج" : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span className={cn(
              "transition-opacity duration-300",
              isMobile && !isMobileMenuOpen ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            )}>
              تسجيل الخروج
            </span>
          </button>
          
          {/* ✅ معلومات المستخدم - تظهر فقط عند فتح القائمة */}
          {(!isMobile || isMobileMenuOpen) && (
            <div className="mt-3 px-4 py-2 rounded-xl bg-gray-50">
              <p className="text-xs text-gray-400">ولي الأمر</p>
              <p className="text-sm font-medium text-gray-700 truncate">
                {currentUser?.name || "..."}
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* ✅ Overlay للقائمة في الموبايل */}
      {isMobile && isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ✅ Main Content */}
      <main className={cn(
        "transition-all duration-300",
        isMobile ? "mr-16" : "mr-64"
      )}>
        {/* ✅ شريط علوي للموبايل مع زر القائمة */}
        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-gray-200 px-3 py-3 md:hidden flex items-center justify-between">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Menu className="h-6 w-6 text-gray-700" />
          </button>
          {/* <Link href="/parent" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#001f24] rounded-lg flex items-center justify-center">
              <User className="h-4 w-4 text-white" />
            </div>
            <span className="text-sm font-bold text-[#001f24]">ولي الأمر</span>
          </Link> */}
          <div className="w-10" /> {/* مسافة فارغة للتوازن */}
        </div>

        {/* ✅ المحتوى */}
        <div className="px-3 py-3 md:px-6 md:py-6">
          {children}
        </div>
      </main>
    </div>
  );
}