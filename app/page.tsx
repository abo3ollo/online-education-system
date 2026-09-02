// app/page.tsx

"use client";

import { useAuth, SignInButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaStar,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaGlobe,
  FaChevronDown,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { IoBookOutline } from "react-icons/io5";
import { MdOutlineEmail, MdOutlineRadio } from "react-icons/md";
import { ArrowRight, CheckCircle, ChevronLeft, ChevronRight, Loader2, Megaphone, Play, ShieldCheck, X } from "lucide-react";
import * as Icons from "react-icons/fa";
import { PiStudentBold } from "react-icons/pi";
import { RiParentFill } from "react-icons/ri";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LuClock5 } from "react-icons/lu";
import { HiOutlineUserGroup } from "react-icons/hi";
import Image from "next/image";
import { FaCircleUser } from "react-icons/fa6";


// ─── Icon Mapping ────────────────────────────────────────────────
const iconMap: Record<string, any> = {
  PiStudentBold: PiStudentBold,
  FaChalkboardTeacher: Icons.FaChalkboardTeacher,
  RiParentFill: RiParentFill,
  FaChartLine: Icons.FaChartLine,
  FaComments: Icons.FaComments,
  FaArchive: Icons.FaArchive,
  FaCheckCircle: Icons.FaCheckCircle,
  FaDesktop: Icons.FaDesktop,
  FaBroadcastTower: Icons.FaBroadcastTower,
};

function getIcon(iconName: string) {
  return iconMap[iconName] || Icons.FaCircle;
}

