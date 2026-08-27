"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Edit, Trash2, Check, X, Loader2, Calendar, Users, FileText, Clock, Eye } from "lucide-react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

const PAGE_SIZE_OPTIONS = [10, 25, 50];

export default function CurrentAssignmentsPage() {
  const [search, setSearch]     = useState("");
  const [pageSize, setPageSize] = useState(25);
  const [page, setPage]         = useState(1);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [targetNames, setTargetNames] = useState<Record<string, string>>({});

  const assignments = useQuery(api.media.mediaassignments.listMediaAssignments, {
    search: search || undefined,
  });
  console.log(assignments);

  // ✅ جلب بيانات الطلاب والمجموعات والصفوف
  const students = useQuery(api.user.students.getStudents, {});
  const groups = useQuery(api.groups.groups.getGroups, {});
  const grades = useQuery(api.grades.grades.getActiveGrades, {});

  const deleteAssignment = useMutation(api.media.mediaassignments.deleteMediaAssignment);
  const publishAssignment = useMutation(api.media.mediaassignments.publishMediaAssignment);

  const isLoading = assignments === undefined;
  const allRows   = assignments ?? [];

  // ✅ بناء خريطة الأسماء (students + groups + grades)
  useEffect(() => {
    if (students && groups && grades && assignments) {
      const nameMap: Record<string, string> = {};
      
      assignments.forEach((assignment: any) => {
        if (assignment.assignTo === "student") {
          const student = students.find((s: any) => s._id === assignment.targetId);
          nameMap[assignment._id] = student?.name || "طالب غير محدد";
        } else if (assignment.assignTo === "group") {
          const group = groups.find((g: any) => g._id === assignment.targetId);
          nameMap[assignment._id] = group?.name || "مجموعة غير محددة";
        } else if (assignment.assignTo === "grade") {
          const grade = grades.find((g: any) => g._id === assignment.targetId);
          nameMap[assignment._id] = grade?.name || "صف غير محدد";
        } else {
          nameMap[assignment._id] = assignment.targetId || "—";
        }
      });
      
      setTargetNames(nameMap);
    }
  }, [students, groups, grades, assignments]);

  const totalPages = Math.max(1, Math.ceil(allRows.length / pageSize));
  const paginated  = allRows.slice((page - 1) * pageSize, page * pageSize);

  const handleDelete = async (id: Id<"mediaAssignments">) => {
    if (!confirm("هل أنت متأكد من حذف هذا التعيين؟")) return;
    setDeletingId(id);
    try {
      await deleteAssignment({ assignmentId: id });
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublish = async (id: Id<"mediaAssignments">) => {
    await publishAssignment({ assignmentId: id });
  };

  const statusBadge = (s: string) => {
    if (s === "draft")     return <span className="bg-amber-100 text-amber-700 text-xs font-medium px-3 py-1 rounded-full">مسودة</span>;
    if (s === "published") return <span className="bg-green-100 text-green-700 text-xs font-medium px-3 py-1 rounded-full">منشور</span>;
    return null;
  };

  const availBadge = (a?: string) => (
    <span className="bg-teal-100 text-teal-700 text-xs font-medium px-3 py-1 rounded-full">
      {a === "media.always" ? "متاح دائماً" : "مجدول"}
    </span>
  );

  const typeBadge = (t: string) => {
    const types: Record<string, string> = {
      image: "صورة",
      video: "فيديو",
      youtube: "يوتيوب",
      pdf: "PDF",
      link: "رابط",
      student: "طالب",
      group: "مجموعة",
      grade: "صف",
    };
    return (
      <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
        {types[t] || t}
      </span>
    );
  };

  const getTargetLabel = (assignTo: string, assignmentId: string) => {
    const name = targetNames[assignmentId];
    if (assignTo === "student") return name || "طالب غير محدد";
    if (assignTo === "group") return name || "مجموعة غير محددة";
    if (assignTo === "grade") return name || "صف غير محدد";
    return "—";
  };

  const getTargetTypeLabel = (assignTo: string) => {
    if (assignTo === "student") return "طالب";
    if (assignTo === "group") return "مجموعة";
    if (assignTo === "grade") return "صف";
    return assignTo;
  };

  return (
    <div className="min-h-screen bg-[#f7fafa]" dir="rtl">
      {/* Header */}
      <div className="bg-linear-to-r from-[#001f24] to-[#03363d] px-8 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="h-5 w-5" /> التعيينات الحالية
            </h1>
            <p className="text-[#a3ced6] text-sm mt-0.5">إدارة تعيينات الوسائط للمحتوى التعليمي</p>
          </div>
          <Link href="/admin/media">
            <button className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm px-4 py-2 rounded-xl border border-white/20 transition-colors">
              <X className="h-4 w-4" /> رجوع
            </button>
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-5">
        {/* Toolbar */}
        <div className="flex items-center justify-between flex-wrap gap-4 bg-white rounded-xl border border-[#c0c8c9] px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">بحث:</span>
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="ابحث بالعنوان..."
              className="border border-[#c0c8c9] rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] w-64"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>عرض</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
              className="border border-[#c0c8c9] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
            >
              {PAGE_SIZE_OPTIONS.map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
            <span>سجل</span>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-[#c0c8c9] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#f7fafa] border-b border-[#c0c8c9]">
                <tr>
                  {["العنوان", "معين إلى", "النوع", "اسم الوسائط", "الحالة", "الإتاحة", "تاريخ الاستحقاق", "بواسطة", "الإجراءات"].map((h) => (
                    <th key={h} className="text-right px-5 py-3.5 text-xs font-semibold text-gray-500 whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-20 text-center">
                      <Loader2 className="h-8 w-8 animate-spin mx-auto text-[#1a7a8a]" />
                    </td>
                  </tr>
                ) : paginated.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <FileText className="h-12 w-12 text-gray-300" />
                        <p className="text-gray-500">لا توجد تعيينات</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginated.map((row: any) => {
                    const firstFile = row.mediaFiles?.[0];
                    const mediaName = firstFile?.name ?? "—";
                    const dueDate   = row.dueDate
                      ? new Date(row.dueDate).toLocaleString("ar-EG", {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—";

                    return (
                      <tr key={row._id} className="hover:bg-[#f7fafa] transition-colors">
                        {/* Title */}
                        <td className="px-5 py-4">
                          <p className="font-medium text-[#001f24]">{row.title}</p>
                        </td>

                        {/* Assigned to */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm text-gray-700 font-medium">
                              {getTargetLabel(row.assignTo, row._id)}
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1 capitalize">
                            {getTargetTypeLabel(row.assignTo)}
                          </p>
                        </td>

                        {/* Type */}
                        <td className="px-5 py-4">
                          {typeBadge(firstFile?.type ?? row.assignTo)}
                        </td>

                        {/* Media name */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <FileText className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm text-gray-800">{mediaName}</span>
                            {row.mediaFiles && row.mediaFiles.length > 1 && (
                              <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                +{row.mediaFiles.length - 1}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-5 py-4">
                          {statusBadge(row.status)}
                        </td>

                        {/* Availability */}
                        <td className="px-5 py-4">
                          {availBadge(row.availability)}
                        </td>

                        {/* Due date */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-sm text-gray-600 whitespace-nowrap">{dueDate}</span>
                          </div>
                        </td>

                        {/* Assigned by */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-[#e0f5f7] flex items-center justify-center">
                              <span className="text-[#1a7a8a] text-xs font-bold">
                                {row.assignerName?.charAt(0) || "A"}
                              </span>
                            </div>
                            <span className="text-sm text-gray-600">{row.assignerName || "—"}</span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handlePublish(row._id)}
                              disabled={row.status === "published"}
                              title="نشر"
                              className="w-8 h-8 rounded-lg bg-green-100 hover:bg-green-200 disabled:opacity-40 flex items-center justify-center transition-colors"
                            >
                              <Check className="h-4 w-4 text-green-600" />
                            </button>
                            <Link href={`/admin/media/assign?editId=${row._id}`}>
                              <button
                                title="تعديل"
                                className="w-8 h-8 rounded-lg bg-blue-100 hover:bg-blue-200 flex items-center justify-center transition-colors"
                              >
                                <Edit className="h-4 w-4 text-blue-600" />
                              </button>
                            </Link>
                            <button
                              onClick={() => handleDelete(row._id)}
                              disabled={deletingId === row._id}
                              title="حذف"
                              className="w-8 h-8 rounded-lg bg-red-100 hover:bg-red-200 disabled:opacity-50 flex items-center justify-center transition-colors"
                            >
                              {deletingId === row._id
                                ? <Loader2 className="h-4 w-4 text-red-600 animate-spin" />
                                : <Trash2 className="h-4 w-4 text-red-600" />
                              }
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

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-4 border-t border-[#c0c8c9] bg-[#f7fafa] flex-wrap gap-3">
            <p className="text-xs text-gray-500">
              {allRows.length === 0
                ? "لا توجد سجلات"
                : `عرض ${(page - 1) * pageSize + 1} إلى ${Math.min(page * pageSize, allRows.length)} من ${allRows.length} سجل`
              }
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#c0c8c9] hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="h-4 w-4 text-gray-600" />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum = page;
                if (totalPages <= 5) pageNum = i + 1;
                else if (page <= 3) pageNum = i + 1;
                else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                else pageNum = page - 2 + i;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? "bg-[#001f24] text-white"
                        : "border border-[#c0c8c9] hover:bg-white text-gray-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-[#c0c8c9] hover:bg-white disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="h-4 w-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}