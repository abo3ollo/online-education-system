"use client";

import { useState } from "react";
import {
  Upload,
  Trash2,
  Search,
  Filter,
  FileText,
  Image,
  Video,
  File,
  Copy,
  Check,
  X,
  ExternalLink,
  ClipboardList,
  Loader2,
  Grid3X3,
  List,
  FolderOpen,
  HardDrive,
  Calendar,
  Music,
  FileArchive,
  MoreVertical,
  Play,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { BsYoutube } from "react-icons/bs";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

// ─── Helpers ────────────────────────────────────────────────────
function formatBytes(bytes?: number) {
  if (!bytes || bytes === 0) return "0 KB";
  const kb = bytes / 1024;
  return `${kb.toFixed(1)} KB`;
}

function formatDate(ts?: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

function getYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function getYouTubeThumbnail(url: string): string | null {
  const videoId = getYouTubeVideoId(url);
  if (videoId) {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  }
  return null;
}

function FileIcon({ file, className }: { file: any; className?: string }) {
  const cls = className || "h-12 w-12 mx-auto mb-3";
  
  if (file.type === "youtube") {
    const thumbnailUrl = getYouTubeThumbnail(file.url);
    if (thumbnailUrl) {
      return (
        <div className="relative w-full h-full">
          <img 
            src={thumbnailUrl}
            alt={file.name}
            className="w-full h-full object-cover rounded-lg"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
      );
    }
    return <BsYoutube className={`${cls} text-red-500`} />;
  }
  
  if (file.type === "image") return <Image className={`${cls} text-blue-400`} />;
  if (file.type === "video") return <Video className={`${cls} text-purple-400`} />;
  if (file.type === "pdf") return <FileText className={`${cls} text-red-400`} />;
  if (file.type === "audio") return <Music className={`${cls} text-green-400`} />;
  if (file.type === "link") return <Link2 className={`${cls} text-gray-400`} />;
  return <File className={`${cls} text-gray-400`} />;
}

// ─── File Detail Modal ───────────────────────────────────────────
function FileModal({
  file,
  onClose,
  onDelete,
}: {
  file: any;
  onClose: () => void;
  onDelete: (id: Id<"mediaFiles">) => void;
}) {
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(file.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    if (!confirm("هل أنت متأكد من حذف هذا الملف؟")) return;
    setDeleting(true);
    try {
      await onDelete(file._id);
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  const rows = [
    { label: "اسم الملف", value: file.name },
    { label: "النوع", value: file.type === "youtube" ? "يوتيوب" : file.type === "image" ? "صورة" : file.type === "video" ? "فيديو" : file.type === "link" ? "رابط" : file.type },
    { label: "الحجم", value: formatBytes(file.size) },
    { label: "السياق", value: file.context ?? "عام" },
    { label: "تاريخ الرفع", value: formatDate(file.uploadedAt) },
  ];

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = getYouTubeVideoId(url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    return null;
  };

  const embedUrl = file.type === "youtube" ? getYouTubeEmbedUrl(file.url) : null;
  const thumbnailUrl = file.type === "youtube" ? getYouTubeThumbnail(file.url) : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="bg-linear-to-r from-[#001f24] to-[#03363d] px-6 py-4 flex items-center justify-between">
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
            <X className="h-5 w-5 text-white" />
          </button>
          <h2 className="text-lg font-bold text-white">{file.name}</h2>
        </div>

        <div className="grid grid-cols-2">
          <div className="p-6 divide-y divide-gray-100">
            {rows.map((row) => (
              <div key={row.label} className="flex items-center justify-between py-3">
                <span className="text-sm font-semibold text-[#001f24]">{row.label}</span>
                <span className="text-sm text-gray-500">{row.value}</span>
              </div>
            ))}

            <div className="py-3">
              <p className="text-sm font-semibold text-[#001f24] mb-2">الرابط</p>
              <div className="bg-[#f7fafa] border border-[#c0c8c9] rounded-lg px-3 py-2 text-xs text-gray-500 font-mono truncate">
                {file.url}
              </div>
            </div>

            <div className="py-3">
              <p className="text-sm font-semibold text-[#001f24] mb-1">الاستخدام</p>
              <p className="text-sm text-gray-500">
                {file.usedIn?.length === 0 ? "غير مستخدم" : `${file.usedIn?.length} تعيين`}
              </p>
            </div>
          </div>

          <div className="bg-[#f7fafa] flex flex-col items-center justify-center p-8 border-r border-[#c0c8c9]">
            {file.type === "youtube" && embedUrl && thumbnailUrl ? (
              <div className="w-full">
                {showVideo ? (
                  <iframe
                    src={embedUrl}
                    title={file.name}
                    className="w-full aspect-video rounded-lg"
                    allowFullScreen
                  />
                ) : (
                  <div 
                    className="relative w-full aspect-video rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => setShowVideo(true)}
                  >
                    <img
                      src={thumbnailUrl}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors">
                      <div className="w-14 h-14 rounded-full bg-red-600 flex items-center justify-center">
                        <Play className="h-6 w-6 text-white mr-1" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-32 h-32 bg-white rounded-xl border border-[#c0c8c9] flex flex-col items-center justify-center shadow-sm">
                <FileIcon file={file} className="h-14 w-14 mb-2" />
                <p className="text-xs text-gray-400 text-center truncate w-full px-2">{file.name}</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#c0c8c9] bg-[#f7fafa]" dir="rtl">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex items-center gap-2 border border-red-200 text-red-600 hover:bg-red-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            حذف
          </button>
          <Link href={`/admin/media/assign?fileId=${file._id}`}>
            <button className="flex items-center gap-2 bg-[#1a7a8a] hover:bg-[#001f24] text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
              <ExternalLink className="h-4 w-4" /> تعيين
            </button>
          </Link>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 border border-[#c0c8c9] text-gray-700 hover:bg-gray-100 text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            نسخ الرابط
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── YouTube Modal ───────────────────────────────────────────────
function YoutubeModal({ onClose }: { onClose: () => void }) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const addYoutube = useMutation(api.media.mediafiles.addYoutubeFile);

  const handleAdd = async () => {
    if (!url.trim()) return;
    if (!title.trim()) {
      alert("يرجى إدخال عنوان الفيديو");
      return;
    }
    setLoading(true);
    try {
      await addYoutube({ 
        url: url.trim(), 
        title: title.trim(),
        context: "general" 
      });
      onClose();
    } catch (err) {
      alert("حدث خطأ أثناء إضافة الفيديو");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-5">
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
          <h2 className="text-lg font-bold text-[#001f24]">إضافة فيديو يوتيوب</h2>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          عنوان الفيديو <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="أدخل عنوان الفيديو"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full border border-[#c0c8c9] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] focus:border-transparent mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 mb-2">
          رابط يوتيوب <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          placeholder="https://youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border border-[#c0c8c9] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] focus:border-transparent"
        />

        <div className="flex gap-3 mt-5 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleAdd}
            disabled={loading || !url.trim() || !title.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-[#001f24] hover:bg-[#03363d] text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            إضافة
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Link Modal ──────────────────────────────────────────────
function AddLinkModal({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState<"image" | "video" | "pdf" | "link">("link");
  const [loading, setLoading] = useState(false);
  const createFile = useMutation(api.media.mediafiles.createMediaFileFromUrl);

  const handleAdd = async () => {
    if (!name.trim()) {
      alert("يرجى إدخال عنوان الملف");
      return;
    }
    if (!url.trim()) {
      alert("يرجى إدخال الرابط");
      return;
    }

    setLoading(true);
    try {
      await createFile({
        name: name.trim(),
        url: url.trim(),
        type: type,
        context: "general",
      });
      onClose();
      window.location.reload();
    } catch (err: any) {
      alert(err.message || "حدث خطأ أثناء إضافة الملف");
    } finally {
      setLoading(false);
    }
  };

  const typeOptions = [
    { value: "link", label: "🔗 رابط عام", desc: "أي رابط" },
    { value: "image", label: "🖼️ صورة", desc: "صورة" },
    { value: "video", label: "🎬 فيديو", desc: "فيديو" },
    { value: "pdf", label: "📄 PDF", desc: "ملف PDF" },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        <div className="flex items-center justify-between mb-5">
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg">
            <X className="h-5 w-5 text-gray-400" />
          </button>
          <h2 className="text-lg font-bold text-[#001f24]">➕ إضافة ملف برابط</h2>
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-2">نوع الملف</label>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {typeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setType(opt.value as any)}
              className={`p-2 rounded-lg border-2 text-sm transition-all text-right ${
                type === opt.value
                  ? "border-[#1a7a8a] bg-[#e0f5f7] text-[#1a7a8a]"
                  : "border-gray-200 hover:border-gray-300 text-gray-600"
              }`}
            >
              <div className="font-medium">{opt.label}</div>
              <div className="text-xs text-gray-400">{opt.desc}</div>
            </button>
          ))}
        </div>

        <label className="block text-sm font-medium text-gray-700 mb-2">
          اسم الملف <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          placeholder="مثال: شرح الدرس الأول"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-[#c0c8c9] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] focus:border-transparent mb-4"
        />

        <label className="block text-sm font-medium text-gray-700 mb-2">
          رابط الملف <span className="text-red-500">*</span>
        </label>
        <input
          type="url"
          placeholder="https://drive.google.com/file/d/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="w-full border border-[#c0c8c9] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] focus:border-transparent"
        />
        <p className="text-xs text-gray-400 mt-1">
          ⚠️ تأكد من أن الرابط عام (Anyone with the link can view)
        </p>

        <div className="flex gap-3 mt-5 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
          >
            إلغاء
          </button>
          <button
            onClick={handleAdd}
            disabled={loading || !name.trim() || !url.trim()}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-[#001f24] hover:bg-[#03363d] text-white rounded-xl transition-colors disabled:opacity-50"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            إضافة
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function MediaDashboard() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [contextFilter, setContextFilter] = useState("all");
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [showYoutube, setShowYoutube] = useState(false);
  const [showAddLink, setShowAddLink] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const files = useQuery(api.media.mediafiles.listMediaFiles, {
    type: typeFilter !== "all" ? (typeFilter as any) : undefined,
    context: contextFilter !== "all" ? contextFilter : undefined,
    search: search || undefined,
  });

  const deleteFile = useMutation(api.media.mediafiles.deleteMediaFile);

  const isLoading = files === undefined;
  const filtered = files ?? [];

  const stats = {
    total: filtered.length,
    images: filtered.filter((f) => f.type === "image").length,
    videos: filtered.filter((f) => f.type === "video" || f.type === "youtube").length,
    links: filtered.filter((f) => f.type === "link").length,
    others: filtered.filter((f) => f.type !== "image" && f.type !== "video" && f.type !== "youtube" && f.type !== "link").length,
  };

  const handleDelete = async (fileId: Id<"mediaFiles">) => {
    await deleteFile({ fileId });
  };

  const getSafeThumbnail = (url: string): string | null => {
    return getYouTubeThumbnail(url);
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <div className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FolderOpen className="h-5 w-5" /> معرض الوسائط
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">إدارة الملفات والروابط</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-white/20">
              <Trash2 className="h-4 w-4" /> تنظيف غير المستخدم
            </button> */}
            <button
              onClick={() => setShowYoutube(true)}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-white/20"
            >
              <BsYoutube className="h-4 w-4" /> إضافة يوتيوب
            </button>
            <button
              onClick={() => setShowAddLink(true)}
              className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors border border-white/20"
            >
              <Link2 className="h-4 w-4" /> إضافة رابط
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{stats.total}</p>
                <p className="text-xs text-gray-500">إجمالي الوسائط</p>
              </div>
              <FolderOpen className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{stats.images}</p>
                <p className="text-xs text-gray-500">صور</p>
              </div>
              <Image className="h-8 w-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{stats.videos + stats.links}</p>
                <p className="text-xs text-gray-500">فيديو / روابط</p>
              </div>
              <Video className="h-8 w-8 text-purple-400" />
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#c0c8c9]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-[#001f24]">{stats.others}</p>
                <p className="text-xs text-gray-500">ملفات أخرى</p>
              </div>
              <HardDrive className="h-8 w-8 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-50">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث باسم الملف..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full border border-gray-200 rounded-lg pr-9 pl-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
              />
            </div>

            {/* <select
              value={contextFilter}
              onChange={(e) => setContextFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
            >
              <option value="all">جميع السياقات</option>
              <option value="general">عام</option>
              <option value="classroom">الفصل الدراسي</option>
            </select> */}

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border border-gray-200 rounded-lg px-4 py-2 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
            >
              <option value="all">جميع الأنواع</option>
              <option value="image">صورة</option>
              <option value="video">فيديو</option>
              <option value="youtube">يوتيوب</option>
              <option value="pdf">PDF</option>
              <option value="link">رابط</option>
            </select>

            <button className="flex items-center gap-2 bg-[#001f24] hover:bg-[#03363d] text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors">
              <Filter className="h-4 w-4" /> تصفية
            </button>

            <div className="flex gap-1 border border-gray-200 rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-[#1a7a8a] text-white" : "text-gray-400 hover:bg-gray-100"}`}
              >
                <Grid3X3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[#1a7a8a] text-white" : "text-gray-400 hover:bg-gray-100"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>

            <Link href="/admin/media/assignments" className="mr-auto">
              <button className="flex items-center gap-2 border border-[#1a7a8a] text-[#1a7a8a] hover:bg-[#e0f5f7] text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                <ClipboardList className="h-4 w-4" /> التعيينات الحالية
              </button>
            </Link>
          </div>
        </div>

        {/* Count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">
            <span className="font-semibold text-[#001f24]">{isLoading ? "..." : filtered.length}</span> عنصر
          </p>
        </div>

        {/* Grid/List View */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-[#1a7a8a]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 bg-white rounded-xl border border-[#c0c8c9]">
            <File className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>لا توجد ملفات تطابق البحث</p>
            <div className="flex justify-center gap-3 mt-4">
              <button
                onClick={() => setShowAddLink(true)}
                className="bg-[#001f24] hover:bg-[#03363d] text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                <Link2 className="h-4 w-4 inline ml-2" />
                إضافة رابط
              </button>
              <button
                onClick={() => setShowYoutube(true)}
                className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors"
              >
                <BsYoutube className="h-4 w-4 inline ml-2" />
                إضافة يوتيوب
              </button>
            </div>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map((file) => {
              const thumbnail = file.type === "youtube" ? getSafeThumbnail(file.url) : null;
              return (
                <div
                  key={file._id}
                  onClick={() => setSelectedFile(file)}
                  className="bg-white border border-[#c0c8c9] rounded-xl overflow-hidden cursor-pointer hover:border-[#1a7a8a] hover:shadow-md transition-all group"
                >
                  {file.type === "youtube" ? (
                    <div className="relative w-full aspect-video bg-gray-900">
                      {thumbnail ? (
                        <>
                          <img
                            src={thumbnail}
                            alt={file.name}
                            className="w-full h-full object-cover group-hover:opacity-90 transition-opacity"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = "https://placehold.co/320x180/1a7a8a/white?text=YouTube";
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center">
                              <Play className="h-5 w-5 text-white mr-0.5" />
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BsYoutube className="h-12 w-12 text-red-500" />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-24 bg-[#f7fafa] group-hover:bg-[#e0f5f7] transition-colors">
                      <FileIcon file={file} className="h-14 w-14" />
                    </div>
                  )}
                  
                  <div className="p-3">
                    <p className="text-xs text-[#001f24] font-medium text-center truncate w-full">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-400 text-center mt-0.5">
                      {file.type === "youtube" ? "يوتيوب" : file.type === "link" ? "رابط" : formatBytes(file.size)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#f7fafa] border-b border-[#c0c8c9]">
                  <tr>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الملف</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">النوع</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">الحجم</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500">تاريخ الرفع</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((file) => {
                    const thumbnail = file.type === "youtube" ? getSafeThumbnail(file.url) : null;
                    return (
                      <tr key={file._id} className="hover:bg-[#f7fafa] cursor-pointer" onClick={() => setSelectedFile(file)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {file.type === "youtube" ? (
                              thumbnail ? (
                                <img 
                                  src={thumbnail} 
                                  alt={file.name}
                                  className="w-10 h-10 rounded object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <BsYoutube className="h-8 w-8 text-red-500" />
                              )
                            ) : (
                              <FileIcon file={file} className="h-8 w-8" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-[#001f24]">{file.name}</p>
                              {file.type === "youtube" && (
                                <p className="text-xs text-red-500">يوتيوب</p>
                              )}
                              {file.type === "link" && (
                                <p className="text-xs text-blue-500">رابط</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {file.type === "image" ? "صورة" : file.type === "youtube" ? "يوتيوب" : file.type === "video" ? "فيديو" : file.type === "link" ? "رابط" : file.type}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatBytes(file.size)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{formatDate(file.uploadedAt)}</td>
                        <td className="px-4 py-3">
                          <button className="p-1 hover:bg-gray-100 rounded-lg">
                            <MoreVertical className="h-4 w-4 text-gray-400" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedFile && (
        <FileModal
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
          onDelete={handleDelete}
        />
      )}
      {showYoutube && <YoutubeModal onClose={() => setShowYoutube(false)} />}
      {showAddLink && <AddLinkModal onClose={() => setShowAddLink(false)} />}
    </div>
  );
}