// ─── Component ───────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [lang, setLang] = useState<"en" | "ar">("ar");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentSubjectIndex, setCurrentSubjectIndex] = useState(0);
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const [selectedEmbedType, setSelectedEmbedType] = useState<string>("youtube");
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [selectedGrade, setSelectedGrade] = useState<"all" | "primary" | "middle" | "high">("all");
  const [isRedirecting, setIsRedirecting] = useState(false);

  // ✅ جلب البيانات من Convex
  const settings = useQuery(api.landing.landing.getPublicSettings, {});
  const sections = useQuery(api.landing.landing.getPublicSections, {});
  const courses = useQuery(api.landing.landing.getPublicCourses, {});
  const testimonials = useQuery(api.landing.landing.getPublicTestimonials, {});
  const videoTestimonials = useQuery(api.landing.landing.getPublicVideoTestimonials, {});
  const announcements = useQuery(api.landing.landing.getPublicAnnouncements, {});
  const subscriptions = useQuery(api.landing.landing.getPublicSubscriptions, {});


  const currentUser = useQuery(
    api.user.auth.getCurrentUser,
    isSignedIn ? {} : "skip"
  );

  const handleSignInClick = () => {
    // ✅ نضع علامة قبل فتح المودال
    sessionStorage.setItem("clerk_signed_in", "true");
  };

  // useEffect(() => {
  // لو مش مسجل دخول
  // if (!isSignedIn) {
  //   setIsRedirecting(false);
  //   return;
  // }

  // لو currentUser لسه بتحمّل
  // if (currentUser === undefined) {
  //   return;
  // }

  // لو currentUser = null
  // if (currentUser === null) {
  //   setIsRedirecting(true);
  //   router.replace("/onboarding");
  //   return;
  // }

  // ✅ لو مسجل دخول و currentUser موجود → توجيه فوري
  // const role = currentUser.role;
  // const status = currentUser.status;
  // const tracks = (currentUser as any).tracks || [];
  // const email = currentUser.email;

  // const ADMIN_WHITELIST = [
  //   "admin123@gmail.com",
  //   "admin@marineacademy.com",
  //   "your-email@gmail.com",
  //   "digitallandsystems2025@gmail.com",
  //   "abdalrahmanyehia333@gmail.com",
  // ];

  // ✅ لو أدمن
  // if (role === "admin" && ADMIN_WHITELIST.includes(email?.toLowerCase())) {
  //   setIsRedirecting(true);
  //   window.location.href = "/admin"; // ✅ أسرع من router
  //   return;
  // }

  // ✅ لو pending
  // if (status === "pending") {
  //   setIsRedirecting(true);
  //   window.location.href = "/pending-approval";
  //   return;
  // }

  // ✅ لو rejected
  // if (status === "rejected") {
  //   setIsRedirecting(true);
  //   window.location.href = "/account-rejected";
  //   return;
  // }

  // ✅ لو active أو approved
  //   if (status === "active" || status === "approved") {
  //     setIsRedirecting(true);

  //     if (tracks.includes("platform")) {
  //       const routes: Record<string, string> = {
  //         student: "/student",
  //         teacher: "/teacher",
  //         parent: "/parent",
  //         admin: "/admin",
  //       };
  //       const dashboardPath = routes[role];
  //       if (dashboardPath) {
  //         window.location.href = dashboardPath;
  //         return;
  //       }
  //     }

  //     if (tracks.includes("aptitude")) {
  //       window.location.href = "/aptitude";
  //       return;
  //     }

  //     if (tracks.includes("academic")) {
  //       window.location.href = "/academic";
  //       return;
  //     }

  //     if (tracks.length === 0) {
  //       window.location.href = "/onboarding";
  //       return;
  //     }
  //   }

  // }, [isSignedIn, currentUser]);

  // قائمة المواد
  const subjects = {
    ar: ["فيزياء", "رياضيات", "كيمياء", "أحياء", "لغة عربية", "لغة إنجليزية"],
    en: ["Physics", "Mathematics", "Chemistry", "Biology", "Arabic", "English"]
  };

  // تغيير المادة كل 2 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSubjectIndex((prev) => (prev + 1) % subjects.ar.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!announcements || announcements.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentAnnouncementIndex((prev) => (prev + 1) % announcements.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [announcements]);

  // ✅ حالة التحميل
  if (settings === undefined || sections === undefined || courses === undefined || testimonials === undefined || videoTestimonials === undefined || announcements === undefined || subscriptions === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#f9f9ff]">
        <Loader2 className="h-8 w-8 animate-spin text-[#003178]" />
      </div>
    );
  }

  // ✅ لو مسجل دخول وبينتظر التوجيه
  if (isSignedIn && isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f9f9ff]">
        <Loader2 className="h-8 w-8 animate-spin text-[#003178]" />
        <span className="mr-3 text-[#434652]">جاري التوجيه...</span>
      </div>
    );
  }

  // إذا لم توجد إعدادات، استخدم البيانات الافتراضية
  const defaultSettings = {
    heroBadge: "The Future of Marine Education",
    heroBadgeAr: "مستقبل التعليم البحري",
    heroTitle: "Learn Anytime, Anywhere with Marine Academy",
    heroTitleAr: "تعلّم في أي وقت، من أي مكان مع أكاديمية مارين",
    heroSubtitle: "A comprehensive educational platform designed to empower students and teachers through advanced interactive tools.",
    heroSubtitleAr: "منصة تعليمية شاملة مصممة لتمكين الطلاب والمعلمين من خلال أدوات تفاعلية متقدمة.",
    heroImageUrl: "/images/hero.png",
    schoolName: "Marine Academy",
    schoolNameAr: "أكاديمية مارين",
    ctaText: "Start Your Journey Now",
    ctaTextAr: "ابدأ رحلتك الآن",
    ctaUrl: "/onboarding",
    secondaryCta: "Free Demo",
    secondaryCtaAr: "عرض مجاني",
    secondaryCtaUrl: "#",
    stats: [
      { value: "5000+", label: "Active Students", labelAr: "طالب نشط" },
      { value: "200+", label: "Expert Teachers", labelAr: "معلم خبير" },
      { value: "50+", label: "Weekly Live Classes", labelAr: "فصل مباشر أسبوعياً" },
    ],
    themeMode: "dark" as const,
    showTestimonials: true,
    showCourses: true,
    showGallery: true,
    contactEmail: "info@marineacademy.com",
    contactPhone: "+966 50 000 0000",
    whatsappLink: "https://wa.me/966500000000",
    address: "Riyadh, Saudi Arabia",
    addressAr: "الرياض، المملكة العربية السعودية",
    footerDescription: "The global leader in marine and technical education.",
    footerDescriptionAr: "الرائد العالمي في التعليم البحري والتقني.",
    seoTitle: "Marine Academy - Premier Marine Education Platform",
    seoTitleAr: "أكاديمية مارين - منصة التعليم البحري الرائدة",
    seoDescription: "Marine Academy offers comprehensive marine education with live classes, expert teachers, and interactive learning tools.",
    seoDescriptionAr: "تقدم أكاديمية مارين تعليماً بحرياً شاملاً مع فصول مباشرة ومعلمين خبراء وأدوات تعلم تفاعلية.",
  };

  // دمج الإعدادات مع الافتراضية
  const data = { ...defaultSettings, ...settings };

  // دوال المساعدة للغة
  const t = {
    dir: lang === "ar" ? "rtl" : "ltr",
    nav: {
      students: lang === "ar" ? "الطلاب" : "Students",
      teachers: lang === "ar" ? "المعلمون" : "Teachers",
      parents: lang === "ar" ? "أولياء الأمور" : "Parents",
      liveClasses: lang === "ar" ? "الفصول المباشرة" : "Live Classes",
      login: lang === "ar" ? "تسجيل الدخول" : "Log In",
      getStarted: lang === "ar" ? "ابدأ الآن" : "Get Started",
    },
    hero: {
      badge: lang === "ar" ? data.heroBadgeAr : data.heroBadge,
      headline1: lang === "ar" ? "تعلّم في أي وقت، من أي مكان مع" : "Learn Anytime, Anywhere with",
      brand: lang === "ar" ? "أكاديمية مارين" : "Marine Academy",
      sub: lang === "ar" ? data.heroSubtitleAr : data.heroSubtitle,
      cta: lang === "ar" ? data.ctaTextAr : data.ctaText,
      demo: lang === "ar" ? data.secondaryCtaAr : data.secondaryCta,
      stats: data.stats.map((s: any) => ({
        value: s.value,
        label: lang === "ar" ? s.labelAr : s.label,
      })),
    },
    live: {
      badge: lang === "ar" ? "الفصل الحالي: الملاحة المتقدمة" : "Current Class: Advanced Navigation",
      live: lang === "ar" ? "مباشر" : "Live",
    },
    footer: {
      brand: lang === "ar" ? "أكاديمية مارين" : "Marine Academy",
      brandSub: lang === "ar" ? data.footerDescriptionAr : data.footerDescription,
      cols: lang === "ar" ? [
        { title: "الأكاديمية", links: ["عن الأكاديمية", "فريقنا", "الوظائف", "الأخبار"] },
        { title: "الموارد", links: ["المدونة", "مركز المساعدة", "معايير الأسطول", "الأسعار"] },
        { title: "القانونية", links: ["سياسة الخصوصية", "شروط الخدمة", "سياسة الكوكيز"] },
        { title: "الدعم", links: ["اتصل بنا", "تدريب الأسطول", "الدعم العالمي"] },
      ] : [
        { title: "Academy", links: ["About Us", "Our Team", "Careers", "News"] },
        { title: "Resources", links: ["Blog", "Help Center", "Marine Standards", "Pricing"] },
        { title: "Legal", links: ["Privacy Policy", "Terms of Service", "Cookie Policy"] },
        { title: "Support", links: ["Contact Us", "Fleet Training", "Global Support"] },
      ],
      sitemap: lang === "ar" ? "خريطة الموقع" : "Sitemap",
      lang: lang === "ar" ? "العربية (AR)" : "English (EN)",
      copy: lang === "ar" ? "© 2024 أكاديمية مارين. جميع الحقوق محفوظة." : "© 2024 Marine Academy. All rights reserved.",
    },
  };



  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

  // عرض الأقسام من Convex
  const renderSections = () => {
    if (!sections || sections.length === 0) return null;

    return sections.map((section: any) => {
      const hasFeatures = section.features && section.features.length > 0;
      const hasCards = section.cards && section.cards.length > 0;
      const hasSteps = section.steps && section.steps.length > 0;

      return (
        <section key={section._id} className="py-20 bg-[#f9f9ff]" >
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-14">
              <h2 className="text-3xl font-bold text-[#111c2d] mb-3">
                {lang === "ar" ? section.titleAr || section.title : section.title}
              </h2>
              {section.subtitle && (
                <p className="text-[#434652] max-w-xl mx-auto">
                  {lang === "ar" ? section.subtitleAr || section.subtitle : section.subtitle}
                </p>
              )}
            </div>

            {/* عرض الكروت (Cards) */}
            {hasCards && (
              <div className="grid md:grid-cols-3 gap-6">
                {section.cards.map((card: any, idx: number) => {
                  const Icon = getIcon(card.icon);
                  return (
                    <div key={idx} className="bg-[#f9f9ff] border border-[#c3c6d4] rounded-2xl p-8 hover:border-[#003178]/30 hover:shadow-md transition-all group">
                      <div className="w-14 h-14 bg-[#e7eeff] rounded-2xl flex items-center justify-center mb-5 group-hover:bg-[#003178]/10 transition-colors">
                        <Icon className="w-7 h-7 text-[#003178]" />
                      </div>
                      <h3 className="text-lg font-bold text-[#111c2d] mb-3">
                        {lang === "ar" ? card.titleAr || card.title : card.title}
                      </h3>
                      <p className="text-[#434652] text-sm leading-relaxed">
                        {lang === "ar" ? card.descAr || card.desc : card.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* عرض المميزات (Features) */}
            {hasFeatures && (
              <div className="space-y-5">
                {section.features.map((feature: any, idx: number) => {
                  const Icon = getIcon(feature.icon);
                  return (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="w-10 h-10 bg-[#e7eeff] rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                        <Icon className="h-5 w-5 text-[#003178]" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#111c2d] mb-1">
                          {lang === "ar" ? feature.titleAr || feature.title : feature.title}
                        </p>
                        <p className="text-sm text-[#434652]">
                          {lang === "ar" ? feature.descAr || feature.desc : feature.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* عرض الخطوات (Steps) */}
            {hasSteps && (
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {section.steps.map((step: any, idx: number) => (
                  <div key={idx} className="bg-[#111c2d]/5 border border-[#111c2d]/10 rounded-2xl p-6 text-center hover:bg-[#111c2d]/10 transition-colors">
                    <div className="w-12 h-12 bg-[#003178] rounded-xl flex items-center justify-center mx-auto mb-4">
                      <span className="text-white font-bold text-lg">{step.number}</span>
                    </div>
                    <h3 className="text-[#111c2d] font-bold mb-2">
                      {lang === "ar" ? step.titleAr || step.title : step.title}
                    </h3>
                    <p className="text-[#434652] text-sm leading-relaxed">
                      {lang === "ar" ? step.descAr || step.desc : step.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    });
  };


  // ── ANNOUNCEMENTS SECTION ──────────────────────────────────────
  const renderAnnouncements = () => {
    if (!announcements || announcements.length === 0) return null;

    const currentAnnouncement = announcements[currentAnnouncementIndex];

    return (
      <section className="py-20 bg-[#111c2d]">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section header */}
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-4">
              <div className="w-1 h-8 bg-[#003178] rounded-full"></div>
              <div>
                <h2 className="text-5xl font-bold text-white tracking-tight">
                  {lang === "ar" ? "أحدث الإعلانات" : "Latest Announcements"}
                </h2>
                <p className="text-sm text-[#a3ced6]">
                  {lang === "ar" ? "أهم المستجدات والأخبار" : "News and updates"}
                </p>
              </div>
            </div>
            {announcements.length > 1 && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#a3ced6] font-medium">
                  {String(currentAnnouncementIndex + 1).padStart(2, '0')} / {String(announcements.length).padStart(2, '0')}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentAnnouncementIndex((prev) =>
                      prev === 0 ? announcements.length - 1 : prev - 1
                    )}
                    className="p-2 rounded-2xl border border-white/20 hover:border-[#003178] hover:bg-[#003178]/20 transition-all duration-200 group"
                    aria-label="Previous announcement"
                  >
                    <ChevronRight className="h-4 w-4 text-[#a3ced6] group-hover:text-[#003178]" />
                  </button>
                  <button
                    onClick={() => setCurrentAnnouncementIndex((prev) =>
                      (prev + 1) % announcements.length
                    )}
                    className="p-2 rounded-2xl border border-white/20 hover:border-[#003178] hover:bg-[#003178]/20 transition-all duration-200 group"
                    aria-label="Next announcement"
                  >
                    <ChevronLeft className="h-4 w-4 text-[#a3ced6] group-hover:text-[#003178]" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Announcement Card - Image on Right (smaller) */}
          <div className="group relative bg-white/5 backdrop-blur-md rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-white/10">
            <div className="grid lg:grid-cols-5 gap-0">
              {/* Content - Takes 3/5 (left) */}
              <div className="lg:col-span-2 p-8 lg:p-12 flex flex-col justify-center order-2 lg:order-1">
                {/* Badge */}
                <span className="bg-[#003178] text-white text-xs font-semibold px-4 py-1.5 rounded-full inline-flex items-center gap-1.5 w-fit mb-5">
                  <Megaphone className="h-3 w-3" />
                  {lang === "ar" ? "إعلان جديد" : "New Announcement"}
                </span>

                {/* Title - London */}
                <h3 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-2 leading-tight">
                  {lang === "ar" ? currentAnnouncement.titleAr || currentAnnouncement.title : currentAnnouncement.title}
                </h3>

                {/* Description */}
                <p className="text-[#a3ced6] text-lg lg:text-xl leading-relaxed mb-6">
                  {lang === "ar" ? currentAnnouncement.descriptionAr || currentAnnouncement.description : currentAnnouncement.description}
                </p>

                {/* Points with dashes */}
                {currentAnnouncement.points && currentAnnouncement.points.length > 0 && (
                  <div className="space-y-2.5 mb-8">
                    {(lang === "ar" ? currentAnnouncement.pointsAr : currentAnnouncement.points).map((point: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-3 text-[#a3ced6]">
                        <span className="text-[#003178] text-lg font-bold leading-none">-</span>
                        <span className="text-base lg:text-lg">{point}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Button - Explore Trip */}
                <Link href="/trips">
                  <button className="bg-[#003178] hover:bg-[#002a5f] text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 inline-flex items-center gap-2 w-fit">
                    <span className="text-base">
                      {lang === "ar" ? "استكشف الرحلة" : "Explore Trip"}
                    </span>
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </Link>
              </div>

              {/* Image - Takes 3/5 (right) - No border, just rounded image */}
              <div className="lg:col-span-3 relative flex items-start justify-start p-6 order-1 lg:order-2">
                <div className="relative w-[90%] ms-auto flex justify-start  aspect-4/3 rounded-3xl overflow-hidden shadow-xl">
                  <img
                    src={currentAnnouncement.imageUrl || "/images/announcement-placeholder.jpg"}
                    alt={currentAnnouncement.title}
                    className="w-full h-full object-cover p-6 rounded-3xl border-rounded"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/announcement-placeholder.jpg";
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Progress indicators */}
          {announcements.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              {announcements.map((_: any, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setCurrentAnnouncementIndex(idx)}
                  className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentAnnouncementIndex
                    ? 'w-8 bg-[#003178]'
                    : 'w-4 bg-white/20 hover:bg-white/40'
                    }`}
                  aria-label={`Go to announcement ${idx + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  // ── VIDEO TESTIMONIALS SECTION ──────────────────────────────
  const renderVideoTestimonials = () => {
    if (!videoTestimonials || videoTestimonials.length === 0) return null;

    return (
      <section className="py-20 bg-[#111c2d]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-1 h-8 bg-[#003178] rounded-full"></div>
              <h2 className="text-3xl font-bold text-white">
                {lang === "ar" ? "لا تسمع منا... اسمع من طلابنا" : "Don't just take our word for it... hear from our students."}
              </h2>
              <div className="w-1 h-8 bg-[#003178] rounded-full"></div>
            </div>
            <p className="text-[#a3ced6]">
              {lang === "ar" ? "شاهد تجارب طلابنا مع المدرسين الخصوصيين" : "Watch our students' experiences with private tutors"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videoTestimonials.map((video: any) => {
              const isYouTube = video.embedType === "youtube";
              const videoId = getYouTubeId(video.videoUrl);

              const getYouTubeThumbnail = (id: string) => {
                return [
                  `https://img.youtube.com/vi/${id}/maxresdefault.jpg`,
                  `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
                  `https://img.youtube.com/vi/${id}/mqdefault.jpg`,
                ];
              };

              const thumbnailSources = isYouTube && videoId
                ? getYouTubeThumbnail(videoId)
                : [video.thumbnailUrl || '/images/video-placeholder.jpg'];

              const thumbnailUrl = thumbnailSources[0];

              const embedUrl = isYouTube
                ? `https://www.youtube.com/embed/${videoId}`
                : video.videoUrl;

              return (
                <div
                  key={video._id}
                  className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer bg-gray-800 border border-white/10 hover:border-[#003178]/50"
                  style={{ aspectRatio: '4/5' }}
                  onClick={() => openVideo(embedUrl, video.embedType)}
                >
                  <img
                    src={thumbnailUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      const currentSrc = img.src;
                      const currentIndex = thumbnailSources.indexOf(currentSrc);

                      if (currentIndex < thumbnailSources.length - 1) {
                        img.src = thumbnailSources[currentIndex + 1];
                      } else {
                        img.src = 'https://via.placeholder.com/400x500/111c2d/ffffff?text=فيديو';
                      }
                    }}
                    loading="lazy"
                  />

                  {isYouTube && (
                    <div className="absolute top-3 right-3 bg-red-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1 shadow-lg">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                      YouTube
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/30 transition-colors duration-300 flex items-center justify-center">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white/90 hover:bg-white shadow-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110">
                      <Play className="w-8 h-8 md:w-10 md:h-10 text-[#111c2d] ml-1" fill="currentColor" />
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-linear-to-t from-black/80 to-transparent">
                    <p className="text-white text-sm font-medium line-clamp-2">
                      {lang === "ar" ? video.titleAr || video.title : video.title}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  };

  // ── SUBSCRIPTIONS SECTION ──────────────────────────────────────
  const renderSubscriptions = () => {

    if (!subscriptions || subscriptions.length === 0) return null;

    const filtered = subscriptions.filter((s: any) =>
      selectedGrade === "all" ? true : s.grade === selectedGrade
    );

    return (
      <section className="py-20 bg-[#f9f9ff]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111c2d] mb-3">
              {lang === "ar" ? "أسعار باقات الإشتراك" : "Subscription Packages"}
            </h2>
            <div className="flex justify-center gap-4 mt-4">
              {["all", "primary", "middle", "high"].map((grade) => (
                <button
                  key={grade}
                  onClick={() => setSelectedGrade(grade as any)}
                  className={`px-6 py-2 rounded-full transition-all duration-300 ${selectedGrade === grade
                    ? "bg-[#003178] text-white"
                    : "bg-white text-[#111c2d] border border-[#c3c6d4] hover:border-[#003178]"
                    }`}
                >
                  {lang === "ar"
                    ? grade === "all" ? "الكل"
                      : grade === "primary" ? "ابتدائي"
                        : grade === "middle" ? "متوسط"
                          : "ثانوي"
                    : grade === "all" ? "All"
                      : grade === "primary" ? "Primary"
                        : grade === "middle" ? "Middle"
                          : "High"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filtered.map((sub: any) => {
              const isPopular = sub.isPopular;
              return (
                <Card key={sub._id} className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl ${isPopular ? "border-2 border-[#003178] shadow-lg" : "border border-[#c3c6d4]"}`}>
                  {isPopular && (
                    <div className="absolute top-0 right-0 bg-[#003178] text-white text-xs font-bold px-4 py-1 rounded-bl-lg">
                      {lang === "ar" ? "الأكثر طلباً" : "Popular"}
                    </div>
                  )}
                  <CardContent className="p-6 text-center">
                    <h3 className="text-xl font-bold text-[#111c2d]">
                      {lang === "ar" ? sub.titleAr || sub.title : sub.title}
                    </h3>
                    <p className="text-sm text-[#434652] mt-2">
                      {lang === "ar" ? sub.descriptionAr || sub.description : sub.description}
                    </p>
                    <div className="mt-4">
                      <span className="text-4xl font-bold text-[#003178]">{sub.price}</span>
                      <span className="text-sm text-[#434652] mr-1">EGP</span>
                    </div>
                    <p className="text-sm text-[#434652] mt-1">
                      {sub.sessionsCount} {lang === "ar" ? "حصة" : "Sessions"}
                    </p>
                    <ul className="mt-4 space-y-2 text-right">
                      {(lang === "ar" ? sub.featuresAr : sub.features).map((feature: string, idx: number) => (
                        <li key={idx} className="text-sm text-[#434652] flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-[#003178]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>
    );
  };




  // دالة مساعدة لاستخراج ID الفيديو من رابط YouTube
  function getYouTubeId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : "";
  }

  const renderCourses = () => {
    // ✅ استخدام data.showCourses
    if (!data.showCourses || !courses || courses.length === 0) return null;

    return (
      <section className="py-20 bg-[#f9f9ff]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#111c2d] mb-3">
              {lang === "ar" ? "دوراتنا المميزة" : "Featured Courses"}
            </h2>
            <p className="text-[#434652] max-w-xl mx-auto">
              {lang === "ar" ? "اختر من بين أفضل الدورات التعليمية" : "Choose from our best educational courses"}
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {courses.slice(0, 3).map((course: any) => (
              <div key={course._id} className="bg-[#f9f9ff] rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-[#c3c6d4]">
                <div className="w-full h-48 bg-[#111c2d] overflow-hidden">
                  <img
                    src={course.imageUrl || "/images/course-placeholder.jpg"}
                    alt={course.title}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/course-placeholder.jpg";
                    }}
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-lg font-bold text-[#111c2d] mb-2">
                    {lang === "ar" ? course.titleAr || course.title : course.title}
                  </h3>
                  <p className="text-sm text-[#434652] mb-3">
                    {lang === "ar" ? course.summaryAr || course.summary : course.summary}
                  </p>

                  {/* خط فاصل قبل اسم المعلم */}
                  <div className="border-t border-[#c3c6d4] pt-4 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FaCircleUser className="h-4 w-4 text-[#434652]" />
                        <span className="text-sm font-medium text-[#111c2d]">
                          {course.instructor}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FaStar className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-[#111c2d]">{course.rating}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  // عرض التوصيات
  const renderTestimonials = () => {
    // ✅ استخدام data.showTestimonials
    if (!data.showTestimonials || !testimonials || testimonials.length === 0) return null;

    return (
      <section className="py-20 bg-[#f9f9ff]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-[#111c2d] mb-3">
              {lang === "ar" ? "ماذا يقولون عنّا؟" : "What Do They Say About Us?"}
            </h2>
            <p className="text-[#434652]">
              {lang === "ar" ? "قصص نجاح طلابنا وأولياء أمورهم" : "Success stories from our students and parents"}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.slice(0, 4).map((item: any) => (
              <div key={item._id} className="bg-[#f9f9ff] border border-[#c3c6d4] rounded-2xl p-8 hover:border-[#003178]/30 hover:shadow-md transition-all">
                {/* Stars - Centered */}
                <div className="flex justify-center mb-4">
                  <div className="flex gap-1">
                    {Array.from({ length: item.rating || 5 }).map((_, i) => (
                      <FaStar key={i} className="h-5 w-5 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                </div>

                {/* Testimonial Text - Centered */}
                <p className="text-[#111c2d] text-center text-lg leading-relaxed mb-6 font-medium">
                  "{lang === "ar" ? item.textAr || item.text : item.text}"
                </p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#e7eeff] flex items-center justify-center">
                    <span className="text-[#003178] font-bold text-sm">
                      {item.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-[#111c2d] text-sm">
                      {lang === "ar" ? item.nameAr || item.name : item.name}
                    </p>
                    <p className="text-xs text-[#434652]">
                      {lang === "ar" ? item.roleAr || item.role : item.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };


  const openVideo = (videoUrl: string, embedType: string) => {
    setSelectedVideo(videoUrl);
    setSelectedEmbedType(embedType);
  };

  // دالة إغلاق الفيديو
  const closeVideo = () => {
    setSelectedVideo(null);
  };

  return (
    <div dir={t.dir} className="font-sans bg-[#f9f9ff] text-[#111c2d] overflow-x-hidden">

      {/* ── NAV ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 inset-x-0 z-50 p-3 bg-[#f9f9ff]/90 backdrop-blur border-b border-[#c3c6d4]">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          {/* ✅ Logo + Title */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <span className="text-4xl font-semibold text-[#003178]">
              {lang === "ar" ? data.schoolNameAr || "أكاديمية إتقان" : data.schoolName || "Test Academy"}
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={toggleLang}
              className="flex items-center gap-1.5 text-sm text-[#434652] hover:text-[#003178] border border-[#c3c6d4] rounded-lg px-3 py-1.5 transition-colors"
            >
              <FaGlobe className="h-4 w-4" />
              {lang === "en" ? "EN" : "AR"}
            </button>
            {isSignedIn ? (
              <Link href="/onboarding">
                <button className="text-sm font-medium text-[#434652] hover:text-[#003178] px-3 py-1.5 transition-colors">
                  {t.nav.login}
                </button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button
                  onClick={handleSignInClick}
                  className="text-sm font-medium text-[#434652] hover:text-[#003178] px-3 py-1.5 transition-colors"
                >
                  {t.nav.login}
                </button>
              </SignInButton>
            )}
            {isSignedIn ? (
              <Link href="/onboarding">
                <button className="text-sm font-semibold bg-[#003178] text-white px-4 py-2 rounded-lg hover:bg-[#002a5f] transition-colors">
                  {t.nav.getStarted}
                </button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button
                  onClick={handleSignInClick}
                  className="text-sm font-semibold bg-[#003178] text-white px-4 py-2 rounded-lg hover:bg-[#002a5f] transition-colors"
                >
                  {t.nav.getStarted}
                </button>
              </SignInButton>
            )}
          </div>

          <div className="flex lg:hidden items-center gap-2">
            <button onClick={toggleLang} className="p-2 text-[#434652]">
              <FaGlobe className="h-5 w-5" />
            </button>
            <button onClick={() => setMobileOpen(!mobileOpen)} className="p-2 text-[#434652]">
              {mobileOpen ? <FaTimes className="h-5 w-5" /> : <FaBars className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div className="lg:hidden bg-[#f9f9ff] border-t border-[#c3c6d4] px-6 py-4 space-y-3">
            {/* {[t.nav.students, t.nav.teachers, t.nav.parents, t.nav.liveClasses].map((item) => (
              <a key={item} href="#" className="block text-sm text-[#434652] py-1">{item}</a>
            ))} */}
            <div className="pt-2 flex gap-3">
              {isSignedIn ? (
                <Link href="/onboarding" className="flex-1">
                  <button className="w-full text-sm font-semibold bg-[#003178] text-white px-4 py-2 rounded-lg">
                    {t.nav.getStarted}
                  </button>
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <button
                  onClick={handleSignInClick} 
                  className="flex-1 text-sm font-semibold bg-[#003178] text-white px-4 py-2 rounded-lg">
                    {t.nav.getStarted}
                  </button>
                </SignInButton>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* ── HERO ────────────────────────────────────────────────── */}
      <section className="pt-32 pb-16 bg-[#f9f9ff]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              {/* Rating Badge - ✅ من Convex */}
              <div className="inline-flex items-center gap-2 bg-[#f9f9ff]/80 backdrop-blur border border-[#c3c6d4] rounded-full px-4 py-2 shadow-sm animate-fade-in-up">
                <div className="flex items-center gap-1">
                  <span className="text-yellow-400 text-sm">★★★★★</span>
                  <span className="text-sm font-semibold text-[#111c2d] mr-1">
                    {data.heroRating || "4.8"}/5
                  </span>
                </div>
                <span className="text-xs text-[#434652] border-r border-[#c3c6d4] pr-3">
                  {lang === "ar"
                    ? data.heroRatingLabelAr || "نسبة رضا الطالب"
                    : data.heroRatingLabel || "Student Satisfaction"}
                </span>
                <span className="text-xs text-green-500 bg-green-50 px-2 py-0.5 rounded-full">
                  ★ {lang === "ar" ? "ممتاز" : "Excellent"}
                </span>
              </div>

              {/* Main Heading - ✅ من Convex */}
              <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-[#111c2d] leading-tight mb-4">
                {lang === "ar" ? (
                  <>
                    {data.heroTitleAr || "احجز معلمك الخصوصي لـ"}
                    <br />
                    <span className="text-[#003178] inline-block min-w-30 transition-all duration-500 ease-in-out">
                      {subjects.ar[currentSubjectIndex]}
                    </span>
                  </>
                ) : (
                  <>
                    {data.heroTitle || "Book Your Private Tutor for"}
                    <br />
                    <span className="text-[#003178] inline-block min-w-35 transition-all duration-500 ease-in-out">
                      {subjects.en[currentSubjectIndex]}
                    </span>
                  </>
                )}
              </h1>

              {/* Subtitle */}
              <p className="text-lg text-[#434652] mb-8 max-w-lg">
                {lang === "ar"
                  ? "يفهمك المادة ويصنعك العلامة الكاملة , منصة تعليمية رائدة تقدم دروساً تفاعلية لجميع المراحل."
                  : "Understands the subject and guarantees you the full mark"}
              </p>

              {/* CTA Buttons - ✅ من Convex */}
              <div className="flex flex-wrap gap-4 mb-8">
                <Link href={data.ctaUrl || "/onboarding"}>
                  <button className="bg-[#003178] hover:bg-[#002a5f] text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105">
                    {lang === "ar" ? data.ctaTextAr || "إعرف أكثر عن باقات الدروس" : data.ctaText || "Learn More About Lesson Packages"}
                  </button>
                </Link>
                <Link href="/onboarding">
                  <button className="border-2 border-[#003178] text-[#003178] hover:bg-[#003178] hover:text-white font-semibold px-8 py-3.5 rounded-xl transition-all duration-300">
                    {lang === "ar" ? "تواصل معنا" : "Contact Us"}
                  </button>
                </Link>
              </div>

              {/* Trust Badges - ✅ من Convex */}
              <div className="flex flex-wrap items-center gap-6 pt-4 border-t border-[#c3c6d4]">
                {/* Badge 1 - Accreditation */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#e7eeff] rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#003178]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111c2d]">
                      {lang === "ar" ? "معتمدين من" : "Accredited by"}
                    </p>
                    <p className="text-xs text-[#434652]">
                      {lang === "ar"
                        ? data.trustBadge1Ar || "المركز الوطني للتعليم الإلكتروني"
                        : data.trustBadge1 || "National eLearning Center"}
                    </p>
                  </div>
                </div>

                {/* Badge 2 - Most Downloaded */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#e7eeff] rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#003178]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111c2d]">
                      {lang === "ar" ? "المدرسة الأكثر تحميلاً" : "Most Downloaded School"}
                    </p>
                    <p className="text-xs text-[#434652]">
                      {data.trustBadge2Year || "2023/2024"} {lang === "ar" ? "لعام" : "Year"}
                    </p>
                  </div>
                </div>

                {/* Badge 3 - Academic Levels */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-[#e7eeff] rounded-xl flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#003178]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#111c2d]">
                      {data.trustBadge3Value || "14+"}
                    </p>
                    <p className="text-xs text-[#434652]">
                      {lang === "ar"
                        ? data.trustBadge3Ar || "لجميع المراحل الدراسية"
                        : data.trustBadge3 || "For All Academic Levels"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right - Hero Image */}
            <div className="relative hidden lg:block">
              <div className="relative">
                {/* Main Image Container */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={data.heroImageUrl || "/images/hero2.jpg"}
                    alt="Hero illustration"
                    className="w-full h-auto object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/hero-placeholder.jpg";
                    }}
                  />
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-linear-to-t from-[#111c2d]/20 to-transparent"></div>
                </div>

                {/* ✅ Text under image - النص تحت الصورة (من Convex) */}
                <div className="mt-7 text-center">
                  <p className="text-xl md:text-2xl font-bold text-[#111c2d]">
                    {lang === "ar"
                      ? data.heroBottomTextAr || "تعلم الإنجليزية في بريطانيا بخطوات واضحة"
                      : data.heroBottomText || "Learn English in Britain with Confidence"}
                  </p>
                  <p className="mt-1 text-lg md:text-md text-[#434652]">
                    {lang === "ar"
                      ? data.heroBottomSmTextAr || "تعلم الإنجليزية في بريطانيا بخطوات واضحة"
                      : data.heroBottomSmText || "Steps Steps to Learn English in Britain"}
                  </p>
                </div>

                {/* Floating Badge - IB/IGCSE (من Convex) */}
                <div className="absolute -top-4 -right-4 bg-[#f9f9ff] rounded-2xl shadow-xl px-5 py-3 border border-[#c3c6d4]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#e7eeff] rounded-xl flex items-center justify-center">
                      <svg className="w-5 h-5 text-[#003178]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#111c2d]">
                        {data.floatingBadge1 || "IB/IGCSE"}
                      </p>
                      <p className="text-xs text-[#434652]">
                        {lang === "ar"
                          ? data.floatingBadge1Ar || "المنهاج الوطني"
                          : data.floatingBadge1 || "National Curriculum"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats floating on image */}
              <div className="absolute top-1/4 -left-6 bg-[#f9f9ff]/95 backdrop-blur rounded-2xl shadow-xl px-5 py-3 border border-[#c3c6d4]">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#111c2d]">4.8</p>
                  <p className="text-xs text-[#434652]">⭐ {lang === "ar" ? "تقييم" : "Rating"}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATIC SECTION: تحصيلي & القدرات ───────────────────────── */}
      <section className="py-16 bg-[#f9f9ff]">
        <div className="max-w-7xl mx-auto px-6">
          {/* Section Header */}
          <div className="text-center mb-12">
            <h2 className="text-5xl font-bold text-[#111c2d]">
              {lang === "ar" ? "اختر مسارك التعليمي" : "Choose Your Educational Path"}
            </h2>
            <p className="text-[#434652] mt-2">
              {lang === "ar"
                ? "برامج متخصصة تناسب احتياجاتك الدراسية"
                : "Specialized programs that suit your academic needs"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">

            {/* ── التحصيلي ─────────────────────────────────────────── */}
            <div className="group bg-[#f9f9ff] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-[#c3c6d4]">
              <div className="p-8">
                <div className="flex justify-between items-center gap-3 mb-4">

                  <div>
                    <h3 className="text-2xl font-bold text-[#111c2d]">
                      {lang === "ar" ? "التحصيلي" : "Academic Achievement"}
                    </h3>
                    <p className="text-sm text-[#434652]">
                      {lang === "ar"
                        ? "برامج متخصصة لتحسين مستواك الأكاديمي"
                        : "Specialized programs to improve your academic level"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#003178]/10 flex items-center justify-center group-hover:bg-[#003178]/20 transition-colors">
                    <svg className="w-6 h-6 text-[#003178]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>

                {/* فيديو التحصيلي */}
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#111c2d] group/video">
                  <img
                    src="/images/academic2.jpg"
                    alt="التحصيلي"
                    className="w-full h-full object-cover group-hover/video:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/video-placeholder.jfif";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/video:bg-black/20 transition-colors">
                    <button
                      onClick={() => window.open("https://youtu.be/tOFm-zoI6-w", "_blank")}
                      className="w-16 h-16 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
                    >
                      <svg className="w-8 h-8 text-[#111c2d] ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-[#434652]">
                    {lang === "ar"
                      ? "🎓 دروس تفاعلية مع أفضل المعلمين"
                      : "🎓 Interactive lessons with the best teachers"}
                  </p>
                </div>
              </div>
            </div>

            {/* ── القدرات ──────────────────────────────────────────── */}
            <div className="group bg-[#f9f9ff] rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2 border border-[#c3c6d4]">
              <div className="p-8">
                <div className="flex justify-between items-center gap-3 mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-[#111c2d]">
                      {lang === "ar" ? "القدرات" : "Aptitude Programs"}
                    </h3>
                    <p className="text-sm text-[#434652]">
                      {lang === "ar"
                        ? "استعد لاختبارات القدرات بثقة"
                        : "Prepare for aptitude tests with confidence"}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-[#003178]/10 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                    <svg className="w-6 h-6 text-[#003178]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>

                {/* فيديو القدرات */}
                <div className="relative rounded-2xl overflow-hidden aspect-video bg-[#111c2d] group/video">
                  <img
                    src="/images/aptitude2.jpg"
                    alt="القدرات"
                    className="w-full h-full object-cover group-hover/video:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/video-placeholder.jfif";
                    }}
                  />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover/video:bg-black/20 transition-colors">
                    <button
                      onClick={() => window.open("https://youtu.be/AFh1-fqdaf4", "_blank")}
                      className="w-16 h-16 bg-white/90 hover:bg-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
                    >
                      <svg className="w-8 h-8 text-[#111c2d] ml-1" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <p className="text-sm text-[#434652]">
                    {lang === "ar"
                      ? "🎯 تدريبات واختبارات محاكاة واقعية"
                      : "🎯 Realistic simulation exercises and tests"}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── REGISTRATION SECTION ────────────────────────────────────── */}
      <section className="py-25 bg-[#111c2d]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-1 h-8 bg-[#003178] rounded-full"></div>
              <h2 className="text-3xl font-bold text-white">
                {lang === "ar" ? "سجل الآن وابدأ رحلتك" : "Register Now and Start Your Journey"}
              </h2>
              <div className="w-1 h-8 bg-[#003178] rounded-full"></div>
            </div>
            <p className="text-[#a3ced6]">
              {lang === "ar"
                ? "اختر المسار المناسب لك وسجل في الخدمة التي تناسب احتياجاتك"
                : "Choose the right path for you and register for the service that suits your needs"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 - التسجيل في المنصة */}
            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-white/10 hover:border-[#003178]/50">
              <div className="w-16 h-16 rounded-2xl bg-[#003178]/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#003178]/40 transition-colors">
                <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {lang === "ar" ? "حصص اونلاين" : "Online classes"}
              </h3>
              <p className="text-sm text-[#a3ced6] leading-relaxed mb-4">
                {lang === "ar"
                  ? "أنشئ حسابك في المنصة واستفد من جميع الخدمات التعليمية"
                  : "Create your account on the platform and benefit from all educational services"}
              </p>
              {isSignedIn ? (
                <Link href="/onboarding">
                  <Button className="w-full bg-[#003178] hover:bg-[#002a5f] text-white transition-all duration-300 group-hover:scale-105">
                    {lang === "ar" ? "سجل الآن" : "Register Now"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <Button className="w-full bg-[#003178] hover:bg-[#002a5f] text-white transition-all duration-300 group-hover:scale-105">
                    {lang === "ar" ? "سجل الآن" : "Register Now"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </SignInButton>
              )}
            </div>

            {/* Card 2 - التسجيل في التحصيل الدراسي */}
            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-white/10 hover:border-[#003178]/50">
              <div className="w-16 h-16 rounded-2xl bg-[#003178]/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#003178]/40 transition-colors">
                <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {lang === "ar" ? "التحصيل الدراسي" : "Academic Achievement"}
              </h3>
              <p className="text-sm text-[#a3ced6] leading-relaxed mb-4">
                {lang === "ar"
                  ? "سجل في برامج التحصيل الدراسي لتحسين مستواك الأكاديمي"
                  : "Register for academic achievement programs to improve your academic level"}
              </p>
              {isSignedIn ? (
                <Link href="/onboarding">
                  <Button className="w-full bg-[#003178] hover:bg-[#002a5f] text-white transition-all duration-300 group-hover:scale-105">
                    {lang === "ar" ? "سجل الآن" : "Register Now"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <Button className="w-full bg-[#003178] hover:bg-[#002a5f] text-white transition-all duration-300 group-hover:scale-105">
                    {lang === "ar" ? "سجل الآن" : "Register Now"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </SignInButton>
              )}
            </div>

            {/* Card 3 - التسجيل في القدرات */}
            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-white/10 hover:border-[#003178]/50">
              <div className="w-16 h-16 rounded-2xl bg-[#003178]/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#003178]/40 transition-colors">
                <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {lang === "ar" ? "برامج القدرات" : "Aptitude Programs"}
              </h3>
              <p className="text-sm text-[#a3ced6] leading-relaxed mb-4">
                {lang === "ar"
                  ? "استعد لاختبارات القدرات مع أفضل المدربين والمواد التدريبية"
                  : "Prepare for aptitude tests with the best trainers and training materials"}
              </p>
              {isSignedIn ? (
                <Link href="/onboarding">
                  <Button className="w-full bg-[#003178] hover:bg-[#002a5f] text-white transition-all duration-300 group-hover:scale-105">
                    {lang === "ar" ? "سجل الآن" : "Register Now"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              ) : (
                <SignInButton mode="modal">
                  <Button className="w-full bg-[#003178] hover:bg-[#002a5f] text-white transition-all duration-300 group-hover:scale-105">
                    {lang === "ar" ? "سجل الآن" : "Register Now"}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </SignInButton>
              )}
            </div>

            {/* Card 4 - التسجيل في الرحلات */}
            <div className="group bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center hover:bg-white/20 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl border border-white/10 hover:border-[#003178]/50">
              <div className="w-16 h-16 rounded-2xl bg-[#003178]/20 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#003178]/40 transition-colors">
                <svg className="w-8 h-8 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                {lang === "ar" ? "تعلم الانجليزيه" : "Learn English"}
              </h3>
              <p className="text-sm text-[#a3ced6] leading-relaxed mb-4">
                {lang === "ar"
                  ? " انضم إلى رحلاتنا التعليمية المميزه و سفر الي  بريطانيا للتعلم"
                  : "Join our educational trips and Travel to Britain"}
              </p>
              <Link href="/trips"  >
                <Button className="w-full bg-[#003178] hover:bg-[#002a5f] text-white transition-all duration-300 group-hover:scale-105">
                  {lang === "ar" ? "سجل الآن" : "Register Now"}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ────────────────────────────────────────────── */}
      <section className="py-20 bg-[#f9f9ff]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-[#111c2d] mb-3">
              {lang === "ar" ? "لماذا تختارنا؟" : "Why Choose Us?"}
            </h2>
            <p className="text-[#434652] max-w-2xl mx-auto">
              {lang === "ar"
                ? "نقدم لك تجربة تعليمية متكاملة تجمع بين الجودة والمرونة والدعم المستمر"
                : "We offer you an integrated educational experience that combines quality, flexibility, and continuous support"}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1 */}
            <div className="group bg-[#f9f9ff] rounded-2xl p-6 text-center hover:bg-[#e7eeff] transition-all duration-300 hover:-translate-y-2 hover:shadow-lg border border-[#c3c6d4]">
              <div className="w-16 h-16 rounded-2xl bg-[#003178]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#003178]/20 transition-colors">
                <IoBookOutline className="w-7 h-7 text-[#003178] " />
              </div>
              <h3 className="text-lg font-bold text-[#111c2d] mb-2">
                {lang === "ar" ? "معلمون خبراء" : "Expert Teachers"}
              </h3>
              <p className="text-sm text-[#434652] leading-relaxed">
                {lang === "ar"
                  ? "نخبة من المعلمين المتميزين ذوي الخبرة في جميع المواد الدراسية"
                  : "A select group of distinguished teachers with experience in all subjects"}
              </p>
            </div>

            {/* Card 2 */}
            <div className="group bg-[#f9f9ff] rounded-2xl p-6 text-center hover:bg-[#e7eeff] transition-all duration-300 hover:-translate-y-2 hover:shadow-lg border border-[#c3c6d4]">
              <div className="w-16 h-16 rounded-2xl bg-[#003178]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#003178]/20 transition-colors">
                <LuClock5 className="w-7 h-7 text-[#003178] " />
              </div>
              <h3 className="text-lg font-bold text-[#111c2d] mb-2">
                {lang === "ar" ? "مرونة في المواعيد" : "Flexible Scheduling"}
              </h3>
              <p className="text-sm text-[#434652] leading-relaxed">
                {lang === "ar"
                  ? "اختر المواعيد التي تناسب جدولك الدراسي والشخصي بكل سهولة"
                  : "Choose the times that fit your academic and personal schedule with ease"}
              </p>
            </div>

            {/* Card 3 */}
            <div className="group bg-[#f9f9ff] rounded-2xl p-6 text-center hover:bg-[#e7eeff] transition-all duration-300 hover:-translate-y-2 hover:shadow-lg border border-[#c3c6d4]">
              <div className="w-16 h-16 rounded-2xl bg-[#003178]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#003178]/20 transition-colors">
                <ShieldCheck className="w-7 h-7 text-[#003178] " />
              </div>
              <h3 className="text-lg font-bold text-[#111c2d] mb-2">
                {lang === "ar" ? "ضمان الجودة" : "Quality Guarantee"}
              </h3>
              <p className="text-sm text-[#434652] leading-relaxed">
                {lang === "ar"
                  ? "نضمن لك تجربة تعليمية متميزة مع متابعة مستمرة لتقييم الأداء"
                  : "We guarantee you a distinguished educational experience with continuous performance evaluation"}
              </p>
            </div>

            {/* Card 4 */}
            <div className="group bg-[#f9f9ff] rounded-2xl p-6 text-center hover:bg-[#e7eeff] transition-all duration-300 hover:-translate-y-2 hover:shadow-lg border border-[#c3c6d4]">
              <div className="w-16 h-16 rounded-2xl bg-[#003178]/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-[#003178]/20 transition-colors">
                <HiOutlineUserGroup className="w-7 h-7 text-[#003178] " />
              </div>
              <h3 className="text-lg font-bold text-[#111c2d] mb-2">
                {lang === "ar" ? "دعم متواصل" : "24/7 Support"}
              </h3>
              <p className="text-sm text-[#434652] leading-relaxed">
                {lang === "ar"
                  ? "فريق دعم متخصص للإجابة على استفساراتك وحل أي مشكلة تواجهك"
                  : "A specialized support team to answer your inquiries and solve any problem you face"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dynamic Sections from Convex ────────────────────────── */}
      {renderSections()}

      {/* ── ANNOUNCEMENTS ───────────────────────────────────────── */}
      {renderAnnouncements()}

      {/* ── SUBSCRIPTIONS ───────────────────────────────────────── */}
      {renderSubscriptions()}

      {/* ── VIDEO TESTIMONIALS ─────────────────────────────────── */}
      {renderVideoTestimonials()}

      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={closeVideo}
        >
          <div className="relative w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={closeVideo}
              className="absolute -top-12 left-0 text-white hover:text-gray-300 transition-colors flex items-center gap-2 text-sm"
            >
              <X className="h-5 w-5" /> إغلاق
            </button>

            <div className="relative aspect-video bg-black rounded-2xl overflow-hidden">
              {selectedEmbedType === "youtube" ? (
                <iframe
                  src={selectedVideo}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video
                  src={selectedVideo}
                  controls
                  className="w-full h-full"
                  autoPlay
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Courses from Convex ─────────────────────────────────── */}
      {renderCourses()}

      {/* ── CONTACT SECTION ────────────────────────────────────────── */}
      <section className="py-20 bg-[#14696d]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            {lang === "ar" ? "تواصل معنا للمزيد من التفاصيل" : "Contact Us for More Details"}
          </h2>
          <p className="text-[#a3ced6] text-lg mb-8 max-w-2xl mx-auto">
            {lang === "ar"
              ? "نحن هنا للإجابة على جميع استفساراتك ومساعدتك في اختيار المسار التعليمي المناسب"
              : "We are here to answer all your questions and help you choose the right educational path"}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* WhatsApp Button */}
            <a
              href={data.whatsappLink || "https://wa.me/966500000000"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-[#25D366] hover:bg-[#1da851] text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
            >
              <Icons.FaWhatsapp className="h-6 w-6" />
              <span className="text-lg font-medium">
                {lang === "ar" ? "تواصل عبر الواتساب" : "Contact via WhatsApp"}
              </span>
            </a>

            {/* Email Button (Optional) */}
            {data.contactEmail && (
              <a
                href={`mailto:${data.contactEmail}`}
                className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40"
              >
                <MdOutlineEmail className="h-6 w-6" />
                <span className="text-lg font-medium">
                  {lang === "ar" ? "البريد الإلكتروني" : "Email"}
                </span>
              </a>
            )}

            {/* Phone Button (Optional) */}
            {data.contactPhone && (
              <a
                href={`tel:${data.contactPhone}`}
                className="inline-flex items-center justify-center gap-3 bg-white/10 backdrop-blur hover:bg-white/20 text-white font-semibold px-8 py-4 rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40"
              >
                <Icons.FaPhone className="h-6 w-6" />
                <span className="text-lg font-medium">
                  {lang === "ar" ? "اتصل بنا" : "Call Us"}
                </span>
              </a>
            )}
          </div>

          {/* Contact Info */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-white/80">
            {data.contactEmail && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{data.contactEmail}</span>
              </div>
            )}
            {data.contactPhone && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span dir="ltr">{data.contactPhone}</span>
              </div>
            )}
            {data.address && (
              <div className="flex items-center justify-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{lang === "ar" ? data.addressAr || data.address : data.address}</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── Testimonials from Convex ────────────────────────────── */}
      {renderTestimonials()}

      {/* ── FINAL CTA ───────────────────────────────────────────── */}
      <section className="py-24 bg-[#111c2d]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            {lang === "ar" ? "هل أنت مستعد لبدء رحلتك التعليمية؟" : "Ready to Start Your Learning Journey?"}
          </h2>
          <p className="text-[#a3ced6] mb-10 leading-relaxed">
            {lang === "ar"
              ? "انضم إلى آلاف الطلاب اليوم واستمتع بتجربة تعليمية فريدة مع أفضل المعلمين والخبراء."
              : "Join thousands of students today and enjoy a unique learning experience with the best teachers and experts."}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            {isSignedIn ? (
              <Link href={data.ctaUrl || "/onboarding"}>
                <button className="bg-white text-[#111c2d] font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors">
                  {lang === "ar" ? "ابدأ الآن مجاناً" : "Start Now for Free"}
                </button>
              </Link>
            ) : (
              <SignInButton mode="modal">
                <button className="bg-white text-[#111c2d] font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-100 transition-colors">
                  {lang === "ar" ? "ابدأ الآن مجاناً" : "Start Now for Free"}
                </button>
              </SignInButton>
            )}
            <button className="border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/10 transition-colors">
              {lang === "ar" ? "تواصل مع مستشار أكاديمي" : "Contact Academic Advisor"}
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────── */}
      <footer className="bg-black text-white py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
            <div className="col-span-2">
              <p className="text-xl font-bold mb-2">{t.footer.brand}</p>
              <p className="text-sm text-gray-400 leading-relaxed mb-5">{t.footer.brandSub}</p>
              <div className="flex gap-3">
                {[FaFacebook, FaTwitter, FaInstagram].map((Icon, i) => (
                  <button key={i} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                    <Icon className="h-4 w-4 text-gray-300" />
                  </button>
                ))}
              </div>
            </div>

            {t.footer.cols.map((col: any) => (
              <div key={col.title}>
                <p className="text-sm font-semibold mb-4">{col.title}</p>
                <ul className="space-y-2">
                  {col.links.map((link: string) => (
                    <li key={link}>
                      <a href="#" className="text-sm text-gray-400 hover:text-white transition-colors">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">{t.footer.copy}</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-sm text-gray-500 hover:text-white transition-colors">{t.footer.sitemap}</a>
              <button
                onClick={toggleLang}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-lg"
              >
                <FaGlobe className="h-4 w-4" />
                {t.footer.lang}
                <FaChevronDown className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}