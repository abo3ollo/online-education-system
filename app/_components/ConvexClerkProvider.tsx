// app/_components/ConvexClerkProvider.tsx

"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { useRouter, usePathname } from "next/navigation";
import { api } from "@/convex/_generated/api";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const ADMIN_WHITELIST = [
  "admin123@gmail.com",
  "admin@marineacademy.com",
  "your-email@gmail.com",
  "digitallandsystems2025@gmail.com",
  "abdalrahmanyehia333@gmail.com",
];

const PUBLIC_PAGES = ["/", "/trips", "/aptitude-landing", "/academic-landing"];
const AUTH_PAGES = ["/sign-in", "/sign-up", "/onboarding", "/pending-approval", "/account-rejected", "/subscription"];
const PLATFORM_PAGES = ["/student", "/teacher", "/parent", "/admin", "/aptitude", "/academic"];

function UserSync() {
  const { isLoaded: userLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  const [hasRedirected, setHasRedirected] = useState(false);

  const currentUser = useQuery(
    api.user.auth.getCurrentUser,
    isSignedIn ? {} : "skip"
  );

  // ✅ عند تغيير حالة تسجيل الدخول، نخزن في sessionStorage
  useEffect(() => {
    if (!userLoaded) return;

    if (isSignedIn) {
      sessionStorage.setItem("clerk_signed_in", "true");
    } else {
      sessionStorage.removeItem("clerk_signed_in");
      setHasRedirected(false);
    }
  }, [userLoaded, isSignedIn]);

  useEffect(() => {
    if (!userLoaded) return;
    if (currentUser === undefined) return;

    // ── غير مسجل دخول ─────────────────────────────────────────
    if (!isSignedIn) {
      if (PLATFORM_PAGES.some((p) => pathname?.startsWith(p))) {
        router.push("/");
      }
      return;
    }

    // ── مسجل دخول ولكن لا يوجد مستخدم في Convex ──────────────
    // ✅ هذا يحدث بعد تسجيل حساب جديد (Sign Up)
    if (currentUser === null) {
      console.log("⚠️ Signed in but no Convex user → redirect to onboarding");
      // ✅ إزالة sessionStorage عشان منكرر التوجيه
      sessionStorage.removeItem("clerk_signed_in");
      router.replace("/onboarding");
      return;
    }

    // ── مسجل دخول ومستخدم Convex موجود ───────────────────────
    const role = (currentUser as any).role as string;
    const status = (currentUser as any).status as string;
    const tracks = (currentUser as any).tracks as string[] || [];
    const email = (currentUser as any).email as string || "";

    // لو بالفعل على صفحة منصة → ماتحركش
    if (PLATFORM_PAGES.some((p) => pathname?.startsWith(p))) {
      return;
    }

    // لو pending → pending-approval
    if (status === "pending") {
      if (pathname !== "/pending-approval") {
        router.replace("/pending-approval");
      }
      return;
    }

    // لو rejected → account-rejected
    if (status === "rejected") {
      if (pathname !== "/account-rejected") {
        router.replace("/account-rejected");
      }
      return;
    }

    // ✅ التحقق من أن المستخدم مفعل
    if (status !== "active" && status !== "approved") {
      return;
    }

    // ✅ التحقق من أننا على صفحة Landing
    const isOnLanding = pathname === "/";
    const isOnAuthPage = AUTH_PAGES.some((p) => pathname === p || pathname?.startsWith(p));
    const justSignedIn = sessionStorage.getItem("clerk_signed_in") === "true";

    if (!isOnLanding && !isOnAuthPage) {
      return;
    }

    if (hasRedirected) {
      return;
    }

    if (!justSignedIn) {
      return;
    }

    // ✅ التوجيه النهائي
    setHasRedirected(true);
    sessionStorage.removeItem("clerk_signed_in");

    // ✅ أدمن في القائمة البيضاء
    if (role === "admin" && ADMIN_WHITELIST.includes(email.toLowerCase())) {
      router.replace("/admin");
      return;
    }

    // ✅ لو عنده مسار platform
    if (tracks.includes("platform")) {
      const routes: Record<string, string> = {
        student: "/student",
        teacher: "/teacher",
        parent: "/parent",
        admin: "/admin",
      };
      if (routes[role]) {
        router.replace(routes[role]);
        return;
      }
    }

    // ✅ aptitude
    if (tracks.includes("aptitude")) {
      router.replace("/aptitude");
      return;
    }

    // ✅ academic
    if (tracks.includes("academic")) {
      router.replace("/academic");
      return;
    }

    // ✅ مفيش مسارات → onboarding
    if (tracks.length === 0) {
      router.replace("/onboarding");
      return;
    }

  }, [userLoaded, isSignedIn, currentUser, pathname, router, hasRedirected]);

  return null;
}

function ConvexProviderWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <UserSync />
      {children}
    </ConvexProviderWithClerk>
  );
}

export default function ConvexClerkProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <ConvexProviderWrapper>
        {children}
      </ConvexProviderWrapper>
    </ClerkProvider>
  );
}