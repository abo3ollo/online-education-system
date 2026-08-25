// app/(pages)/(roles)/parent/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, CreditCard, Bell, Settings, User, LogOut, BellCheck } from "lucide-react";
import { useClerk } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

const navigation = [
  { name: "لوحة التحكم", href: "/parent", icon: LayoutDashboard },
  { name: "أبنائي", href: "/parent/children", icon: Users },
  { name: "المعاملات", href: "/parent/transactions", icon: CreditCard },
  { name: "ChatBox", href: "/parent/chatbox", icon: BellCheck },

//   { name: "الإشعارات", href: "/parent/notifications", icon: Bell },
//   { name: "الإعدادات", href: "/parent/settings", icon: Settings },
];

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { signOut } = useClerk();
  const router = useRouter();

  const currentUser = useQuery(api.user.auth.getCurrentUser);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Sidebar */}
      <aside className="fixed top-0 right-0 h-full w-64 bg-white border-l border-gray-200 z-40 flex flex-col">
        {/* Header - Logo */}
        <div className="p-6 shrink-0">
          <Link href="/parent" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#001f24] rounded-xl flex items-center justify-center">
              <User className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-[#001f24]">ولي الأمر</span>
          </Link>
        </div>

        {/* Navigation - takes remaining space */}
        <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
                  isActive
                    ? "bg-[#e0f5f7] text-[#1a7a8a]"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* ✅ Footer - Logout Button */}
        <div className="p-4 border-t border-gray-200 shrink-0">
          <button
            onClick={handleLogout}
            className={cn(
              "flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              "text-red-600 hover:bg-red-50 hover:text-red-700"
            )}
          >
            <LogOut className="h-5 w-5" />
            تسجيل الخروج
          </button>
          {/* ✅ إضافة معلومات المستخدم */}
          <div className="mt-3 px-4 py-2 rounded-xl bg-gray-50">
            <p className="text-xs text-gray-400">ولي الأمر</p>
            <p className="text-sm font-medium text-gray-700 truncate"> {currentUser?.name || "..."}</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="mr-64">
        {children}
      </main>
    </div>
  );
}