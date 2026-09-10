// app/(pages)/(roles)/admin/landing/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Loader2,
  Save,
  Eye,
  Globe,
  Mail,
  Settings,
  Plus,
  Trash2,
  Edit,
  Star,
  Users,
  BookOpen,
  Layout,
  TrendingUp,
  Shield,
  Trophy,
  GraduationCap,
  Play,
  Megaphone,
  Upload,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

// ─── Types ──────────────────────────────────────────────────────
interface LandingSettings {
  _id?: string;
  // Hero Fields
  // heroBadge: string;
  // heroBadgeAr: string;
  logoUrl?: string; // ✅ أضف هذا
  heroTitle: string;
  heroTitleAr: string;
  // heroSubtitle: string;
  // heroSubtitleAr: string;
  heroImageUrl: string;
  heroVideoUrl?: string; // ✅ أضف هذا
  heroRating?: string;
  heroRatingLabel?: string;
  heroRatingLabelAr?: string;
  heroBottomText?: string;
  heroBottomTextAr?: string;
  heroBottomSmText?: string;
  heroBottomSmTextAr?: string;
  schoolName: string;
  schoolNameAr: string;
  // CTA
  ctaText: string;
  ctaTextAr: string;
  ctaUrl: string;
  secondaryCta: string;
  secondaryCtaAr: string;
  secondaryCtaUrl: string;
  // Trust Badges
  trustBadge1?: string;
  trustBadge1Ar?: string;
  trustBadge2?: string;
  trustBadge2Ar?: string;
  trustBadge2Year?: string;
  trustBadge3Value?: string;
  trustBadge3?: string;
  trustBadge3Ar?: string;
  // Floating Badges
  floatingBadge1?: string;
  floatingBadge1Ar?: string;
  floatingBadge2?: string;
  floatingBadge2Ar?: string;
  // Stats
  stats: Array<{ value: string; label: string; labelAr: string }>;
  themeMode: "dark" | "light";
  showTestimonials: boolean;
  showCourses: boolean;
  showGallery: boolean;
  // Contact
  contactEmail: string;
  contactPhone: string;
  whatsappLink: string;
  address: string;
  addressAr: string;
  // Footer
  footerDescription: string;
  footerDescriptionAr: string;
  // SEO
  seoTitle: string;
  seoTitleAr: string;
  seoDescription: string;
  seoDescriptionAr: string;

}

// ─── Default Values ─────────────────────────────────────────────
const defaultSection = {
  isEnabled: true,
  slug: "",
  title: "",
  titleAr: "",
  subtitle: "",
  subtitleAr: "",
  body: "",
  bodyAr: "",
  ctaText: "",
  ctaTextAr: "",
  ctaUrl: "",
  mediaUrl: "",
  mediaType: "image" as const,
  features: [],
  cards: [],
  steps: [],
};

const defaultCourse = {
  isPublished: true,
  isFeatured: false,
  title: "",
  titleAr: "",
  summary: "",
  summaryAr: "",
  instructor: "",
  rating: 5,
  imageUrl: "",
  ctaUrl: "",
  ctaText: "سجل الآن",
  ctaTextAr: "سجل الآن",
  priceLabel: "",
  priceLabelAr: "",
};

const defaultTestimonial = {
  isPublished: true,
  name: "",
  nameAr: "",
  role: "",
  roleAr: "",
  text: "",
  textAr: "",
  rating: 5,
  avatarUrl: "",
};

const defaultVideo = {
  isPublished: true,
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  videoUrl: "",
  thumbnailUrl: "",
  embedType: "youtube" as const,
};

const defaultAnnouncement = {
  isPublished: true,
  title: "",
  titleAr: "",
  description: "",
  descriptionAr: "",
  points: [] as string[],
  pointsAr: [] as string[],
  imageUrl: "",
};

