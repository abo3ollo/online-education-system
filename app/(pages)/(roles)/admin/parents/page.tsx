"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  UserPlus,
  Mail,
  Phone,
  Users,
  Download,
  Loader2,
  Filter,
  Briefcase,
  Building2,
  CheckCircle,
  XCircle,
  Link2,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AddParentModal } from "@/app/_components/AddParentModal";
import { LinkParentStudentModal } from "@/app/_components/LinkParentStudentModal";
import { EditParentModal } from "@/app/_components/EditParentModal";

export default function AdminParentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<any>(null);

  const parentsData = useQuery(api.user.parents.getParents, {
    status: selectedFilter !== "all" ? selectedFilter : undefined,
    search: searchQuery || undefined,
  });
  console.log(parentsData);

  const parentsStats = useQuery(api.user.parents.getParentsStats);
  const deleteParent = useMutation(api.user.parents.deleteParent);

  const parents = parentsData || [];
  const isLoading = parentsData === undefined;

  const activeCount = parents.filter((p: any) => p.status === "active").length;
  const totalStudentsLinked = parents.reduce((acc: number, p: any) => acc + (p.childrenCount || 0), 0);

  const stats = [
    {
      label: "إجمالي أولياء الأمور",
      value: parents.length,
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-500",
      trend: "+٠٪",
      up: true,
    },
    {
      label: "نشط",
      value: activeCount,
      icon: CheckCircle,
      iconBg: "bg-green-50",
      iconColor: "text-green-500",
      trend: `+${activeCount}`,
      up: true,
    },
    {
      label: "الطلاب المرتبطون",
      value: totalStudentsLinked,
      icon: Link2,
      iconBg: "bg-purple-50",
      iconColor: "text-purple-500",
      trend: `+${totalStudentsLinked}`,
      up: true,
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return { label: "نشط", className: "bg-green-50 text-green-700 border border-green-200" };
      case "inactive":
        return { label: "غير نشط", className: "bg-gray-50 text-gray-600 border border-gray-200" };
      default:
        return { label: "نشط", className: "bg-green-50 text-green-700 border border-green-200" };
    }
  };

  const handleDelete = async (parentId: string) => {
    if (!confirm("هل أنت متأكد من حذف ولي الأمر؟ لا يمكن التراجع عن هذا الإجراء.")) return;

    setDeletingId(parentId);
    try {
      await deleteParent({ parentId: parentId as any });
    } catch (error: any) {
      console.error("خطأ في حذف ولي الأمر:", error);
      alert(error.message || "حدث خطأ أثناء حذف ولي الأمر.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditParent = (parent: any) => {
    setSelectedParent(parent);
    setIsEditModalOpen(true);
  };

  const handleLinkParents = (parentId: string) => {
    setSelectedParentId(parentId);
    setIsLinkModalOpen(true);
  };

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const exportData = parents.map((parent: any) => ({
        "المعرف": parent.parentId || parent._id.slice(-6),
        "الاسم": parent.name,
        "البريد الإلكتروني": parent.email,
        "الهاتف": parent.phoneNumber || "",
        "المسمى الوظيفي": parent.jobTitle || "",
        "عنوان العمل": parent.workAddress || "",
        "الحالة": parent.status === "active" ? "نشط" : "غير نشط",
        "عدد الطلاب المرتبطين": parent.childrenCount || 0,
        "تاريخ التسجيل": new Date(parent.createdAt).toLocaleDateString("ar-EG"),
      }));

      const headers = Object.keys(exportData[0] || {});
      const csvRows = [
        headers.join(","),
        ...exportData.map(row =>
          headers.map(header => {
            const value = row[header as keyof typeof row];
            if (typeof value === "string" && (value.includes(",") || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          }).join(",")
        ),
      ];

      const csvContent = csvRows.join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `اولياء_الامور_${new Date().toISOString().slice(0, 19)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("خطأ في تصدير البيانات:", error);
      alert("فشل تصدير البيانات");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* الشريط العلوي */}
      <header className="bg-white border-b border-gray-300 px-8 py-4 flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-xl font-semibold text-[#001f24]">أولياء الأمور</h1>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 border-gray-300 text-gray-600 hover:bg-gray-50"
            onClick={handleExportCSV}
            disabled={isExporting || parents.length === 0}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? "جاري التصدير..." : "تصدير CSV"}
          </Button>
          <Button
            onClick={() => setIsAddModalOpen(true)}
            className="gap-2 bg-[#001f24] hover:bg-[#03363d] text-white"
          >
            <Plus className="h-4 w-4" />
            إضافة ولي أمر
          </Button>
        </div>
      </header>

      <div className="p-8 max-w-7xl mx-auto space-y-6">
        {/* عنوان الصفحة */}
        <div>
          <h2 className="text-2xl font-bold text-[#001f24]">إدارة أولياء الأمور</h2>
          <p className="text-gray-500 mt-1 text-sm">
            عرض وإضافة وإدارة جميع أولياء الأمور المسجلين وربطهم بالطلاب.
          </p>
        </div>

        {/* الإحصائيات */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className="bg-white rounded-xl p-5 border border-gray-300 hover:border-gray-400 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-11 h-11 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stat.up ? "text-green-600" : "text-red-500"
                    }`}>
                    {stat.trend} {stat.up ? "↗" : "↘"}
                  </span>
                </div>
                <p className="text-3xl font-bold text-[#001f24]">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-1 font-medium">{stat.label}</p>
              </div>
            );
          })}
        </div>

        {/* البحث والفلاتر */}
        <div className="bg-white rounded-xl border border-gray-300 p-4 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث بالاسم أو البريد الإلكتروني أو رقم الهاتف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 border-gray-300 focus-visible:ring-[#03363d]/20"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-[#03363d]/20 bg-white"
            >
              <option value="all">جميع أولياء الأمور</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
            </select>
            <Button
              variant="outline"
              size="icon"
              onClick={() => { setSelectedFilter("all"); setSearchQuery(""); }}
              className="border-gray-200 text-gray-500 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* الجدول */}
        <div className="bg-white rounded-xl border border-gray-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-300 bg-[#f7fafa]">
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">ولي الأمر</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">معلومات الاتصال</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">المسمى الوظيفي</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">الطلاب</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">الحالة</th>
                  <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#001f24]" />
                    </td>
                  </tr>
                ) : parents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                          <Users className="h-8 w-8 text-blue-400" />
                        </div>
                        <p className="text-gray-500 font-medium">لا يوجد أولياء أمور</p>
                        <Button
                          size="sm"
                          onClick={() => setIsAddModalOpen(true)}
                          className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
                        >
                          <Plus className="h-4 w-4" />
                          إضافة ولي أمر
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  parents.map((parent: any) => {
                    const statusBadge = getStatusBadge(parent.status);
                    return (
                      <tr key={parent._id} className="hover:bg-[#f7fafa] transition-colors">
                        {/* ولي الأمر */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                              <span className="text-blue-600 font-bold text-sm">
                                {parent.name?.charAt(0)?.toUpperCase() || "?"}
                              </span>
                            </div>
                            <div>
                              <p className="font-semibold text-[#001f24] text-sm">{parent.name}</p>
                              <p className="text-xs text-gray-400 font-mono">
                                #{parent.parentId || parent._id.slice(-6).toUpperCase()}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* معلومات الاتصال */}
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600 flex items-center gap-1.5">
                              <Mail className="h-3.5 w-3.5 text-gray-400" />
                              {parent.email}
                            </p>
                            {parent.phoneNumber && (
                              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                                <Phone className="h-3.5 w-3.5 text-gray-400" />
                                {parent.phoneNumber}
                              </p>
                            )}
                          </div>
                        </td>

                        {/* المسمى الوظيفي */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600">
                              {parent.jobTitle || "—"}
                            </span>
                          </div>
                          {parent.workAddress && (
                            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {parent.workAddress.length > 30 ? parent.workAddress.slice(0, 30) + "..." : parent.workAddress}
                            </p>
                          )}
                        </td>

                        {/* عدد الطلاب */}
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleLinkParents(parent._id)}
                            className="flex items-center gap-1.5 text-[#1a7a8a] hover:text-[#001f24] transition-colors group"
                          >
                            <Users className="h-4 w-4" />
                            <span className="text-sm font-semibold">{parent.childrenCount || 0}</span>
                            <span className="text-xs text-gray-400 group-hover:text-gray-500">طالب</span>
                          </button>
                        </td>

                        {/* الحالة */}
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${statusBadge.className}`}>
                            {statusBadge.label}
                          </span>
                        </td>

                        {/* الإجراءات */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleEditParent(parent)}
                                className="p-2 hover:bg-blue-50 rounded-lg transition-colors group"
                              >
                                <Edit className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                              </button>           
                            <button
                              className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                              onClick={() => handleDelete(parent._id)}
                              disabled={deletingId === parent._id}
                            >
                              {deletingId === parent._id ? (
                                <Loader2 className="h-4 w-4 animate-spin text-red-400" />
                              ) : (
                                <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* تذييل الجدول */}
          {parents.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-50 bg-[#f7fafa]">
              <p className="text-xs text-gray-400 text-right">
                عرض <span className="font-semibold text-[#001f24]">{parents.length}</span> من {" "}
                <span className="font-semibold text-[#001f24]">{parents.length}</span> ولي أمر
              </p>
            </div>
          )}
        </div>
      </div>

      {/* النوافذ المنبثقة */}
      <AddParentModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      <EditParentModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedParent(null);
        }}
        parentData={selectedParent}
        onSuccess={() => {
          // يمكنك إعادة تحميل البيانات هنا
          // router.refresh();
        }}
      />
      <LinkParentStudentModal
        isOpen={isLinkModalOpen}
        onClose={() => {
          setIsLinkModalOpen(false);
          setSelectedParentId(null);
        }}
        parentId={selectedParentId}
      />
    </div>
  );
}