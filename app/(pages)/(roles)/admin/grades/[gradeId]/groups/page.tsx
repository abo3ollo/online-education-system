// app/(pages)/(roles)/admin/grades/[gradeId]/groups/page.tsx

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Plus,
  Search,
  Loader2,
  Users,
  BookOpen,
  Calendar,
  Eye,
  Layers,
  Trash2,
  Edit,
  UserPlus,
  Clock,
} from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function GroupCard({
  group,
  onDelete,
  isDeleting,
  gradeId,
}: {
  group: any;
  onDelete: (id: string) => void;
  isDeleting: boolean;
  gradeId: string;
}) {
  return (
    <Card className="hover:shadow-md transition-shadow relative">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{group.name}</CardTitle>
            <p className="text-sm text-gray-500">{group.nameEn}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                group.status === "active"
                  ? "bg-green-100 text-green-700"
                  : group.status === "completed"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-700"
              }
            >
              {group.status === "active"
                ? "نشط"
                : group.status === "completed"
                  ? "مكتمل"
                  : "غير نشط"}
            </Badge>
            {/* ✅ زر حذف المجموعة */}
            <button
              onClick={() => onDelete(group._id)}
              disabled={isDeleting}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
              title="حذف المجموعة"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BookOpen className="h-4 w-4 text-[#1a7a8a]" />
            <span>المادة: {group.subject}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4 text-[#1a7a8a]" />
            <span>{group.students?.length || 0} / {group.maxStudents} طالب</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4 text-[#1a7a8a]" />
            <span>المشرف: {group.supervisorName || "غير محدد"}</span>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <Link href={`/admin/grades/${gradeId}/groups/${group._id}/schedule`} className="flex-1">
              <Button size="sm" variant="outline" className="w-full gap-1">
                <Calendar className="h-4 w-4" />
                الجدول
              </Button>
            </Link>
            <Link href={`/admin/grades/${gradeId}/groups/${group._id}`} className="flex-1">
              <Button size="sm" variant="outline" className="w-full gap-1">
                <Users className="h-4 w-4" />
                الطلاب
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GradeGroupsPage() {
  const params = useParams();
  const router = useRouter();
  const gradeId = params.gradeId as string;

  const [searchQuery, setSearchQuery] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState({
    name: "",
    nameEn: "",
    subject: "",
    maxStudents: 30,
    supervisorId: "",
    location: "",
  });

  // جلب بيانات الصف
  const grade = useQuery(
    api.grades.grades.getGradeById,
    gradeId ? { gradeId: gradeId as any } : "skip"
  );

  // جلب المجموعات
  const groups = useQuery(
    api.groups.groups.getGroups,
    {
      gradeId: gradeId as any,
      search: searchQuery || undefined,
    }
  );

  // جلب المعلمين المتاحين
  const teachers = useQuery(
    api.user.teachers.getTeachers,
    {}
  );

  const createGroup = useMutation(api.groups.groups.createGroup);
  const deleteGroup = useMutation(api.groups.groups.deleteGroup);

  if (grade === undefined || groups === undefined || teachers === undefined) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  if (!grade) {
    return (
      <div className="container mx-auto p-6" dir="rtl">
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold text-gray-700 mb-2">الصف غير موجود</h2>
          <Link href="/admin/grades">
            <Button className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white">
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة للصفوف
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.nameEn || !newGroup.subject) {
      alert("يرجى ملء جميع الحقول المطلوبة");
      return;
    }

    try {
      await createGroup({
        name: newGroup.name,
        nameEn: newGroup.nameEn,
        gradeId: gradeId as any,
        subject: newGroup.subject,
        maxStudents: newGroup.maxStudents,
        supervisorId: newGroup.supervisorId ? newGroup.supervisorId as any : undefined,
        location: newGroup.location || undefined,
      });

      setIsAddModalOpen(false);
      setNewGroup({
        name: "",
        nameEn: "",
        subject: "",
        maxStudents: 30,
        supervisorId: "",
        location: "",
      });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء إنشاء المجموعة");
    }
  };

  // ✅ دالة حذف المجموعة
  const handleDeleteGroup = async (groupId: string) => {
    const groupToDelete = groups.find((g: any) => g._id === groupId);
    if (!groupToDelete) return;

    const hasStudents = groupToDelete.students && groupToDelete.students.length > 0;

    if (!confirm(
      `هل أنت متأكد من حذف المجموعة "${groupToDelete.name}"؟\n${hasStudents
        ? `⚠️ تحتوي المجموعة على ${groupToDelete.students.length} طالب. سيتم إزالتهم من المجموعة قبل الحذف.`
        : ""
      }\nلا يمكن التراجع عن هذا الإجراء.`
    )) return;

    setIsDeleting(groupId);
    try {
      await deleteGroup({ groupId: groupId as any });
    } catch (error: any) {
      alert(error.message || "حدث خطأ أثناء حذف المجموعة");
    } finally {
      setIsDeleting(null);
    }
  };

  const stats = {
    total: groups.length,
    active: groups.filter((g: any) => g.status === "active").length,
    students: groups.reduce((acc: number, g: any) => acc + (g.students?.length || 0), 0),
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6" dir="rtl">
      {/* Back Button */}
      <Link href="/admin/grades">
        <Button variant="ghost" className="gap-2">
          <ArrowRight className="h-4 w-4" />
          العودة للصفوف
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#001f24]">
            مجموعات {grade.name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            إدارة المجموعات التابعة للصف {grade.name}
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
        >
          <Plus className="h-4 w-4" />
          إضافة مجموعة
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">إجمالي المجموعات</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <Layers className="h-8 w-8 text-[#1a7a8a]" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">مجموعات نشطة</p>
              <p className="text-2xl font-bold text-green-500">{stats.active}</p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">إجمالي الطلاب</p>
              <p className="text-2xl font-bold text-[#1a7a8a]">{stats.students}</p>
            </div>
            <Users className="h-8 w-8 text-[#1a7a8a]" />
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="بحث عن مجموعة..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pr-10"
        />
      </div>

      {/* Groups Grid */}
      {groups.length === 0 ? (
        <Card className="p-12 text-center">
          <Layers className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-600">لا توجد مجموعات</h3>
          <p className="text-gray-400">
            {searchQuery ? "لا توجد نتائج تطابق بحثك" : "قم بإضافة مجموعة جديدة"}
          </p>
          {!searchQuery && (
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 bg-[#001f24] hover:bg-[#03363d] text-white"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة مجموعة
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group: any) => (
            <GroupCard
              key={group._id}
              group={group}
              gradeId={gradeId}
              onDelete={handleDeleteGroup}
              isDeleting={isDeleting === group._id}
            />
          ))}
        </div>
      )}

      {/* Add Group Dialog */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-[#001f24]">
              <Plus className="h-5 w-5 inline ml-2" />
              إضافة مجموعة جديدة
            </DialogTitle>
            <p className="text-sm text-gray-500">
              إنشاء مجموعة جديدة في صف {grade.name}
            </p>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>اسم المجموعة (عربي) <span className="text-red-500">*</span></Label>
              <Input
                value={newGroup.name}
                onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                placeholder="مثال: مجموعة عربي 1"
              />
            </div>

            <div className="space-y-2">
              <Label>اسم المجموعة (إنجليزي) <span className="text-red-500">*</span></Label>
              <Input
                value={newGroup.nameEn}
                onChange={(e) => setNewGroup({ ...newGroup, nameEn: e.target.value })}
                placeholder="مثال: Arabic Group 1"
              />
            </div>

            <div className="space-y-2">
              <Label>المادة <span className="text-red-500">*</span></Label>
              <Input
                value={newGroup.subject}
                onChange={(e) => setNewGroup({ ...newGroup, subject: e.target.value })}
                placeholder="مثال: اللغة العربية"
              />
            </div>

            <div className="space-y-2">
              <Label>الحد الأقصى للطلاب</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={newGroup.maxStudents}
                onChange={(e) => setNewGroup({ ...newGroup, maxStudents: parseInt(e.target.value) || 30 })}
              />
            </div>

            <div className="space-y-2">
              <Label>المشرف</Label>
              <Select
                value={newGroup.supervisorId}
                onValueChange={(value: string | null) => {
                  setNewGroup({ ...newGroup, supervisorId: value || "" });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المشرف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">غير محدد</SelectItem>
                  {teachers?.map((teacher: any) => (
                    <SelectItem key={teacher._id} value={teacher._id}>
                      {teacher.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>الموقع</Label>
              <Input
                value={newGroup.location}
                onChange={(e) => setNewGroup({ ...newGroup, location: e.target.value })}
                placeholder="مثال: الطابق الأول - غرفة 3"
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              إلغاء
            </Button>
            <Button
              onClick={handleCreateGroup}
              className="bg-[#001f24] hover:bg-[#03363d] text-white"
            >
              <Plus className="h-4 w-4 ml-2" />
              إنشاء المجموعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}