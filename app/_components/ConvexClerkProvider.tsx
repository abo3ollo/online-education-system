// app/_components/ConvexClerkProvider.tsx

"use client";

import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth, useUser } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { useEffect, useState, useRef } from "react";
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

// Pages that should never trigger auto-redirect
const PUBLIC_PAGES   = ["/", "/trips", "/aptitude-landing", "/academic-landing"];
const AUTH_PAGES     = ["/sign-in", "/sign-up", "/onboarding", "/pending-approval", "/account-rejected", "/subscription"];
const PLATFORM_PAGES = ["/student", "/teacher", "/parent", "/admin", "/aptitude", "/academic"];

function UserSync() {
  const { isLoaded: userLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router   = useRouter();
  const pathname = usePathname();

  // ✅ Track whether user just signed in using sessionStorage
  const hasRedirected = useRef(false);
  const isSigningIn = useRef(false);

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
    }
  }, [userLoaded, isSignedIn]);

  // ✅ التحقق من أن المستخدم دخل للتو
  useEffect(() => {
    if (!userLoaded) return;
    if (currentUser === undefined) return;

    // ── Not signed in ─────────────────────────────────────────
    if (!isSignedIn) {
      hasRedirected.current = false;
      isSigningIn.current = false;

      // Protect platform pages
      if (PLATFORM_PAGES.some((p) => pathname?.startsWith(p))) {
        router.push("/");
      }
      return;
    }

    // ── Signed in but no Convex user yet ──────────────────────
    if (currentUser === null) {
      const skip = [...AUTH_PAGES, ...PUBLIC_PAGES];
      if (!skip.some((p) => pathname === p || pathname?.startsWith(p))) {
        router.replace("/onboarding");
      }
      return;
    }

    // ── Signed in + Convex user exists ────────────────────────
    const role   = (currentUser as any).role   as string;
    const status = (currentUser as any).status as string;
    const tracks = (currentUser as any).tracks as string[] || [];
    const email  = (currentUser as any).email  as string  || "";

    // Already on a protected/platform page → don't touch
    if (PLATFORM_PAGES.some((p) => pathname?.startsWith(p))) {
      return;
    }

    // Auth-flow pages (pending, rejected, onboarding) → handle them
    if (status === "pending") {
      if (pathname !== "/pending-approval") router.replace("/pending-approval");
      return;
    }
    if (status === "rejected") {
      if (pathname !== "/account-rejected") router.replace("/account-rejected");
      return;
    }

    // ✅ Check if user just signed in via sessionStorage
    const justSignedIn = sessionStorage.getItem("clerk_signed_in") === "true";
    const onAuthPage   = AUTH_PAGES.some((p) => pathname === p || pathname?.startsWith(p));
    const onHomePage   = pathname === "/";

    const shouldRedirect = (
      (status === "active" || status === "approved") &&
      (justSignedIn || onAuthPage) &&
      !hasRedirected.current
    );

    if (!shouldRedirect) {
      // ✅ If user is on home page while signed in → do NOT redirect
      // Let them browse the landing page freely
      return;
    }

    // ── Perform the redirect ──────────────────────────────────
    hasRedirected.current = true;
    
    // ✅ Clear sessionStorage after redirect
    sessionStorage.removeItem("clerk_signed_in");

    // Admin whitelist
    if (role === "admin" && ADMIN_WHITELIST.includes(email.toLowerCase())) {
      router.replace("/admin");
      return;
    }

    // By track
    if (tracks.includes("platform")) {
      const routes: Record<string, string> = {
        student: "/student",
        teacher: "/teacher",
        parent:  "/parent",
        admin:   "/admin",
      };
      if (routes[role]) { router.replace(routes[role]); return; }
    }
    if (tracks.includes("aptitude")) { router.replace("/aptitude"); return; }
    if (tracks.includes("academic")) { router.replace("/academic"); return; }

    // No tracks → onboarding
    if (tracks.length === 0) {
      router.replace("/onboarding");
      return;
    }

  }, [userLoaded, isSignedIn, currentUser, pathname, router]);

  // Reset hasRedirected when user signs out
  useEffect(() => {
    if (isSignedIn === false) {
      hasRedirected.current = false;
    }
  }, [isSignedIn]);

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