// convex/landing/landing.ts

import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { Id } from "../_generated/dataModel";

// ─── Auth Helper ──────────────────────────────────────────────────

async function getAdminUser(ctx: any) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("غير مصرح");

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q: any) => q.eq("clerkId", identity.subject))
    .first();

  if (!user) throw new Error("المستخدم غير موجود");

  if (user.role !== "admin") {
    throw new Error("مطلوب صلاحيات أدمن");
  }

  return user;
}

// ✅ توليد رابط رفع الملفات
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getUrl = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// ══════════════════════════════════════════════════════════════════
// SETTINGS
// ══════════════════════════════════════════════════════════════════

// ✅ جلب إعدادات Landing Page (للأدمن)
export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getAdminUser(ctx);

    const settings = await ctx.db.query("landingSettings").first();

    return settings || null;
  },
});

// ✅ جلب إعدادات Landing Page (للعرض العام)
export const getPublicSettings = query({
  args: {},
  handler: async (ctx) => {
    const settings = await ctx.db.query("landingSettings").first();

    return settings || null;
  },
});

export const updateSettings = mutation({
  args: {
    // Hero Fields
    heroTitle: v.optional(v.string()),
    heroTitleAr: v.optional(v.string()),
    heroImageUrl: v.optional(v.string()),
    heroVideoUrl: v.optional(v.string()), // ✅ أضف هذا

    heroRating: v.optional(v.string()),
    heroRatingLabel: v.optional(v.string()),
    heroRatingLabelAr: v.optional(v.string()),

    heroBottomText: v.optional(v.string()),
    heroBottomTextAr: v.optional(v.string()),
    heroBottomSmText: v.optional(v.string()),
    heroBottomSmTextAr: v.optional(v.string()),

    // School Name
    schoolName: v.optional(v.string()),
    schoolNameAr: v.optional(v.string()),

    // Logo
    logoUrl: v.optional(v.string()),

    // Trust Badges
    trustBadge1: v.optional(v.string()),
    trustBadge1Ar: v.optional(v.string()),
    trustBadge2: v.optional(v.string()),
    trustBadge2Ar: v.optional(v.string()),
    trustBadge2Year: v.optional(v.string()),
    trustBadge3Value: v.optional(v.string()),
    trustBadge3: v.optional(v.string()),
    trustBadge3Ar: v.optional(v.string()),

    // Floating Badges
    floatingBadge1: v.optional(v.string()),
    floatingBadge1Ar: v.optional(v.string()),
    floatingBadge2: v.optional(v.string()),
    floatingBadge2Ar: v.optional(v.string()),

    // CTA
    ctaText: v.optional(v.string()),
    ctaTextAr: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    secondaryCta: v.optional(v.string()),
    secondaryCtaAr: v.optional(v.string()),
    secondaryCtaUrl: v.optional(v.string()),

    // Stats
    stats: v.optional(
      v.array(
        v.object({
          value: v.string(),
          label: v.string(),
          labelAr: v.string(),
        }),
      ),
    ),

    // Theme
    themeMode: v.optional(v.union(v.literal("dark"), v.literal("light"))),

    // Visibility
    showTestimonials: v.optional(v.boolean()),
    showCourses: v.optional(v.boolean()),
    showGallery: v.optional(v.boolean()),

    // Contact
    contactEmail: v.optional(v.string()),
    contactPhone: v.optional(v.string()),
    whatsappLink: v.optional(v.string()),
    address: v.optional(v.string()),
    addressAr: v.optional(v.string()),

    // Footer
    footerDescription: v.optional(v.string()),
    footerDescriptionAr: v.optional(v.string()),

    // SEO
    seoTitle: v.optional(v.string()),
    seoTitleAr: v.optional(v.string()),
    seoDescription: v.optional(v.string()),
    seoDescriptionAr: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    const existing = await ctx.db.query("landingSettings").first();

    // ✅ تنظيف البيانات من القيم غير المحددة
    const cleanData: any = {};
    for (const [key, value] of Object.entries(args)) {
      if (value !== undefined && value !== null) {
        cleanData[key] = value;
      }
    }

    // ✅ لا نضيف updatedAt إطلاقاً
    const data = cleanData;

    if (existing) {
      // ✅ تحديث فقط بدون updatedAt
      await ctx.db.patch(existing._id, data);
      return existing._id;
    } else {
      // ✅ الإدراج الجديد بدون updatedAt
      const defaults = {
        heroBadge: "The Future of Marine Education",
        heroBadgeAr: "مستقبل التعليم البحري",
        heroTitle: "Learn Anytime, Anywhere with Marine Academy",
        heroTitleAr: "تعلّم في أي وقت، من أي مكان مع أكاديمية مارين",
        heroSubtitle:
          "A comprehensive educational platform designed to empower students and teachers through advanced interactive tools.",
        heroSubtitleAr:
          "منصة تعليمية شاملة مصممة لتمكين الطلاب والمعلمين من خلال أدوات تفاعلية متقدمة.",
        heroImageUrl: "/images/Hero1.png",
        heroBottomText: "Learn English in Britain with Confidence",
        heroBottomTextAr: "تعلم الإنجليزية في بريطانيا بخطوات واضحة",
        heroBottomSmText: "Steps Steps to Learn English in Britain",
        heroBottomSmTextAr: "خطوات تعلم الإنجليزية في بريطانيا",
        heroRating: "4.8",
        heroRatingLabel: "Student Satisfaction",
        heroRatingLabelAr: "نسبة رضا الطالب",
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
          {
            value: "50+",
            label: "Weekly Live Classes",
            labelAr: "فصل مباشر أسبوعياً",
          },
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
        footerDescription:
          "The global leader in marine and technical education.",
        footerDescriptionAr: "الرائد العالمي في التعليم البحري والتقني.",
        seoTitle: "Marine Academy - Premier Marine Education Platform",
        seoTitleAr: "أكاديمية مارين - منصة التعليم البحري الرائدة",
        seoDescription:
          "Marine Academy offers comprehensive marine education with live classes, expert teachers, and interactive learning tools.",
        seoDescriptionAr:
          "تقدم أكاديمية مارين تعليماً بحرياً شاملاً مع فصول مباشرة ومعلمين خبراء وأدوات تعلم تفاعلية.",
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
      };

      // ✅ دمج القيم الافتراضية مع البيانات الجديدة (بدون updatedAt)
      return await ctx.db.insert("landingSettings", {
        ...defaults,
        ...data,
      });
    }
  },
});