// ─── Main Component ────────────────────────────────────────────
export default function AdminLandingPage() {
  const [activeTab, setActiveTab] = useState("hero");
  const [isSaving, setIsSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [dialogType, setDialogType] = useState<"section" | "course" | "testimonial" | "gallery" | "video" | "announcement" | "subscription">("section");

  const [lang, setLang] = useState<"en" | "ar">("ar"); // الافتراضي عربي
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // جلب بيانات Landing Page
  const landingData = useQuery(api.landing.landing.getLandingData);
  const sections = useQuery(api.landing.landing.getSections);
  const courses = useQuery(api.landing.landing.getCourses);
  const testimonials = useQuery(api.landing.landing.getTestimonials);
  const gallery = useQuery(api.landing.landing.getGallery);
  const videoTestimonials = useQuery(api.landing.landing.getVideoTestimonials);
  const announcements = useQuery(api.landing.landing.getAnnouncements);
  const subscriptions = useQuery(api.landing.landing.getSubscriptions);

  const updateSettings = useMutation(api.landing.landing.updateSettings);
  const createSection = useMutation(api.landing.landing.createSection);
  const updateSection = useMutation(api.landing.landing.updateSection);
  const deleteSection = useMutation(api.landing.landing.deleteSection);
  const createCourse = useMutation(api.landing.landing.createCourse);
  const updateCourse = useMutation(api.landing.landing.updateCourse);
  const deleteCourse = useMutation(api.landing.landing.deleteCourse);
  const createTestimonial = useMutation(api.landing.landing.createTestimonial);
  const updateTestimonial = useMutation(api.landing.landing.updateTestimonial);
  const deleteTestimonial = useMutation(api.landing.landing.deleteTestimonial);
  const createGalleryItem = useMutation(api.landing.landing.createGalleryItem);
  const updateGalleryItem = useMutation(api.landing.landing.updateGalleryItem);
  const deleteGalleryItem = useMutation(api.landing.landing.deleteGalleryItem);
  const createVideoTestimonial = useMutation(api.landing.landing.createVideoTestimonial);
  const updateVideoTestimonial = useMutation(api.landing.landing.updateVideoTestimonial);
  const deleteVideoTestimonial = useMutation(api.landing.landing.deleteVideoTestimonial);
  const createAnnouncement = useMutation(api.landing.landing.createAnnouncement);
  const updateAnnouncement = useMutation(api.landing.landing.updateAnnouncement);
  const deleteAnnouncement = useMutation(api.landing.landing.deleteAnnouncement);
  const createSubscription = useMutation(api.landing.landing.createSubscription);
  const updateSubscription = useMutation(api.landing.landing.updateSubscription);
  const deleteSubscription = useMutation(api.landing.landing.deleteSubscription);
  const generateUploadUrl = useMutation(api.landing.landing.generateUploadUrl);
  const getUrl = useMutation(api.landing.landing.getUrl); // ✅ تغيرت إلى mutation  

  const [settings, setSettings] = useState<LandingSettings>({

      logoUrl: "", // ✅ أضف هذا

    heroTitle: "Book Your Private Tutor for",
    heroTitleAr: "احجز معلمك الخصوصي لـ",

    heroBottomText: "Learn English in Britain with Confidence",
    heroBottomTextAr: "تعلم الإنجليزية في بريطانيا بخطوات واضحة",
    heroBottomSmText: "Steps Steps to Learn English in Britain",
    heroBottomSmTextAr: "خطوات تعلم الإنجليزية في بريطانيا",
    heroImageUrl: "/images/Hero1.png",
    heroVideoUrl: "", // ✅ أضف هذا
    heroRating: "4.8",
    heroRatingLabel: "Student Satisfaction",
    heroRatingLabelAr: "نسبة رضا الطالب",
    schoolName: "Test Academy",
    schoolNameAr: "أكاديمية تجريبي",
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
    themeMode: "dark",
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
    seoTitle: "Test Academy - Premier Marine Education Platform",
    seoTitleAr: "أكاديمية تجريبي - منصة التعليم البحري الرائدة",
    seoDescription: "Marine Academy offers comprehensive marine education with live classes, expert teachers, and interactive learning tools.",
    seoDescriptionAr: "تقدم أكاديمية مارين تعليماً بحرياً شاملاً مع فصول مباشرة ومعلمين خبراء وأدوات تعلم تفاعلية.",
    trustBadge1: "National eLearning Center",
    trustBadge1Ar: "المركز الوطني للتعليم الإلكتروني",
    trustBadge2: "Most Downloaded School",
    trustBadge2Ar: "المدرسة الأكثر تحميلاً",
    trustBadge2Year: "2023/2024",
    trustBadge3Value: "14+",
    trustBadge3: "For All Academic Levels",
    trustBadge3Ar: "لجميع المراحل الدراسية",
    floatingBadge1: "IB/IGCSE",
    floatingBadge1Ar: "المنهاج الوطني",
    floatingBadge2: "Live Classes",
    floatingBadge2Ar: "فصول مباشرة",
  });


  useEffect(() => {
    if (landingData?.settings) {
      const dbSettings = landingData.settings;
      setSettings((prev) => ({
        ...prev,
        // Hero Fields
        // heroBadge: dbSettings.heroBadge ?? prev.heroBadge,
        // heroBadgeAr: dbSettings.heroBadgeAr ?? prev.heroBadgeAr,
        logoUrl: dbSettings.logoUrl ?? prev.logoUrl, // ✅ أضف هذا
        heroTitle: dbSettings.heroTitle ?? prev.heroTitle,
        heroTitleAr: dbSettings.heroTitleAr ?? prev.heroTitleAr,
        // heroSubtitle: dbSettings.heroSubtitle ?? prev.heroSubtitle,
        // heroSubtitleAr: dbSettings.heroSubtitleAr ?? prev.heroSubtitleAr,
        heroImageUrl: dbSettings.heroImageUrl ?? prev.heroImageUrl,
        heroVideoUrl: dbSettings.heroVideoUrl ?? prev.heroVideoUrl, // ✅ أضف هذا
        heroRating: dbSettings.heroRating ?? prev.heroRating,
        heroRatingLabel: dbSettings.heroRatingLabel ?? prev.heroRatingLabel,
        heroRatingLabelAr: dbSettings.heroRatingLabelAr ?? prev.heroRatingLabelAr,
        heroBottomText: dbSettings.heroBottomText ?? prev.heroBottomText,
        heroBottomTextAr: dbSettings.heroBottomTextAr ?? prev.heroBottomTextAr,
        heroBottomSmText: dbSettings.heroBottomSmText ?? prev.heroBottomSmText,
        heroBottomSmTextAr: dbSettings.heroBottomSmTextAr ?? prev.heroBottomSmTextAr,
        // School Name
        schoolName: dbSettings.schoolName ?? prev.schoolName,
        schoolNameAr: dbSettings.schoolNameAr ?? prev.schoolNameAr,

        // CTA
        ctaText: dbSettings.ctaText ?? prev.ctaText,
        ctaTextAr: dbSettings.ctaTextAr ?? prev.ctaTextAr,
        ctaUrl: dbSettings.ctaUrl ?? prev.ctaUrl,
        secondaryCta: dbSettings.secondaryCta ?? prev.secondaryCta,
        secondaryCtaAr: dbSettings.secondaryCtaAr ?? prev.secondaryCtaAr,
        secondaryCtaUrl: dbSettings.secondaryCtaUrl ?? prev.secondaryCtaUrl,
        // Stats
        stats: dbSettings.stats ?? prev.stats,
        // Theme
        themeMode: dbSettings.themeMode ?? prev.themeMode,
        // Visibility
        showTestimonials: dbSettings.showTestimonials ?? prev.showTestimonials,
        showCourses: dbSettings.showCourses ?? prev.showCourses,
        showGallery: dbSettings.showGallery ?? prev.showGallery,
        // Contact
        contactEmail: dbSettings.contactEmail ?? prev.contactEmail,
        contactPhone: dbSettings.contactPhone ?? prev.contactPhone,
        whatsappLink: dbSettings.whatsappLink ?? prev.whatsappLink,
        address: dbSettings.address ?? prev.address,
        addressAr: dbSettings.addressAr ?? prev.addressAr,
        // Footer
        footerDescription: dbSettings.footerDescription ?? prev.footerDescription,
        footerDescriptionAr: dbSettings.footerDescriptionAr ?? prev.footerDescriptionAr,
        // SEO
        seoTitle: dbSettings.seoTitle ?? prev.seoTitle,
        seoTitleAr: dbSettings.seoTitleAr ?? prev.seoTitleAr,
        seoDescription: dbSettings.seoDescription ?? prev.seoDescription,
        seoDescriptionAr: dbSettings.seoDescriptionAr ?? prev.seoDescriptionAr,

      }));
    }
  }, [landingData]);

// دالة رفع الشعار
const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  // ✅ تحقق من حجم الملف (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    toast.error(lang === "ar" ? "حجم الملف كبير جداً (الحد الأقصى 2MB)" : "File size too large (max 2MB)");
    return;
  }

  // ✅ تحقق من نوع الملف
  if (!file.type.startsWith('image/')) {
    toast.error(lang === "ar" ? "الرجاء رفع ملف صورة فقط" : "Please upload an image file only");
    return;
  }

  setIsUploadingLogo(true);
  try {
    // ✅ 1. جلب رابط الرفع
    const uploadUrl = await generateUploadUrl();
    
    // ✅ 2. رفع الملف
    const result = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type },
      body: file,
    });

    if (!result.ok) {
      throw new Error("Upload failed");
    }

    const { storageId } = await result.json();

    // ✅ 3. الحصول على رابط الملف (getUrl أصبحت mutation)
    const url = await getUrl({ storageId });

    // ✅ 4. حفظ الرابط في الإعدادات (مع التحقق من null)
    if (url) {
      setSettings({ ...settings, logoUrl: url });
      toast.success(lang === "ar" ? "تم رفع الشعار بنجاح" : "Logo uploaded successfully");
    } else {
      throw new Error("Failed to get file URL");
    }
  } catch (error) {
    console.error("Upload error:", error);
    toast.error(lang === "ar" ? "حدث خطأ أثناء رفع الشعار" : "Error uploading logo");
  } finally {
    setIsUploadingLogo(false);
    setLogoFile(null);
  }
};



  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  // ─── Dialog Handlers ──────────────────────────────────────────

  const openCreateDialog = (type: "section" | "course" | "testimonial" | "gallery" | "video" | "announcement" | "subscription") => {
    setDialogType(type);
    let defaults = {};
    switch (type) {
      case "section":
        defaults = { ...defaultSection };
        break;
      case "announcement":
        defaults = { ...defaultAnnouncement };
        break;
      case "course":
        defaults = { ...defaultCourse };
        break;
      case "testimonial":
        defaults = { ...defaultTestimonial };
        break;
      case "gallery":
        defaults = {
          isPublished: true,
          title: "",
          titleAr: "",
          caption: "",
          captionAr: "",
          category: "",
          imageUrl: ""
        };
        break;
      case "subscription": // ✅ أضف هذا
        defaults = {
          isPublished: true,
          isPopular: false,
          title: "",
          titleAr: "",
          description: "",
          descriptionAr: "",
          type: "monthly",
          price: 0,
          priceAr: "",
          sessionsCount: 0,
          grade: "primary",
          features: [],
          featuresAr: [],
        };
        break;
      case "video":
        defaults = { ...defaultVideo };
        break;
    }
    setEditingItem(defaults);
    setIsDialogOpen(true);
  };

  const openEditDialog = (type: "section" | "course" | "testimonial" | "gallery" | "video" | "announcement", item: any) => {
    setDialogType(type);
    setEditingItem({ ...item });
    setIsDialogOpen(true);
  };


  // ✅ تحديث دالة فتح التعديل للفيديو
  const openEditVideoDialog = (video: any) => {
    setDialogType("video");
    setEditingItem({
      _id: video._id,
      title: video.title || "",
      titleAr: video.titleAr || "",
      description: video.description || "",
      descriptionAr: video.descriptionAr || "",
      videoUrl: video.videoUrl || "",
      thumbnailUrl: video.thumbnailUrl || "",
      embedType: video.embedType || "youtube",
      isPublished: video.isPublished ?? true,
    });
    setIsDialogOpen(true);
  };

  // ✅ تحديث دالة فتح الإضافة للفيديو
  const openCreateVideoDialog = () => {
    setDialogType("video");
    setEditingItem({
      title: "",
      titleAr: "",
      description: "",
      descriptionAr: "",
      videoUrl: "",
      thumbnailUrl: "",
      embedType: "youtube",
      isPublished: true,
    });
    setIsDialogOpen(true);
  };

  // ─── Save Settings ──────────────────────────────────────────────

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      // ✅ إزالة updatedAt من الكائن قبل الإرسال
      const { ...settingsToSave } = settings;
      await updateSettings(settingsToSave);
      toast.success("تم حفظ الإعدادات بنجاح!");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));

  // ─── CRUD Handlers ─────────────────────────────────────────────

  const handleSaveItem = async () => {
    if (!editingItem) return;

    const isEditing = !!editingItem._id;

    try {
      if (isEditing) {
        const { _id, _creationTime, createdAt, updatedAt, ...cleanData } = editingItem;

        switch (dialogType) {
          case "section":
            await updateSection({ sectionId: _id as any, ...cleanData });
            break;
          case "course":
            await updateCourse({ courseId: _id as any, ...cleanData });
            break;
          case "testimonial":
            await updateTestimonial({ testimonialId: _id as any, ...cleanData });
            break;
          case "gallery":
            await updateGalleryItem({ itemId: _id as any, ...cleanData });
            break;
          case "video":
            await updateVideoTestimonial({ videoId: _id as any, ...cleanData });
            break;
          case "announcement": // ✅ أضف هذا
            await updateAnnouncement({ announcementId: _id as any, ...cleanData });
            break;
          case "subscription": // ✅ أضف هذا
            await updateSubscription({ subscriptionId: _id as any, ...cleanData });
            break;
        }
        toast.success("✅ تم التحديث بنجاح");
      } else {
        switch (dialogType) {
          case "section":
            await createSection({ ...editingItem, displayOrder: sections?.length || 0 });
            break;
          case "course":
            await createCourse({ ...editingItem, displayOrder: courses?.length || 0 });
            break;
          case "testimonial":
            await createTestimonial({ ...editingItem, displayOrder: testimonials?.length || 0 });
            break;
          case "gallery":
            await createGalleryItem({ ...editingItem, displayOrder: gallery?.length || 0 });
            break;
          case "video":
            await createVideoTestimonial({ ...editingItem, displayOrder: videoTestimonials?.length || 0 });
            break;
          case "announcement": // ✅ أضف هذا
            await createAnnouncement({ ...editingItem, displayOrder: announcements?.length || 0 });
            break;
          case "subscription": // ✅ أضف هذا
            await createSubscription({ ...editingItem, displayOrder: subscriptions?.length || 0 });
            break;
        }
        toast.success("✅ تم الإضافة بنجاح");
      }
      setIsDialogOpen(false);
      setEditingItem(null);
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    }
  };

  const handleDeleteItem = async (type: string, id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا العنصر؟")) return;
    try {
      switch (type) {
        case "section":
          await deleteSection({ sectionId: id as any });
          break;
        case "course":
          await deleteCourse({ courseId: id as any });
          break;
        case "testimonial":
          await deleteTestimonial({ testimonialId: id as any });
          break;
        case "gallery":
          await deleteGalleryItem({ itemId: id as any });
          break;
        case "video":
          await deleteVideoTestimonial({ videoId: id as any });
          break;
        case "announcement": // ✅ أضف هذا
          await deleteAnnouncement({ announcementId: id as any });
          break;
        case "subscription": // ✅ أضف هذا
          await deleteSubscription({ subscriptionId: id as any });
          break;
      }
      toast.success("✅ تم الحذف بنجاح");
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ");
    }
  };

  // ─── Render Functions ─────────────────────────────────────────

  const renderHeroTab = () => (
    <div className="space-y-6" dir={lang === "ar" ? "rtl" : "ltr"}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-[#1a7a8a]" />
            {lang === "ar" ? "محتوى الهيرو" : "Hero Content"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rating Badge */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]">
            <div className="space-y-2">
              <Label>{lang === "ar" ? "تقييم الطالب" : "Student Rating"}</Label>
              <Input
                value={settings.heroRating || ""}
                onChange={(e) => setSettings({ ...settings, heroRating: e.target.value })}
                placeholder={lang === "ar" ? "4.8" : "4.8"}
              />
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "نص التقييم (عربي)" : "Rating Label (Arabic)"}</Label>
              <Input
                value={settings.heroRatingLabelAr || ""}
                onChange={(e) => setSettings({ ...settings, heroRatingLabelAr: e.target.value })}
                placeholder={lang === "ar" ? "نسبة رضا الطالب" : "Student Satisfaction"}
              />
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "نص التقييم (إنجليزي)" : "Rating Label (English)"}</Label>
              <Input
                value={settings.heroRatingLabel || ""}
                onChange={(e) => setSettings({ ...settings, heroRatingLabel: e.target.value })}
                placeholder={lang === "ar" ? "Student Satisfaction" : "Student Satisfaction"}
              />
            </div>
          </div>

          {/* Main Title */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{lang === "ar" ? "العنوان الرئيسي (عربي)" : "Main Title (Arabic)"}</Label>
              <Textarea
                value={settings.heroTitleAr || ""}
                onChange={(e) => setSettings({ ...settings, heroTitleAr: e.target.value })}
                rows={2}
                placeholder={lang === "ar" ? "احجز معلمك الخصوصي لـ" : "Book Your Private Tutor for"}
              />
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "العنوان الرئيسي (إنجليزي)" : "Main Title (English)"}</Label>
              <Textarea
                value={settings.heroTitle || ""}
                onChange={(e) => setSettings({ ...settings, heroTitle: e.target.value })}
                rows={2}
                placeholder={lang === "ar" ? "Book Your Private Tutor for" : "Book Your Private Tutor for"}
              />
            </div>
          </div>

          {/* Hero Image / Video */}
          <div className="space-y-2">
            <Label>{lang === "ar" ? "صورة الهيرو (رابط)" : "Hero Image (URL)"}</Label>
            <Input
              value={settings.heroImageUrl || ""}
              onChange={(e) => setSettings({ ...settings, heroImageUrl: e.target.value })}
              placeholder={lang === "ar" ? "أدخل رابط الصورة" : "Enter image URL"}
            />

            {/* ✅ حقل فيديو الهيرو */}
            <div className="mt-4">
              <Label>{lang === "ar" ? "فيديو الهيرو (رابط YouTube)" : "Hero Video (YouTube URL)"}</Label>
              <Input
                value={settings.heroVideoUrl || ""}
                onChange={(e) => setSettings({ ...settings, heroVideoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <p className="text-xs text-gray-400 mt-1">
                {lang === "ar" ? "إذا تم إدخال رابط فيديو، سيظهر الفيديو بدلاً من الصورة" : "If a video URL is entered, the video will appear instead of the image"}
              </p>
            </div>

            {settings.heroImageUrl && !settings.heroVideoUrl && (
              <div className="mt-2 relative w-full h-48 rounded-lg overflow-hidden border border-[#c0c8c9] bg-gray-100">
                <img
                  src={settings.heroImageUrl}
                  alt="Hero"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* ✅ معاينة الفيديو */}
            {settings.heroVideoUrl && (
              <div className="mt-2 relative w-full aspect-video rounded-lg overflow-hidden border border-[#c0c8c9] bg-black">
                <iframe
                  src={getYouTubeEmbedUrl(settings.heroVideoUrl)}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="Hero Video"
                />
              </div>
            )}
          </div>

          {/* Hero Bottom Text */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]">
            <div className="space-y-2">
              <Label>{lang === "ar" ? "نص تحت صوره الهيرو (عربي)" : "Bottom Text (Arabic)"}</Label>
              <Textarea
                value={settings.heroBottomTextAr || ""}
                onChange={(e) => setSettings({ ...settings, heroBottomTextAr: e.target.value })}
                rows={2}
                placeholder={lang === "ar" ? "تعلم الإنجليزية في بريطانيا بخطوات واضحة" : "Learn English in Britain"}
              />
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "نص تحت صوره الهيرو (إنجليزي)" : "Bottom Text (English)"}</Label>
              <Textarea
                value={settings.heroBottomText || ""}
                onChange={(e) => setSettings({ ...settings, heroBottomText: e.target.value })}
                rows={1}
                placeholder={lang === "ar" ? "Learn English in Britain" : "Learn English in Britain"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]">
            <div className="space-y-2">
              <Label>{lang === "ar" ? "نص الصغير تحت صوره الهيرو (عربي)" : "Small Bottom Text (Arabic)"}</Label>
              <Textarea
                value={settings.heroBottomSmTextAr || ""}
                onChange={(e) => setSettings({ ...settings, heroBottomSmTextAr: e.target.value })}
                rows={1}
                placeholder={lang === "ar" ? "خطوات تعلم الإنجليزية في بريطانيا" : "Steps to Learn English"}
              />
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "نص الصغير تحت صوره الهيرو (إنجليزي)" : "Small Bottom Text (English)"}</Label>
              <Textarea
                value={settings.heroBottomSmText || ""}
                onChange={(e) => setSettings({ ...settings, heroBottomSmText: e.target.value })}
                rows={1}
                placeholder={lang === "ar" ? "Steps Steps to Learn English" : "Steps Steps to Learn English"}
              />
            </div>
          </div>

          {/* Primary CTA */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]">
            <div className="space-y-2">
              <Label>{lang === "ar" ? "زر الدعوة الأساسي (عربي)" : "Primary CTA (Arabic)"}</Label>
              <Input
                value={settings.ctaTextAr || ""}
                onChange={(e) => setSettings({ ...settings, ctaTextAr: e.target.value })}
                placeholder={lang === "ar" ? "إعرف أكثر عن باقات الدروس" : "Learn More"}
              />
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "زر الدعوة الأساسي (إنجليزي)" : "Primary CTA (English)"}</Label>
              <Input
                value={settings.ctaText || ""}
                onChange={(e) => setSettings({ ...settings, ctaText: e.target.value })}
                placeholder={lang === "ar" ? "Learn More About Lesson Packages" : "Learn More About Lesson Packages"}
              />
            </div>
            <div className="space-y-2">
              <Label>{lang === "ar" ? "الرابط" : "URL"}</Label>
              <Input
                value={settings.ctaUrl || ""}
                onChange={(e) => setSettings({ ...settings, ctaUrl: e.target.value })}
                placeholder="/onboarding"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trust Badges Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#1a7a8a]" />
            {lang === "ar" ? "شهادات الثقة" : "Trust Badges"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Badge 1 - Accreditation */}
            <div className="p-4 border border-[#c0c8c9] rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e0f5f7] rounded-xl flex items-center justify-center">
                  <Shield className="h-5 w-5 text-[#1a7a8a]" />
                </div>
                <Label className="text-sm font-semibold">
                  {lang === "ar" ? "الجهة المعتمدة" : "Accredited By"}
                </Label>
              </div>
              <div className="space-y-2">
                <Input
                  value={settings.trustBadge1Ar || ""}
                  onChange={(e) => setSettings({ ...settings, trustBadge1Ar: e.target.value })}
                  placeholder={lang === "ar" ? "المركز الوطني للتعليم الإلكتروني" : "National eLearning Center"}
                />
                <Input
                  value={settings.trustBadge1 || ""}
                  onChange={(e) => setSettings({ ...settings, trustBadge1: e.target.value })}
                  placeholder={lang === "ar" ? "National eLearning Center" : "National eLearning Center"}
                />
              </div>
            </div>

            {/* Badge 2 - Most Downloaded */}
            <div className="p-4 border border-[#c0c8c9] rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e0f5f7] rounded-xl flex items-center justify-center">
                  <Trophy className="h-5 w-5 text-[#1a7a8a]" />
                </div>
                <Label className="text-sm font-semibold">
                  {lang === "ar" ? "الإنجاز" : "Achievement"}
                </Label>
              </div>
              <div className="space-y-2">
                <Input
                  value={settings.trustBadge2Ar || ""}
                  onChange={(e) => setSettings({ ...settings, trustBadge2Ar: e.target.value })}
                  placeholder={lang === "ar" ? "المدرسة الأكثر تحميلاً" : "Most Downloaded School"}
                />
                <Input
                  value={settings.trustBadge2 || ""}
                  onChange={(e) => setSettings({ ...settings, trustBadge2: e.target.value })}
                  placeholder={lang === "ar" ? "Most Downloaded School" : "Most Downloaded School"}
                />
                <Input
                  value={settings.trustBadge2Year || ""}
                  onChange={(e) => setSettings({ ...settings, trustBadge2Year: e.target.value })}
                  placeholder="2023/2024"
                />
              </div>
            </div>

            {/* Badge 3 - Academic Levels */}
            <div className="p-4 border border-[#c0c8c9] rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#e0f5f7] rounded-xl flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-[#1a7a8a]" />
                </div>
                <Label className="text-sm font-semibold">
                  {lang === "ar" ? "المراحل الدراسية" : "Academic Levels"}
                </Label>
              </div>
              <div className="space-y-2">
                <Input
                  value={settings.trustBadge3Value || ""}
                  onChange={(e) => setSettings({ ...settings, trustBadge3Value: e.target.value })}
                  placeholder="14+"
                />
                <Input
                  value={settings.trustBadge3Ar || ""}
                  onChange={(e) => setSettings({ ...settings, trustBadge3Ar: e.target.value })}
                  placeholder={lang === "ar" ? "لجميع المراحل الدراسية" : "For All Academic Levels"}
                />
                <Input
                  value={settings.trustBadge3 || ""}
                  onChange={(e) => setSettings({ ...settings, trustBadge3: e.target.value })}
                  placeholder={lang === "ar" ? "For All Academic Levels" : "For All Academic Levels"}
                />
              </div>
            </div>
          </div>

          {/* Floating Badges */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="p-4 border border-[#c0c8c9] rounded-lg">
              <Label className="text-sm font-semibold">
                {lang === "ar" ? "بطاقة عائمة - المنهاج" : "Floating Badge - Curriculum"}
              </Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-xs">{lang === "ar" ? "العنوان" : "Title"}</Label>
                  <Input
                    value={settings.floatingBadge1 || ""}
                    onChange={(e) => setSettings({ ...settings, floatingBadge1: e.target.value })}
                    placeholder="IB/IGCSE"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{lang === "ar" ? "الوصف" : "Description"}</Label>
                  <Input
                    value={settings.floatingBadge1Ar || ""}
                    onChange={(e) => setSettings({ ...settings, floatingBadge1Ar: e.target.value })}
                    placeholder={lang === "ar" ? "المنهاج الوطني" : "National Curriculum"}
                  />
                </div>
              </div>
            </div>

            <div className="p-4 border border-[#c0c8c9] rounded-lg">
              <Label className="text-sm font-semibold">
                {lang === "ar" ? "بطاقة عائمة - فصول مباشرة" : "Floating Badge - Live Classes"}
              </Label>
              <div className="grid grid-cols-2 gap-4 mt-2">
                <div className="space-y-2">
                  <Label className="text-xs">{lang === "ar" ? "العنوان" : "Title"}</Label>
                  <Input
                    value={settings.floatingBadge2 || ""}
                    onChange={(e) => setSettings({ ...settings, floatingBadge2: e.target.value })}
                    placeholder="Live Classes"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">{lang === "ar" ? "الوصف" : "Description"}</Label>
                  <Input
                    value={settings.floatingBadge2Ar || ""}
                    onChange={(e) => setSettings({ ...settings, floatingBadge2Ar: e.target.value })}
                    placeholder={lang === "ar" ? "فصول مباشرة" : "Live Classes"}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // في بداية الـ Component أو خارجها
  function getYouTubeEmbedUrl(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  }

  const renderSectionsTab = () => (
    <div className="space-y-4" dir="rtl">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">الأقسام</h3>
        <Button
          onClick={() => openCreateDialog("section")}
          className="bg-[#001f24] hover:bg-[#03363d] text-white"
        >
          <Plus className="h-4 w-4 ml-2" />
          إضافة قسم
        </Button>
      </div>

      {!sections || sections.length === 0 ? (
        <Card className="p-8 text-center">
          <Layout className="h-12 w-12 mx-auto text-gray-300 mb-2" />
          <p className="text-gray-500">لا توجد أقسام</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sections.map((section: any) => (
            <Card key={section._id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold">{section.title || section.titleAr}</h4>
                    <p className="text-sm text-gray-500">{section.slug}</p>
                    <Badge className={section.isEnabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {section.isEnabled ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog("section", section)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteItem("section", section._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-2 line-clamp-2">{section.body || section.bodyAr}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );


  const renderAnnouncementsTab = () => {
    const announcementsData = announcements;

    if (announcementsData === undefined) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
        </div>
      );
    }

    // ✅ استخدم lang من الـ State
    const t = {
      title: lang === "ar" ? "الإعلانات" : "Announcements",
      add: lang === "ar" ? "إضافة إعلان" : "Add Announcement",
      noAnnouncements: lang === "ar" ? "لا توجد إعلانات" : "No announcements",
      published: lang === "ar" ? "منشور" : "Published",
      unpublished: lang === "ar" ? "غير منشور" : "Unpublished",
      edit: lang === "ar" ? "تعديل" : "Edit",
      delete: lang === "ar" ? "حذف" : "Delete",
      confirmDelete: lang === "ar" ? "هل أنت متأكد من حذف هذا الإعلان؟" : "Are you sure you want to delete this announcement?",
      deleteSuccess: lang === "ar" ? "تم حذف الإعلان بنجاح" : "Announcement deleted successfully",
      points: lang === "ar" ? "نقاط أخرى" : "more points",
      point: lang === "ar" ? "نقطة" : "point",
      pointsLabel: lang === "ar" ? "نقاط" : "points",
      imageAlt: lang === "ar" ? "صورة الإعلان" : "Announcement image",
    };

    return (
      <div className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t.title}</h3>
          <Button
            onClick={() => {
              setDialogType("announcement");
              setEditingItem({
                isPublished: true,
                title: "",
                titleAr: "",
                description: "",
                descriptionAr: "",
                points: [],
                pointsAr: [],
                imageUrl: "",
              });
              setIsDialogOpen(true);
            }}
            className="bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            {t.add}
          </Button>
        </div>

        {!announcements || announcements.length === 0 ? (
          <Card className="p-8 text-center">
            <Megaphone className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">{t.noAnnouncements}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {announcements.map((item: any) => (
              <Card key={item._id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                <div className="relative h-48 w-full bg-gray-100">
                  <img
                    src={item.imageUrl || "/images/announcement-placeholder.jpg"}
                    alt={item.title || t.imageAlt}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/announcement-placeholder.jpg";
                    }}
                  />
                  <Badge className={`absolute top-3 right-3 ${item.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {item.isPublished ? t.published : t.unpublished}
                  </Badge>
                </div>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#001f24] line-clamp-1">
                        {lang === "ar" ? item.titleAr || item.title : item.title || item.titleAr}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {lang === "ar" ? item.descriptionAr || item.description : item.description || item.descriptionAr}
                      </p>
                      {/* ✅ عرض النقاط حسب اللغة */}
                      {item.points && item.points.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {(lang === "ar" ? item.pointsAr || item.points : item.points || item.pointsAr)
                            .slice(0, 2)
                            .map((point: string, idx: number) => (
                              <p key={idx} className="text-xs text-gray-400 flex items-start gap-1">
                                <span className="text-[#1a7a8a]">•</span>
                                {point.length > 30 ? point.slice(0, 30) + "..." : point}
                              </p>
                            ))}
                          {(lang === "ar" ? item.pointsAr || item.points : item.points || item.pointsAr).length > 2 && (
                            <p className="text-xs text-[#1a7a8a]">
                              +{(lang === "ar" ? item.pointsAr || item.points : item.points || item.pointsAr).length - 2} {t.points}
                            </p>
                          )}
                        </div>
                      )}
                      {item.points && item.points.length > 0 && (
                        <div className="mt-1">
                          <span className="text-xs text-[#1a7a8a]">
                            📌 {item.points.length} {item.points.length === 1 ? t.point : t.pointsLabel}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 mr-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDialogType("announcement");
                          setEditingItem({
                            ...item,
                            points: item.points || [],
                            pointsAr: item.pointsAr || [],
                          });
                          setIsDialogOpen(true);
                        }}
                        title={t.edit}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={async () => {
                          if (confirm(t.confirmDelete)) {
                            try {
                              await deleteAnnouncement({ announcementId: item._id });
                              toast.success(t.deleteSuccess);
                            } catch (error: any) {
                              toast.error(error.message || "حدث خطأ أثناء الحذف");
                            }
                          }
                        }}
                        title={t.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };


  const renderSubscriptionsTab = () => {
    const t = {
      title: lang === "ar" ? "باقات الاشتراك" : "Subscription Packages",
      add: lang === "ar" ? "إضافة باقة" : "Add Package",
      noPackages: lang === "ar" ? "لا توجد باقات اشتراك" : "No subscription packages",
      popular: lang === "ar" ? "الأكثر طلباً" : "Popular",
      published: lang === "ar" ? "منشور" : "Published",
      unpublished: lang === "ar" ? "غير منشور" : "Unpublished",
      edit: lang === "ar" ? "تعديل" : "Edit",
      delete: lang === "ar" ? "حذف" : "Delete",
      confirmDelete: lang === "ar" ? "هل أنت متأكد من حذف هذه الباقة؟" : "Are you sure you want to delete this package?",
      deleteSuccess: lang === "ar" ? "تم حذف الباقة بنجاح" : "Package deleted successfully",
      session: lang === "ar" ? "حصة" : "session",
      sessions: lang === "ar" ? "حصص" : "sessions",
      features: lang === "ar" ? "مميزات أخرى" : "more features",
      primary: lang === "ar" ? "ابتدائي" : "Primary",
      middle: lang === "ar" ? "متوسط" : "Middle",
      high: lang === "ar" ? "ثانوي" : "High",
      sar: "ر.س",
    };

    const gradeLabels = {
      primary: t.primary,
      middle: t.middle,
      high: t.high,
    };

    return (
      <div className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t.title}</h3>
          <Button
            onClick={() => {
              setDialogType("subscription");
              setEditingItem({
                isPublished: true,
                isPopular: false,
                title: "",
                titleAr: "",
                description: "",
                descriptionAr: "",
                type: "monthly",
                price: 0,
                priceAr: "",
                sessionsCount: 0,
                grade: "primary",
                features: [],
                featuresAr: [],
              });
              setIsDialogOpen(true);
            }}
            className="bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            {t.add}
          </Button>
        </div>

        {!subscriptions || subscriptions.length === 0 ? (
          <Card className="p-8 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">{t.noPackages}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {subscriptions.map((item: any) => (
              <Card key={item._id} className={`overflow-hidden ${item.isPopular ? 'border-[#1a7a8a] border-2' : ''}`}>
                {item.isPopular && (
                  <div className="bg-[#1a7a8a] text-white text-center text-xs font-semibold py-1">
                    {t.popular}
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#001f24]">
                        {lang === "ar" ? item.titleAr || item.title : item.title || item.titleAr}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                        {lang === "ar" ? item.descriptionAr || item.description : item.description || item.descriptionAr}
                      </p>
                      <div className="mt-2">
                        <span className="text-2xl font-bold text-[#1a7a8a]">{item.price}</span>
                        <span className="text-sm text-gray-500 mr-1">{t.sar}</span>
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {item.sessionsCount} {item.sessionsCount === 1 ? t.session : t.sessions} • {gradeLabels[item.grade as keyof typeof gradeLabels] || item.grade}
                      </div>
                      {item.features && item.features.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {(lang === "ar" ? item.featuresAr || item.features : item.features || item.featuresAr)
                            .slice(0, 2)
                            .map((feature: string, idx: number) => (
                              <p key={idx} className="text-xs text-gray-400 flex items-start gap-1">
                                <span className="text-[#1a7a8a]">•</span>
                                {feature.length > 30 ? feature.slice(0, 30) + "..." : feature}
                              </p>
                            ))}
                          {(lang === "ar" ? item.featuresAr || item.features : item.features || item.featuresAr).length > 2 && (
                            <p className="text-xs text-[#1a7a8a]">
                              +{(lang === "ar" ? item.featuresAr || item.features : item.features || item.featuresAr).length - 2} {t.features}
                            </p>
                          )}
                        </div>
                      )}
                      {item.features && item.features.length > 0 && (
                        <div className="mt-1">
                          <span className="text-xs text-[#1a7a8a]">
                            ✨ {item.features.length} {item.features.length === 1 ? "ميزة" : "ميزات"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 mr-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setDialogType("subscription");
                          setEditingItem({
                            ...item,
                            features: item.features || [],
                            featuresAr: item.featuresAr || [],
                          });
                          setIsDialogOpen(true);
                        }}
                        title={t.edit}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={async () => {
                          if (confirm(t.confirmDelete)) {
                            try {
                              await deleteSubscription({ subscriptionId: item._id });
                              toast.success(t.deleteSuccess);
                            } catch (error: any) {
                              toast.error(error.message || "حدث خطأ أثناء الحذف");
                            }
                          }
                        }}
                        title={t.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <Badge className={`mt-2 ${item.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}`}>
                    {item.isPublished ? t.published : t.unpublished}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };


  const renderVideoTestimonialsTab = () => {
    const getEmbedUrl = (videoUrl: string, embedType: string) => {
      if (embedType === "youtube") {
        const match = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
        if (match) {
          return `https://www.youtube.com/embed/${match[1]}`;
        }
        return videoUrl;
      }
      if (embedType === "vimeo") {
        const match = videoUrl.match(/vimeo\.com\/(\d+)/);
        if (match) {
          return `https://player.vimeo.com/video/${match[1]}`;
        }
        return videoUrl;
      }
      return videoUrl;
    };

    const getYouTubeThumbnail = (videoUrl: string) => {
      const match = videoUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
      if (match) {
        const videoId = match[1];
        return [
          `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
        ];
      }
      return null;
    };

    const t = {
      title: lang === "ar" ? "فيديوهات الشهادات" : "Video Testimonials",
      add: lang === "ar" ? "إضافة فيديو" : "Add Video",
      noVideos: lang === "ar" ? "لا توجد فيديوهات شهادات" : "No video testimonials",
      published: lang === "ar" ? "منشور" : "Published",
      unpublished: lang === "ar" ? "غير منشور" : "Unpublished",
      edit: lang === "ar" ? "تعديل" : "Edit",
      delete: lang === "ar" ? "حذف" : "Delete",
      playing: lang === "ar" ? "يعمل الآن" : "Playing Now",
      close: lang === "ar" ? "إغلاق الفيديو" : "Close Video",
      link: lang === "ar" ? "رابط" : "Link",
      noImage: lang === "ar" ? "لا توجد صورة" : "No image",
      video: lang === "ar" ? "🎬 فيديو" : "🎬 Video",
      confirmDelete: lang === "ar" ? "هل أنت متأكد من حذف هذا الفيديو؟" : "Are you sure you want to delete this video?",
      deleteSuccess: lang === "ar" ? "✅ تم حذف الفيديو بنجاح" : "✅ Video deleted successfully",
      deleteError: lang === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting video",
    };

    return (
      <div className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t.title}</h3>
          <Button
            onClick={openCreateVideoDialog}
            className="bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            {t.add}
          </Button>
        </div>

        {!videoTestimonials || videoTestimonials.length === 0 ? (
          <Card className="p-8 text-center">
            <Play className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">{t.noVideos}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {videoTestimonials.map((video: any) => {
              const isPlaying = playingVideo === video._id;
              const embedUrl = getEmbedUrl(video.videoUrl, video.embedType || "youtube");

              let thumbnailUrl = video.thumbnailUrl;

              if (!thumbnailUrl && video.embedType === "youtube") {
                const thumbnails = getYouTubeThumbnail(video.videoUrl);
                if (thumbnails) {
                  thumbnailUrl = thumbnails[0];
                }
              }

              return (
                <Card key={video._id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-4">
                    {/* Video Player / Thumbnail */}
                    <div
                      className="relative w-full aspect-video rounded-lg overflow-hidden mb-3 bg-gray-100 cursor-pointer group"
                      onClick={() => setPlayingVideo(isPlaying ? null : video._id)}
                    >
                      {isPlaying ? (
                        <iframe
                          src={embedUrl}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          title={video.title || video.titleAr}
                        />
                      ) : (
                        <>
                          {thumbnailUrl ? (
                            <img
                              src={thumbnailUrl}
                              alt={video.title || video.titleAr}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const img = e.currentTarget;
                                const thumbnails = getYouTubeThumbnail(video.videoUrl);
                                if (thumbnails) {
                                  const currentSrc = img.src;
                                  const currentIndex = thumbnails.indexOf(currentSrc);
                                  if (currentIndex < thumbnails.length - 1) {
                                    img.src = thumbnails[currentIndex + 1];
                                  } else {
                                    img.style.display = 'none';
                                    const parent = img.parentElement;
                                    if (parent) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'w-full h-full flex items-center justify-center bg-gradient-to-br from-[#1a7a8a]/20 to-[#001f24]/20';
                                      fallback.innerHTML = `
                                      <div class="text-center">
                                        <span class="text-4xl block mb-2">🎬</span>
                                        <span class="text-sm text-gray-500">${t.noImage}</span>
                                      </div>
                                    `;
                                      parent.appendChild(fallback);
                                    }
                                  }
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-[#1a7a8a]/20 to-[#001f24]/20">
                              <div className="text-center">
                                <Play className="h-16 w-16 text-[#1a7a8a]/40 mx-auto" />
                                <span className="text-xs text-gray-400 block mt-2">{t.video}</span>
                              </div>
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-all duration-300">
                            <div className="w-14 h-14 bg-[#1a7a8a] rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                              <Play className="h-6 w-6 text-white mr-1" />
                            </div>
                          </div>
                          <div className="absolute top-2 right-2">
                            <Badge className="bg-black/70 text-white text-xs">
                              {video.embedType === "youtube" ? "YouTube" :
                                video.embedType === "vimeo" ? "Vimeo" : t.video}
                            </Badge>
                          </div>
                        </>
                      )}
                    </div>

                    {/* معلومات الفيديو */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm truncate">
                          {lang === "ar" ? video.titleAr || video.title : video.title || video.titleAr}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-2 mt-1">
                          {lang === "ar" ? video.descriptionAr || video.description : video.description || video.descriptionAr}
                        </p>
                      </div>
                      <div className="flex gap-1 mr-2 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditVideoDialog(video)}
                          title={t.edit}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={async () => {
                            if (confirm(t.confirmDelete)) {
                              try {
                                await deleteVideoTestimonial({ videoId: video._id as any });
                                toast.success(t.deleteSuccess);
                              } catch (error: any) {
                                toast.error(error.message || t.deleteError);
                              }
                            }
                          }}
                          title={t.delete}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* حالة النشر ورابط الفيديو */}
                    <div className="mt-2 flex items-center gap-3 flex-wrap">
                      <Badge className={video.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                        {video.isPublished ? t.published : t.unpublished}
                      </Badge>
                      {isPlaying && (
                        <Badge variant="outline" className="text-[#1a7a8a] border-[#1a7a8a]">
                          <Play className="h-3 w-3 ml-1" />
                          {t.playing}
                        </Badge>
                      )}
                      {video.videoUrl && (
                        <a
                          href={video.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-500 hover:text-blue-700 truncate max-w-32"
                        >
                          🔗 {t.link}
                        </a>
                      )}
                    </div>

                    {isPlaying && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPlayingVideo(null);
                        }}
                        className="mt-2 text-xs text-gray-400 hover:text-gray-600 w-full"
                      >
                        ✕ {t.close}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderCoursesTab = () => {
    const t = {
      title: lang === "ar" ? "الدورات" : "Courses",
      add: lang === "ar" ? "إضافة دورة" : "Add Course",
      noCourses: lang === "ar" ? "لا توجد دورات" : "No courses",
      published: lang === "ar" ? "منشور" : "Published",
      unpublished: lang === "ar" ? "غير منشور" : "Unpublished",
      edit: lang === "ar" ? "تعديل" : "Edit",
      delete: lang === "ar" ? "حذف" : "Delete",
      confirmDelete: lang === "ar" ? "هل أنت متأكد من حذف هذه الدورة؟" : "Are you sure you want to delete this course?",
      deleteSuccess: lang === "ar" ? "تم حذف الدورة بنجاح" : "Course deleted successfully",
      imageAlt: lang === "ar" ? "صورة الدورة" : "Course image",
      instructor: lang === "ar" ? "المدرس" : "Instructor",
      rating: lang === "ar" ? "تقييم" : "Rating",
    };

    return (
      <div className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t.title}</h3>
          <Button
            onClick={() => openCreateDialog("course")}
            className="bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            {t.add}
          </Button>
        </div>

        {!courses || courses.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">{t.noCourses}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course: any) => (
              <Card key={course._id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  {course.imageUrl && (
                    <div className="w-full h-32 rounded-lg overflow-hidden mb-3 bg-gray-100">
                      <img
                        src={course.imageUrl}
                        alt={course.title || t.imageAlt}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = "/images/course-placeholder.jpg";
                        }}
                      />
                    </div>
                  )}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-semibold text-[#001f24] line-clamp-1">
                        {lang === "ar" ? course.titleAr || course.title : course.title || course.titleAr}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-1">
                        {t.instructor}: {course.instructor || "—"}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">{course.rating || 0}</span>
                        <span className="text-xs text-gray-400">({t.rating})</span>
                      </div>
                      {course.summary && (
                        <p className="text-xs text-gray-400 line-clamp-2 mt-1">
                          {lang === "ar" ? course.summaryAr || course.summary : course.summary || course.summaryAr}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-1 mr-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog("course", course)}
                        title={t.edit}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={async () => {
                          if (confirm(t.confirmDelete)) {
                            try {
                              await handleDeleteItem("course", course._id);
                              toast.success(t.deleteSuccess);
                            } catch (error: any) {
                              toast.error(error.message || "حدث خطأ أثناء الحذف");
                            }
                          }
                        }}
                        title={t.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge className={course.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {course.isPublished ? t.published : t.unpublished}
                    </Badge>
                    {course.isFeatured && (
                      <Badge className="bg-yellow-100 text-yellow-700 border border-yellow-200">
                        ⭐ {lang === "ar" ? "مميز" : "Featured"}
                      </Badge>
                    )}
                    {course.priceLabel && (
                      <Badge variant="outline" className="text-xs">
                        {course.priceLabel}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTestimonialsTab = () => {
    const t = {
      title: lang === "ar" ? "التوصيات" : "Testimonials",
      add: lang === "ar" ? "إضافة توصية" : "Add Testimonial",
      noTestimonials: lang === "ar" ? "لا توجد توصيات" : "No testimonials",
      published: lang === "ar" ? "منشور" : "Published",
      unpublished: lang === "ar" ? "غير منشور" : "Unpublished",
      edit: lang === "ar" ? "تعديل" : "Edit",
      delete: lang === "ar" ? "حذف" : "Delete",
      confirmDelete: lang === "ar" ? "هل أنت متأكد من حذف هذه التوصية؟" : "Are you sure you want to delete this testimonial?",
      deleteSuccess: lang === "ar" ? "تم حذف التوصية بنجاح" : "Testimonial deleted successfully",
      deleteError: lang === "ar" ? "حدث خطأ أثناء الحذف" : "Error deleting testimonial",
    };

    return (
      <div className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">{t.title}</h3>
          <Button
            onClick={() => openCreateDialog("testimonial")}
            className="bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            <Plus className="h-4 w-4 ml-2" />
            {t.add}
          </Button>
        </div>

        {!testimonials || testimonials.length === 0 ? (
          <Card className="p-8 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">{t.noTestimonials}</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {testimonials.map((item: any) => (
              <Card key={item._id} className="overflow-hidden hover:shadow-md transition-shadow duration-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      {/* Rating Stars */}
                      <div className="flex gap-1 mb-2">
                        {Array.from({ length: item.rating || 5 }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ))}
                        <span className="text-xs text-gray-400 mr-1">
                          ({item.rating || 0}/5)
                        </span>
                      </div>

                      {/* Text */}
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {lang === "ar" ? item.textAr || item.text : item.text || item.textAr}
                      </p>

                      {/* Name */}
                      <p className="font-semibold text-[#001f24] mt-2">
                        {lang === "ar" ? item.nameAr || item.name : item.name || item.nameAr}
                      </p>

                      {/* Role */}
                      <p className="text-sm text-gray-500">
                        {lang === "ar" ? item.roleAr || item.role : item.role || item.roleAr}
                      </p>
                    </div>
                    <div className="flex gap-1 mr-2 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog("testimonial", item)}
                        title={t.edit}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={async () => {
                          if (confirm(t.confirmDelete)) {
                            try {
                              await handleDeleteItem("testimonial", item._id);
                              toast.success(t.deleteSuccess);
                            } catch (error: any) {
                              toast.error(error.message || t.deleteError);
                            }
                          }
                        }}
                        title={t.delete}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Badge className={item.isPublished ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"}>
                      {item.isPublished ? t.published : t.unpublished}
                    </Badge>
                    {item.avatarUrl && (
                      <div className="w-6 h-6 rounded-full overflow-hidden border border-gray-200">
                        <img
                          src={item.avatarUrl}
                          alt={item.name || "Avatar"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ─── Dialog ──────────────────────────────────────────────────

  const renderDialog = () => {
    if (!editingItem) return null;

    const isEditing = !!editingItem._id;
    let title = "";
    let fields = null;

    switch (dialogType) {
      case "section":
        title = isEditing ? "تعديل القسم" : "إضافة قسم جديد";
        fields = (
          <div className="space-y-4" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={editingItem.titleAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, titleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (إنجليزي)</Label>
                <Input
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>المعرف (slug)</Label>
              <Input
                value={editingItem.slug || ""}
                onChange={(e) => setEditingItem({ ...editingItem, slug: e.target.value })}
                placeholder="about-us"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المحتوى (عربي)</Label>
                <Textarea
                  value={editingItem.bodyAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, bodyAr: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>المحتوى (إنجليزي)</Label>
                <Textarea
                  value={editingItem.body || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, body: e.target.value })}
                  rows={4}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isEnabled ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isEnabled: e.target.checked })}
                />
                مفعل
              </Label>
            </div>
          </div>
        );
        break;

      case "announcement":
        title = isEditing ? "تعديل الإعلان" : "إضافة إعلان جديد";
        fields = (
          <div className="space-y-4" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={editingItem.titleAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, titleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (إنجليزي)</Label>
                <Input
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={editingItem.descriptionAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, descriptionAr: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف (إنجليزي)</Label>
                <Textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>النقاط (عربي) - كل نقطة في سطر جديد</Label>
              <Textarea
                value={editingItem.pointsAr?.join("\n") || ""}
                onChange={(e) => setEditingItem({
                  ...editingItem,
                  pointsAr: e.target.value.split("\n").filter((p: string) => p.trim() !== "")
                })}
                rows={4}
                placeholder="نقطة 1\nنقطة 2\nنقطة 3"
              />
            </div>

            <div className="space-y-2">
              <Label>النقاط (إنجليزي) - كل نقطة في سطر جديد</Label>
              <Textarea
                value={editingItem.points?.join("\n") || ""}
                onChange={(e) => setEditingItem({
                  ...editingItem,
                  points: e.target.value.split("\n").filter((p: string) => p.trim() !== "")
                })}
                rows={4}
                placeholder="Point 1\nPoint 2\nPoint 3"
              />
            </div>

            <div className="space-y-2">
              <Label>رابط الصورة</Label>
              <Input
                value={editingItem.imageUrl || ""}
                onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
              {editingItem.imageUrl && (
                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-[#c0c8c9]">
                  <img
                    src={editingItem.imageUrl}
                    alt="Announcement"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isPublished ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                />
                منشور
              </Label>
            </div>
          </div>
        );
        break;

      case "subscription":
        title = isEditing ? "تعديل باقة الاشتراك" : "إضافة باقة اشتراك جديدة";
        fields = (
          <div className="space-y-4" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={editingItem.titleAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, titleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (إنجليزي)</Label>
                <Input
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={editingItem.descriptionAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, descriptionAr: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف (إنجليزي)</Label>
                <Textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>السعر (ر.س)</Label>
                <Input
                  type="number"
                  value={editingItem.price || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, price: parseFloat(e.target.value) })}
                />
              </div>
              <div className="space-y-2">
                <Label>عدد الحصص</Label>
                <Input
                  type="number"
                  value={editingItem.sessionsCount || 0}
                  onChange={(e) => setEditingItem({ ...editingItem, sessionsCount: parseInt(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المرحلة الدراسية</Label>
                <select
                  value={editingItem.grade || "primary"}
                  onChange={(e) => setEditingItem({ ...editingItem, grade: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
                >
                  <option value="primary">ابتدائي</option>
                  <option value="middle">متوسط</option>
                  <option value="high">ثانوي</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>نوع الباقة</Label>
                <select
                  value={editingItem.type || "monthly"}
                  onChange={(e) => setEditingItem({ ...editingItem, type: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
                >
                  <option value="single">حصة واحدة</option>
                  <option value="monthly">شهري</option>
                  <option value="quarterly">فصلي</option>
                  <option value="yearly">سنوي</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>المميزات (عربي) - كل مميزة في سطر جديد</Label>
              <Textarea
                value={editingItem.featuresAr?.join("\n") || ""}
                onChange={(e) => setEditingItem({
                  ...editingItem,
                  featuresAr: e.target.value.split("\n").filter((p: string) => p.trim() !== "")
                })}
                rows={4}
                placeholder="مميزة 1\nمميزة 2\nمميزة 3"
              />
            </div>

            <div className="space-y-2">
              <Label>المميزات (إنجليزي) - كل مميزة في سطر جديد</Label>
              <Textarea
                value={editingItem.features?.join("\n") || ""}
                onChange={(e) => setEditingItem({
                  ...editingItem,
                  features: e.target.value.split("\n").filter((p: string) => p.trim() !== "")
                })}
                rows={4}
                placeholder="Feature 1\nFeature 2\nFeature 3"
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isPublished ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                />
                منشور
              </Label>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isPopular ?? false}
                  onChange={(e) => setEditingItem({ ...editingItem, isPopular: e.target.checked })}
                />
                الأكثر طلباً
              </Label>
            </div>
          </div>
        );
        break;

      case "video":
        title = isEditing ? "تعديل فيديو الشهادة" : "إضافة فيديو شهادة جديد";
        fields = (
          <div className="space-y-4" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={editingItem.titleAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, titleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (إنجليزي)</Label>
                <Input
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={editingItem.descriptionAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, descriptionAr: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف (إنجليزي)</Label>
                <Textarea
                  value={editingItem.description || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>رابط الفيديو *</Label>
              <Input
                value={editingItem.videoUrl || ""}
                onChange={(e) => setEditingItem({ ...editingItem, videoUrl: e.target.value })}
                placeholder="https://www.youtube.com/watch?v=... أو رابط الملف"
              />
              {editingItem.videoUrl && (
                <p className="text-xs text-green-600">
                  ✅ تم إدخال الرابط: {editingItem.videoUrl.length > 50 ? editingItem.videoUrl.slice(0, 50) + "..." : editingItem.videoUrl}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label>صورة الغلاف (اختياري)</Label>
              <Input
                value={editingItem.thumbnailUrl || ""}
                onChange={(e) => setEditingItem({ ...editingItem, thumbnailUrl: e.target.value })}
                placeholder="https://example.com/thumbnail.jpg"
              />
              {editingItem.thumbnailUrl && (
                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-[#c0c8c9]">
                  <img
                    src={editingItem.thumbnailUrl}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>نوع التضمين</Label>
              <select
                value={editingItem.embedType || "youtube"}
                onChange={(e) => setEditingItem({ ...editingItem, embedType: e.target.value as "youtube" | "vimeo" | "file" })}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
              >
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="file">ملف فيديو</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isPublished ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                />
                منشور
              </Label>
            </div>
          </div>
        );
        break;

      case "course":
        title = isEditing ? "تعديل الدورة" : "إضافة دورة جديدة";
        fields = (
          <div className="space-y-4" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={editingItem.titleAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, titleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (إنجليزي)</Label>
                <Input
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الملخص (عربي)</Label>
                <Textarea
                  value={editingItem.summaryAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, summaryAr: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>الملخص (إنجليزي)</Label>
                <Textarea
                  value={editingItem.summary || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, summary: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المدرس</Label>
                <Input
                  value={editingItem.instructor || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, instructor: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>التقييم (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  step="0.1"
                  value={editingItem.rating || 5}
                  onChange={(e) => setEditingItem({ ...editingItem, rating: parseFloat(e.target.value) })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>صورة الدورة (رابط)</Label>
              <Input
                value={editingItem.imageUrl || ""}
                onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                placeholder="/images/course.jpg"
              />
              {editingItem.imageUrl && (
                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-[#c0c8c9]">
                  <img
                    src={editingItem.imageUrl}
                    alt="Course"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>رابط الدورة</Label>
              <Input
                value={editingItem.ctaUrl || ""}
                onChange={(e) => setEditingItem({ ...editingItem, ctaUrl: e.target.value })}
                placeholder="/courses/1"
              />
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isPublished ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                />
                منشور
              </Label>
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isFeatured ?? false}
                  onChange={(e) => setEditingItem({ ...editingItem, isFeatured: e.target.checked })}
                />
                مميز
              </Label>
            </div>
          </div>
        );
        break;

      case "testimonial":
        title = isEditing ? "تعديل التوصية" : "إضافة توصية جديدة";
        fields = (
          <div className="space-y-4" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الاسم (عربي)</Label>
                <Input
                  value={editingItem.nameAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, nameAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>الاسم (إنجليزي)</Label>
                <Input
                  value={editingItem.name || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>المنصب (عربي)</Label>
                <Input
                  value={editingItem.roleAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, roleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>المنصب (إنجليزي)</Label>
                <Input
                  value={editingItem.role || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, role: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>النص (عربي)</Label>
                <Textarea
                  value={editingItem.textAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, textAr: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>النص (إنجليزي)</Label>
                <Textarea
                  value={editingItem.text || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, text: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>التقييم (1-5)</Label>
              <Input
                type="number"
                min="1"
                max="5"
                value={editingItem.rating || 5}
                onChange={(e) => setEditingItem({ ...editingItem, rating: parseFloat(e.target.value) })}
              />
            </div>
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isPublished ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                />
                منشور
              </Label>
            </div>
          </div>
        );
        break;

      case "gallery":
        title = isEditing ? "تعديل عنصر المعرض" : "إضافة عنصر معرض جديد";
        fields = (
          <div className="space-y-4" dir="rtl">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>العنوان (عربي)</Label>
                <Input
                  value={editingItem.titleAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, titleAr: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>العنوان (إنجليزي)</Label>
                <Input
                  value={editingItem.title || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>الوصف (عربي)</Label>
                <Textarea
                  value={editingItem.captionAr || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, captionAr: e.target.value })}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف (إنجليزي)</Label>
                <Textarea
                  value={editingItem.caption || ""}
                  onChange={(e) => setEditingItem({ ...editingItem, caption: e.target.value })}
                  rows={2}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>التصنيف</Label>
              <Input
                value={editingItem.category || ""}
                onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                placeholder="Workshop, Revision, Community"
              />
            </div>
            <div className="space-y-2">
              <Label>رابط الصورة</Label>
              <Input
                value={editingItem.imageUrl || ""}
                onChange={(e) => setEditingItem({ ...editingItem, imageUrl: e.target.value })}
                placeholder="/images/gallery.jpg"
              />
              {editingItem.imageUrl && (
                <div className="mt-2 relative w-full h-32 rounded-lg overflow-hidden border border-[#c0c8c9]">
                  <img
                    src={editingItem.imageUrl}
                    alt="Gallery"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <Label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItem.isPublished ?? true}
                  onChange={(e) => setEditingItem({ ...editingItem, isPublished: e.target.checked })}
                />
                منشور
              </Label>
            </div>
          </div>
        );
        break;

      default:
        return null;
    }

    return (
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {fields}
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsDialogOpen(false);
              setEditingItem(null);
            }}>
              إلغاء
            </Button>
            <Button
              onClick={handleSaveItem}
              className="bg-[#001f24] hover:bg-[#03363d] text-white"
            >
              {isEditing ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  // ─── Loading ──────────────────────────────────────────────────

  if (landingData === undefined || sections === undefined || courses === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#001f24] flex items-center gap-2">
            <Globe className="h-6 w-6 text-[#1a7a8a]" />
            إدارة Landing Page
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            التحكم في محتوى الصفحة الرئيسية للتطبيق
          </p>
        </div>
        <div className="flex gap-2">
          {/* ✅ زر تبديل اللغة */}
          <Button
            onClick={toggleLang}
            variant="outline"
            className="gap-2 border-gray-300"
          >
            <Globe className="h-4 w-4" />
            {lang === "ar" ? " عربي" : " English"}
          </Button>

          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {lang === "ar" ? "حفظ الإعدادات" : "Save Settings"}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 md:grid-cols-7 gap-2">
          <TabsTrigger value="hero">
            <Globe className="h-4 w-4 ml-2" />
            {lang === "ar" ? "الهيرو" : "Hero"}
          </TabsTrigger>
          {/* <TabsTrigger value="sections">
      <Layout className="h-4 w-4 ml-2" />
      {lang === "ar" ? "الأقسام" : "Sections"}
    </TabsTrigger> */}
          <TabsTrigger value="announcements">
            <Megaphone className="h-4 w-4 ml-2" />
            {lang === "ar" ? "الإعلانات" : "Announcements"}
          </TabsTrigger>
          <TabsTrigger value="subscriptions">
            <TrendingUp className="h-4 w-4 ml-2" />
            {lang === "ar" ? "الاشتراكات" : "Subscriptions"}
          </TabsTrigger>
          <TabsTrigger value="courses">
            <BookOpen className="h-4 w-4 ml-2" />
            {lang === "ar" ? "الدورات" : "Courses"}
          </TabsTrigger>
          <TabsTrigger value="videos">
            <Play className="h-4 w-4 ml-2" />
            {lang === "ar" ? "الفيديوهات" : "Videos"}
          </TabsTrigger>
          <TabsTrigger value="testimonials">
            <Star className="h-4 w-4 ml-2" />
            {lang === "ar" ? "التوصيات" : "Testimonials"}
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings className="h-4 w-4 ml-2" />
            {lang === "ar" ? "الإعدادات" : "Settings"}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="mt-4">
          {renderHeroTab()}
        </TabsContent>

        <TabsContent value="sections" className="mt-4">
          {renderSectionsTab()}
        </TabsContent>

        <TabsContent value="announcements" className="mt-4">
          {renderAnnouncementsTab()}
        </TabsContent>

        <TabsContent value="subscriptions" className="mt-4">
          {renderSubscriptionsTab()}
        </TabsContent>

        <TabsContent value="courses" className="mt-4">
          {renderCoursesTab()}
        </TabsContent>

        <TabsContent value="videos" className="mt-4">
          {renderVideoTestimonialsTab()}
        </TabsContent>

        <TabsContent value="testimonials" className="mt-4">
          {renderTestimonialsTab()}
        </TabsContent>

        <TabsContent value="settings" className="mt-4">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>
                  {lang === "ar" ? "إعدادات إضافية" : "Additional Settings"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* School Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "اسم المدرسة (عربي)" : "School Name (Arabic)"}</Label>
                    <Input
                      value={settings.schoolNameAr || "أكاديمية مارين"}
                      onChange={(e) => setSettings({ ...settings, schoolNameAr: e.target.value })}
                      placeholder={lang === "ar" ? "أكاديمية مارين" : "Marine Academy"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "اسم المدرسة (إنجليزي)" : "School Name (English)"}</Label>
                    <Input
                      value={settings.schoolName || "Marine Academy"}
                      onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
                      placeholder={lang === "ar" ? "Marine Academy" : "Marine Academy"}
                    />
                  </div>
                </div>

                {/* ✅ Logo Upload - رفع من الكمبيوتر */}
                <div className="space-y-2 pt-2 border-t border-[#c0c8c9]">
                  <Label>{lang === "ar" ? "شعار المدرسة" : "School Logo"}</Label>

                  <div className="flex items-center gap-4">
                    {/* ✅ زر رفع الملفات */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploadingLogo}
                      />
                      <Button
                        variant="outline"
                        className="border-[#c0c8c9] hover:border-[#1a7a8a]"
                        disabled={isUploadingLogo}
                      >
                        {isUploadingLogo ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin ml-2" />
                            {lang === "ar" ? "جاري الرفع..." : "Uploading..."}
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 ml-2" />
                            {lang === "ar" ? "اختر صورة" : "Choose Image"}
                          </>
                        )}
                      </Button>
                    </div>

                    {/* ✅ عرض الرابط الحالي (اختياري) */}
                    {settings.logoUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-700"
                        onClick={() => setSettings({ ...settings, logoUrl: "" })}
                      >
                        <Trash2 className="h-4 w-4" />
                        {lang === "ar" ? "حذف" : "Remove"}
                      </Button>
                    )}
                  </div>

                  {/* ✅ معاينة الشعار */}
                  {settings.logoUrl && (
                    <div className="mt-2 flex items-center gap-4 p-4 bg-[#f7fafa] rounded-lg border border-[#c0c8c9]">
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-[#c0c8c9] bg-white flex items-center justify-center">
                        <img
                          src={settings.logoUrl}
                          alt="School Logo"
                          className="w-full h-full object-contain p-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                            const parent = (e.target as HTMLImageElement).parentElement;
                            if (parent) {
                              const fallback = document.createElement('div');
                              fallback.className = 'w-full h-full flex items-center justify-center text-gray-400 text-xs';
                              fallback.textContent = '⚠️ ' + (lang === "ar" ? "تعذر تحميل الشعار" : "Logo failed to load");
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#111c2d]">
                          {lang === "ar" ? "معاينة الشعار" : "Logo Preview"}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-xs">
                          {settings.logoUrl}
                        </p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-400">
                    {lang === "ar"
                      ? "يُفضل استخدام صورة PNG أو SVG بحجم لا يتجاوز 2MB"
                      : "Prefer PNG or SVG image, max size 2MB"}
                  </p>
                </div>

                {/* Theme Mode */}
                {/* <div className="space-y-2">
                  <Label>{lang === "ar" ? "وضع السمة" : "Theme Mode"}</Label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="dark"
                        checked={settings.themeMode === "dark"}
                        onChange={() => setSettings({ ...settings, themeMode: "dark" })}
                      />
                      {lang === "ar" ? "داكن" : "Dark"}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value="light"
                        checked={settings.themeMode === "light"}
                        onChange={() => setSettings({ ...settings, themeMode: "light" })}
                      />
                      {lang === "ar" ? "فاتح" : "Light"}
                    </label>
                  </div>
                </div> */}

                {/* Contact */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
                    <Input
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                      placeholder={lang === "ar" ? "info@example.com" : "info@example.com"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "رقم الهاتف" : "Phone Number"}</Label>
                    <Input
                      value={settings.contactPhone}
                      onChange={(e) => setSettings({ ...settings, contactPhone: e.target.value })}
                      placeholder={lang === "ar" ? "+966 50 000 0000" : "+966 50 000 0000"}
                    />
                  </div>
                </div>

                {/* WhatsApp Link */}
                <div className="space-y-2">
                  <Label>{lang === "ar" ? "رابط واتساب" : "WhatsApp Link"}</Label>
                  <Input
                    value={settings.whatsappLink}
                    onChange={(e) => setSettings({ ...settings, whatsappLink: e.target.value })}
                    placeholder={lang === "ar" ? "https://wa.me/966500000000" : "https://wa.me/966500000000"}
                  />
                </div>

                {/* Address */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "العنوان (عربي)" : "Address (Arabic)"}</Label>
                    <Input
                      value={settings.addressAr}
                      onChange={(e) => setSettings({ ...settings, addressAr: e.target.value })}
                      placeholder={lang === "ar" ? "الرياض، المملكة العربية السعودية" : "Riyadh, Saudi Arabia"}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "العنوان (إنجليزي)" : "Address (English)"}</Label>
                    <Input
                      value={settings.address}
                      onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                      placeholder={lang === "ar" ? "Riyadh, Saudi Arabia" : "Riyadh, Saudi Arabia"}
                    />
                  </div>
                </div>

                {/* Footer Description */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "وصف التذييل (عربي)" : "Footer Description (Arabic)"}</Label>
                    <Textarea
                      value={settings.footerDescriptionAr}
                      onChange={(e) => setSettings({ ...settings, footerDescriptionAr: e.target.value })}
                      rows={2}
                      placeholder={lang === "ar" ? "الرائد العالمي في التعليم البحري والتقني." : "The global leader in marine and technical education."}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{lang === "ar" ? "وصف التذييل (إنجليزي)" : "Footer Description (English)"}</Label>
                    <Textarea
                      value={settings.footerDescription}
                      onChange={(e) => setSettings({ ...settings, footerDescription: e.target.value })}
                      rows={2}
                      placeholder={lang === "ar" ? "The global leader in marine and technical education." : "The global leader in marine and technical education."}
                    />
                  </div>
                </div>

                {/* Show Sections */}
                {/* <div className="space-y-4">
                  <Label>{lang === "ar" ? "إظهار الأقسام" : "Show Sections"}</Label>
                  <div className="flex flex-wrap gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showCourses}
                        onChange={(e) => setSettings({ ...settings, showCourses: e.target.checked })}
                      />
                      {lang === "ar" ? "الدورات" : "Courses"}
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showTestimonials}
                        onChange={(e) => setSettings({ ...settings, showTestimonials: e.target.checked })}
                      />
                      {lang === "ar" ? "التوصيات" : "Testimonials"}
                    </label>
                    {settings.showGallery !== undefined && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.showGallery}
                          onChange={(e) => setSettings({ ...settings, showGallery: e.target.checked })}
                        />
                        {lang === "ar" ? "معرض الصور" : "Gallery"}
                      </label>
                    )}
                  </div>
                </div> */}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog */}
      {renderDialog()}
    </div>
  );
}