// ══════════════════════════════════════════════════════════════════
// SECTIONS
// ══════════════════════════════════════════════════════════════════

// ✅ جلب جميع الأقسام (للأدمن)
export const getSections = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getAdminUser(ctx);

    const sections = await ctx.db.query("landingSections").collect();

    return sections.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ جلب الأقسام النشطة (للعرض العام)
export const getPublicSections = query({
  args: {},
  handler: async (ctx) => {
    const sections = await ctx.db.query("landingSections").collect();

    return sections
      .filter((s) => s.isEnabled)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ إنشاء قسم جديد
export const createSection = mutation({
  args: {
    slug: v.string(),
    displayOrder: v.number(),
    isEnabled: v.boolean(),
    title: v.optional(v.string()),
    titleAr: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    subtitleAr: v.optional(v.string()),
    body: v.optional(v.string()),
    bodyAr: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    ctaTextAr: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    features: v.optional(
      v.array(
        v.object({
          icon: v.string(),
          title: v.string(),
          titleAr: v.string(),
          desc: v.string(),
          descAr: v.string(),
        }),
      ),
    ),
    cards: v.optional(
      v.array(
        v.object({
          icon: v.string(),
          title: v.string(),
          titleAr: v.string(),
          desc: v.string(),
          descAr: v.string(),
        }),
      ),
    ),
    steps: v.optional(
      v.array(
        v.object({
          number: v.string(),
          title: v.string(),
          titleAr: v.string(),
          desc: v.string(),
          descAr: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    return await ctx.db.insert("landingSections", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ✅ تحديث قسم
export const updateSection = mutation({
  args: {
    sectionId: v.id("landingSections"),
    slug: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isEnabled: v.optional(v.boolean()),
    title: v.optional(v.string()),
    titleAr: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    subtitleAr: v.optional(v.string()),
    body: v.optional(v.string()),
    bodyAr: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    ctaTextAr: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    mediaUrl: v.optional(v.string()),
    mediaType: v.optional(v.union(v.literal("image"), v.literal("video"))),
    features: v.optional(
      v.array(
        v.object({
          icon: v.string(),
          title: v.string(),
          titleAr: v.string(),
          desc: v.string(),
          descAr: v.string(),
        }),
      ),
    ),
    cards: v.optional(
      v.array(
        v.object({
          icon: v.string(),
          title: v.string(),
          titleAr: v.string(),
          desc: v.string(),
          descAr: v.string(),
        }),
      ),
    ),
    steps: v.optional(
      v.array(
        v.object({
          number: v.string(),
          title: v.string(),
          titleAr: v.string(),
          desc: v.string(),
          descAr: v.string(),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);
    const { sectionId, ...fields } = args;

    const section = await ctx.db.get(sectionId);
    if (!section) throw new Error("القسم غير موجود");

    await ctx.db.patch(sectionId, {
      ...fields,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ حذف قسم
export const deleteSection = mutation({
  args: { sectionId: v.id("landingSections") },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    const section = await ctx.db.get(args.sectionId);
    if (!section) throw new Error("القسم غير موجود");

    await ctx.db.delete(args.sectionId);
    return { success: true };
  },
});

// ══════════════════════════════════════════════════════════════════
// COURSES
// ══════════════════════════════════════════════════════════════════

// ✅ جلب جميع الدورات (للأدمن)
export const getCourses = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getAdminUser(ctx);

    const courses = await ctx.db.query("landingCourses").collect();

    return courses.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ جلب الدورات المنشورة (للعرض العام)
export const getPublicCourses = query({
  args: { featured: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    const courses = await ctx.db.query("landingCourses").collect();

    let filtered = courses.filter((c) => c.isPublished);

    if (args.featured) {
      filtered = filtered.filter((c) => c.isFeatured);
    }

    return filtered.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ إنشاء دورة جديدة
export const createCourse = mutation({
  args: {
    title: v.string(),
    titleAr: v.string(),
    summary: v.string(),
    summaryAr: v.string(),
    instructor: v.string(),
    rating: v.number(),
    priceLabel: v.optional(v.string()),
    priceLabelAr: v.optional(v.string()),
    ctaText: v.string(),
    ctaTextAr: v.string(),
    ctaUrl: v.string(),
    imageUrl: v.string(),
    displayOrder: v.number(),
    isPublished: v.boolean(),
    isFeatured: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    return await ctx.db.insert("landingCourses", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ✅ تحديث دورة
export const updateCourse = mutation({
  args: {
    courseId: v.id("landingCourses"),
    title: v.optional(v.string()),
    titleAr: v.optional(v.string()),
    summary: v.optional(v.string()),
    summaryAr: v.optional(v.string()),
    instructor: v.optional(v.string()),
    rating: v.optional(v.number()),
    priceLabel: v.optional(v.string()),
    priceLabelAr: v.optional(v.string()),
    ctaText: v.optional(v.string()),
    ctaTextAr: v.optional(v.string()),
    ctaUrl: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
    isFeatured: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);
    const { courseId, ...fields } = args;

    const course = await ctx.db.get(courseId);
    if (!course) throw new Error("الدورة غير موجودة");

    await ctx.db.patch(courseId, {
      ...fields,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ حذف دورة
export const deleteCourse = mutation({
  args: { courseId: v.id("landingCourses") },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    const course = await ctx.db.get(args.courseId);
    if (!course) throw new Error("الدورة غير موجودة");

    await ctx.db.delete(args.courseId);
    return { success: true };
  },
});

// ══════════════════════════════════════════════════════════════════
// TESTIMONIALS
// ══════════════════════════════════════════════════════════════════

// ✅ جلب جميع التوصيات (للأدمن)
export const getTestimonials = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getAdminUser(ctx);

    const testimonials = await ctx.db.query("landingTestimonials").collect();

    return testimonials.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ جلب التوصيات المنشورة (للعرض العام)
export const getPublicTestimonials = query({
  args: {},
  handler: async (ctx) => {
    const testimonials = await ctx.db.query("landingTestimonials").collect();

    return testimonials
      .filter((t) => t.isPublished)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ إنشاء توصية جديدة
export const createTestimonial = mutation({
  args: {
    name: v.string(),
    nameAr: v.string(),
    role: v.string(),
    roleAr: v.string(),
    text: v.string(),
    textAr: v.string(),
    rating: v.number(),
    avatarUrl: v.optional(v.string()),
    displayOrder: v.number(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    return await ctx.db.insert("landingTestimonials", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ✅ تحديث توصية
export const updateTestimonial = mutation({
  args: {
    testimonialId: v.id("landingTestimonials"),
    name: v.optional(v.string()),
    nameAr: v.optional(v.string()),
    role: v.optional(v.string()),
    roleAr: v.optional(v.string()),
    text: v.optional(v.string()),
    textAr: v.optional(v.string()),
    rating: v.optional(v.number()),
    avatarUrl: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);
    const { testimonialId, ...fields } = args;

    const testimonial = await ctx.db.get(testimonialId);
    if (!testimonial) throw new Error("التوصية غير موجودة");

    await ctx.db.patch(testimonialId, {
      ...fields,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ حذف توصية
export const deleteTestimonial = mutation({
  args: { testimonialId: v.id("landingTestimonials") },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    const testimonial = await ctx.db.get(args.testimonialId);
    if (!testimonial) throw new Error("التوصية غير موجودة");

    await ctx.db.delete(args.testimonialId);
    return { success: true };
  },
});

// ══════════════════════════════════════════════════════════════════
// VIDEO TESTIMONIALS
// ══════════════════════════════════════════════════════════════════

// ✅ جلب جميع فيديوهات الشهادات (للأدمن)
export const getVideoTestimonials = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getAdminUser(ctx);

    const videos = await ctx.db.query("landingVideoTestimonials").collect();

    return videos.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ جلب فيديوهات الشهادات المنشورة (للعرض العام)
export const getPublicVideoTestimonials = query({
  args: {},
  handler: async (ctx) => {
    const videos = await ctx.db.query("landingVideoTestimonials").collect();

    return videos
      .filter((v) => v.isPublished)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ إنشاء فيديو شهادة جديد
export const createVideoTestimonial = mutation({
  args: {
    title: v.string(),
    titleAr: v.string(),
    description: v.string(),
    descriptionAr: v.string(),
    videoUrl: v.string(),
    thumbnailUrl: v.optional(v.string()),
    embedType: v.union(
      v.literal("youtube"),
      v.literal("vimeo"),
      v.literal("file"),
    ),
    displayOrder: v.number(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    return await ctx.db.insert("landingVideoTestimonials", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ✅ تحديث فيديو شهادة
export const updateVideoTestimonial = mutation({
  args: {
    videoId: v.id("landingVideoTestimonials"),
    title: v.optional(v.string()),
    titleAr: v.optional(v.string()),
    description: v.optional(v.string()),
    descriptionAr: v.optional(v.string()),
    videoUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    embedType: v.optional(
      v.union(v.literal("youtube"), v.literal("vimeo"), v.literal("file")),
    ),
    displayOrder: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);
    const { videoId, ...fields } = args;

    const video = await ctx.db.get(videoId);
    if (!video) throw new Error("الفيديو غير موجود");

    await ctx.db.patch(videoId, {
      ...fields,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ حذف فيديو شهادة
export const deleteVideoTestimonial = mutation({
  args: { videoId: v.id("landingVideoTestimonials") },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    const video = await ctx.db.get(args.videoId);
    if (!video) throw new Error("الفيديو غير موجود");

    await ctx.db.delete(args.videoId);
    return { success: true };
  },
});

// ══════════════════════════════════════════════════════════════════
// GALLERY
// ══════════════════════════════════════════════════════════════════

// ✅ جلب جميع معرض الصور (للأدمن)
export const getGallery = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getAdminUser(ctx);

    const gallery = await ctx.db.query("landingGallery").collect();

    return gallery.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ جلب معرض الصور المنشور (للعرض العام)
export const getPublicGallery = query({
  args: { category: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const items = await ctx.db.query("landingGallery").collect();

    let filtered = items.filter((item) => item.isPublished);

    if (args.category) {
      filtered = filtered.filter((item) => item.category === args.category);
    }

    return filtered.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ إنشاء عنصر معرض جديد
export const createGalleryItem = mutation({
  args: {
    title: v.string(),
    titleAr: v.string(),
    caption: v.string(),
    captionAr: v.string(),
    category: v.string(),
    imageUrl: v.string(),
    displayOrder: v.number(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    return await ctx.db.insert("landingGallery", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ✅ تحديث عنصر معرض
export const updateGalleryItem = mutation({
  args: {
    itemId: v.id("landingGallery"),
    title: v.optional(v.string()),
    titleAr: v.optional(v.string()),
    caption: v.optional(v.string()),
    captionAr: v.optional(v.string()),
    category: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);
    const { itemId, ...fields } = args;

    const item = await ctx.db.get(itemId);
    if (!item) throw new Error("العنصر غير موجود");

    await ctx.db.patch(itemId, {
      ...fields,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ حذف عنصر معرض
export const deleteGalleryItem = mutation({
  args: { itemId: v.id("landingGallery") },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("العنصر غير موجود");

    await ctx.db.delete(args.itemId);
    return { success: true };
  },
});

// ══════════════════════════════════════════════════════════════════
// ANNOUNCEMENTS
// ══════════════════════════════════════════════════════════════════

// ✅ جلب جميع الإعلانات (للأدمن)
export const getAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getAdminUser(ctx);

    const announcements = await ctx.db.query("landingAnnouncements").collect();

    return announcements.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ جلب الإعلانات المنشورة (للعرض العام)
export const getPublicAnnouncements = query({
  args: {},
  handler: async (ctx) => {
    const announcements = await ctx.db.query("landingAnnouncements").collect();

    return announcements
      .filter((a) => a.isPublished)
      .sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ إنشاء إعلان جديد
export const createAnnouncement = mutation({
  args: {
    title: v.string(),
    titleAr: v.string(),
    description: v.string(),
    descriptionAr: v.string(),
    points: v.array(v.string()),
    pointsAr: v.array(v.string()),
    imageUrl: v.string(),
    displayOrder: v.number(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    return await ctx.db.insert("landingAnnouncements", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ✅ تحديث إعلان
export const updateAnnouncement = mutation({
  args: {
    announcementId: v.id("landingAnnouncements"),
    title: v.optional(v.string()),
    titleAr: v.optional(v.string()),
    description: v.optional(v.string()),
    descriptionAr: v.optional(v.string()),
    points: v.optional(v.array(v.string())),
    pointsAr: v.optional(v.array(v.string())),
    imageUrl: v.optional(v.string()),
    displayOrder: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);
    const { announcementId, ...fields } = args;

    const announcement = await ctx.db.get(announcementId);
    if (!announcement) throw new Error("الإعلان غير موجود");

    await ctx.db.patch(announcementId, {
      ...fields,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ حذف إعلان
export const deleteAnnouncement = mutation({
  args: { announcementId: v.id("landingAnnouncements") },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) throw new Error("الإعلان غير موجود");

    await ctx.db.delete(args.announcementId);
    return { success: true };
  },
});

// convex/landing/landing.ts

// ══════════════════════════════════════════════════════════════════
// SUBSCRIPTIONS
// ══════════════════════════════════════════════════════════════════

// ✅ جلب جميع الاشتراكات (للأدمن)
export const getSubscriptions = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getAdminUser(ctx);

    const subscriptions = await ctx.db.query("subscriptions").collect();

    return subscriptions.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ جلب الاشتراكات المنشورة (للعرض العام)
export const getPublicSubscriptions = query({
  args: {
    grade: v.optional(
      v.union(v.literal("primary"), v.literal("middle"), v.literal("high")),
    ),
  },
  handler: async (ctx, args) => {
    let subscriptions = await ctx.db.query("subscriptions").collect();

    subscriptions = subscriptions.filter((s) => s.isPublished);

    if (args.grade) {
      subscriptions = subscriptions.filter((s) => s.grade === args.grade);
    }

    return subscriptions.sort((a, b) => a.displayOrder - b.displayOrder);
  },
});

// ✅ إنشاء اشتراك جديد
export const createSubscription = mutation({
  args: {
    title: v.string(),
    titleAr: v.string(),
    description: v.string(),
    descriptionAr: v.string(),
    type: v.union(
      v.literal("single"),
      v.literal("monthly"),
      v.literal("quarterly"),
      v.literal("yearly"),
    ),
    price: v.number(),
    priceAr: v.string(),
    sessionsCount: v.number(),
    grade: v.union(
      v.literal("primary"),
      v.literal("middle"),
      v.literal("high"),
    ),
    features: v.array(v.string()),
    featuresAr: v.array(v.string()),
    isPopular: v.boolean(),
    displayOrder: v.number(),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    return await ctx.db.insert("subscriptions", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

// ✅ تحديث اشتراك
export const updateSubscription = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    title: v.optional(v.string()),
    titleAr: v.optional(v.string()),
    description: v.optional(v.string()),
    descriptionAr: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal("single"),
        v.literal("monthly"),
        v.literal("quarterly"),
        v.literal("yearly"),
      ),
    ),
    price: v.optional(v.number()),
    priceAr: v.optional(v.string()),
    sessionsCount: v.optional(v.number()),
    grade: v.optional(
      v.union(v.literal("primary"), v.literal("middle"), v.literal("high")),
    ),
    features: v.optional(v.array(v.string())),
    featuresAr: v.optional(v.array(v.string())),
    isPopular: v.optional(v.boolean()),
    displayOrder: v.optional(v.number()),
    isPublished: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);
    const { subscriptionId, ...fields } = args;

    const subscription = await ctx.db.get(subscriptionId);
    if (!subscription) throw new Error("الاشتراك غير موجود");

    await ctx.db.patch(subscriptionId, {
      ...fields,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// ✅ حذف اشتراك
export const deleteSubscription = mutation({
  args: { subscriptionId: v.id("subscriptions") },
  handler: async (ctx, args) => {
    const admin = await getAdminUser(ctx);

    const subscription = await ctx.db.get(args.subscriptionId);
    if (!subscription) throw new Error("الاشتراك غير موجود");

    await ctx.db.delete(args.subscriptionId);
    return { success: true };
  },
});

// ══════════════════════════════════════════════════════════════════
// GET ALL DATA (للأدمن)
// ══════════════════════════════════════════════════════════════════

// ✅ جلب جميع بيانات Landing Page (للأدمن)
export const getLandingData = query({
  args: {},
  handler: async (ctx) => {
    const admin = await getAdminUser(ctx);

    const [settings, sections, courses, testimonials, gallery] =
      await Promise.all([
        ctx.db.query("landingSettings").first(),
        ctx.db
          .query("landingSections")
          .collect()
          .then((s) => s.sort((a, b) => a.displayOrder - b.displayOrder)),
        ctx.db
          .query("landingCourses")
          .collect()
          .then((c) => c.sort((a, b) => a.displayOrder - b.displayOrder)),
        ctx.db
          .query("landingTestimonials")
          .collect()
          .then((t) => t.sort((a, b) => a.displayOrder - b.displayOrder)),
        ctx.db
          .query("landingGallery")
          .collect()
          .then((g) => g.sort((a, b) => a.displayOrder - b.displayOrder)),
      ]);

    return {
      settings: settings || null,
      sections,
      courses,
      testimonials,
      gallery,
    };
  },
});

// ══════════════════════════════════════════════════════════════════
// EXPORTS
// ══════════════════════════════════════════════════════════════════

export const landing = {
  // Settings
  getSettings,
  getPublicSettings,
  updateSettings,

  // Sections
  getSections,
  getPublicSections,
  createSection,
  updateSection,
  deleteSection,

  // Announcements
  getAnnouncements,
  getPublicAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,

  // Courses
  getCourses,
  getPublicCourses,
  createCourse,
  updateCourse,
  deleteCourse,

  // Testimonials
  getTestimonials,
  getPublicTestimonials,
  createTestimonial,
  updateTestimonial,
  deleteTestimonial,

  // Video Testimonials
  getVideoTestimonials,
  getPublicVideoTestimonials,
  createVideoTestimonial,
  updateVideoTestimonial,
  deleteVideoTestimonial,

  // Gallery
  getGallery,
  getPublicGallery,
  createGalleryItem,
  updateGalleryItem,
  deleteGalleryItem,

  // All data
  getLandingData,
};
