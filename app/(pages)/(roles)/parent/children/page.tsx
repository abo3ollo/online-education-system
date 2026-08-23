// app/(pages)/(roles)/parent/children/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Loader2,
  AlertCircle,
  Check,
  Search,
  UserPlus,
  Users,
  Mail,
  ArrowRight,
  GraduationCap,
  Calendar,
  Phone,
  MapPin,
  User,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

export default function ParentChildrenPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    birthDate: "",
    gender: "",
    gradeId: "",
    groupId: "",
    address: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"list" | "existing" | "new">("list");

  // ── Queries ───────────────────────────────────────────────────
  const currentUser = useQuery(
    api.user.auth.getCurrentUser,
    isLoaded && user ? {} : "skip"
  );

  // ✅ استخدم api.user.parents.getParentChildren
  const children = useQuery(
    api.user.parents.getParentChildren,
    currentUser?._id ? { parentId: currentUser._id as any } : "skip"
  );

  const grades = useQuery(api.grades.grades.getActiveGrades);
  const groups = useQuery(
    api.groups.groups.getGroupsByGrade,
    formData.gradeId ? { gradeId: formData.gradeId as any } : "skip"
  );

  const availableStudents = useQuery(
    api.user.students.getStudentsWithoutParent,
    currentUser?.role === "parent" || currentUser?.role === "admin"
      ? { search: searchQuery || undefined }
      : "skip"
  );

  // ── Mutations ─────────────────────────────────────────────────
  const registerChild = useMutation(api.user.students.registerStudent);
  const linkParentToStudent = useMutation(api.relationships.parentStudent.linkParentToStudent);
  const removeChild = useMutation(api.relationships.parentStudent.removeChild);

  // ── Effects ───────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    if (!user) {
      router.replace("/sign-in");
      return;
    }
    // ✅ استخدام optional chaining للتحقق من currentUser
    if (currentUser !== undefined && currentUser !== null) {
      if (currentUser.role !== "parent" && currentUser.role !== "admin") {
        router.replace("/");
        return;
      }
    }
  }, [isLoaded, user, currentUser, router]);

  // ── Handlers ──────────────────────────────────────────────────
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "اسم الطفل مطلوب";
    if (!formData.email.trim()) {
      newErrors.email = "البريد الإلكتروني مطلوب";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "البريد الإلكتروني غير صحيح";
    }
    if (!formData.birthDate) newErrors.birthDate = "تاريخ الميلاد مطلوب";
    if (!formData.gender) newErrors.gender = "الجنس مطلوب";
    if (!formData.gradeId) newErrors.gradeId = "الصف الدراسي مطلوب";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegisterNew = async () => {
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const result = await registerChild({
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber || "",
        birthDate: new Date(formData.birthDate).getTime(),
        gender: formData.gender as "male" | "female",
        address: formData.address || undefined,
        gradeId: formData.gradeId as any,
        groupId: formData.groupId ? (formData.groupId as any) : undefined,
        parentId: currentUser?._id as any,
      });

      toast.success("✅ تم تسجيل الطفل بنجاح");
      setActiveTab("list");
      resetForm();

    } catch (error: any) {
      setErrors({ submit: error.message || "حدث خطأ أثناء تسجيل الطفل" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectExisting = async () => {
    if (!selectedStudentId) {
      setErrors({ submit: "يرجى اختيار طالب" });
      return;
    }
    setIsSubmitting(true);
    try {
      await linkParentToStudent({
        parentId: currentUser?._id as any,
        studentId: selectedStudentId as any,
        relationship: "guardian",
        isPrimary: true,
        permissions: {
          viewGrades: true,
          financialAccess: true,
          pickupNotification: false,
          emergencyContact: true,
        },
      });

      toast.success("✅ تم ربط الطالب بنجاح");
      setActiveTab("list");
      setSelectedStudentId(null);

    } catch (error: any) {
      setErrors({ submit: error.message || "حدث خطأ أثناء ربط الطالب" });
      setIsSubmitting(false);
    }
  };

  const handleRemoveChild = async (childId: string, childName: string) => {
    if (!confirm(`هل أنت متأكد من إزالة ${childName} من أبنائك؟`)) return;
    try {
      await removeChild({
        parentId: currentUser?._id as any,
        studentId: childId as any,
      });
      toast.success(`✅ تم إزالة ${childName} من أبنائك`);
    } catch (error: any) {
      toast.error(error.message || "حدث خطأ أثناء الإزالة");
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phoneNumber: "",
      birthDate: "",
      gender: "",
      gradeId: "",
      groupId: "",
      address: "",
    });
    setErrors({});
  };

  // ── Loading ──────────────────────────────────────────────────
  if (!isLoaded || currentUser === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7fafa]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1a7a8a]" />
      </div>
    );
  }

  // ✅ إذا كان المستخدم غير مسجل أو ليس ولي أمر
  if (!user || (currentUser?.role !== "parent" && currentUser?.role !== "admin")) {
    return null;
  }

  return (
    <div className="min-h-full bg-[#f7fafa] p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#001f24]">أبنائي</h1>
            <p className="text-sm text-gray-500 mt-0.5">إدارة أبنائك المسجلين في المنصة</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setActiveTab("new")}
              className="bg-[#001f24] hover:bg-[#03363d] text-white"
            >
              <UserPlus className="h-4 w-4 ml-2" />
              إضافة طفل
            </Button>
            <Button
              onClick={() => setActiveTab("existing")}
              variant="outline"
            >
              <Users className="h-4 w-4 ml-2" />
              ربط طالب موجود
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <TabsList className="grid grid-cols-3 mb-6">
            <TabsTrigger value="list">قائمة الأبناء</TabsTrigger>
            <TabsTrigger value="existing">ربط طالب موجود</TabsTrigger>
            <TabsTrigger value="new">تسجيل طفل جديد</TabsTrigger>
          </TabsList>

          {/* ── قائمة الأبناء ─────────────────────────────────────── */}
          <TabsContent value="list">
            <Card>
              <CardContent className="p-6">
                {children === undefined ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-[#1a7a8a]" />
                  </div>
                ) : children.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">لا يوجد أبناء مسجلين</p>
                    <p className="text-sm text-gray-400 mt-1">
                      يمكنك إضافة طفل جديد أو ربط طالب موجود
                    </p>
                    <div className="flex gap-3 justify-center mt-4">
                      <Button onClick={() => setActiveTab("new")} className="bg-[#001f24] text-white">
                        <UserPlus className="h-4 w-4 ml-2" />
                        إضافة طفل
                      </Button>
                      <Button onClick={() => setActiveTab("existing")} variant="outline">
                        <Users className="h-4 w-4 ml-2" />
                        ربط طالب موجود
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {children.map((child: any) => (
                      <Card key={child._id} className="border border-[#c0c8c9] hover:border-[#1a7a8a] transition-all">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#e0f5f7] flex items-center justify-center">
                                  <span className="text-[#1a7a8a] font-bold">
                                    {child.name?.charAt(0)?.toUpperCase() || "?"}
                                  </span>
                                </div>
                                <div>
                                  <h3 className="font-semibold text-[#001f24]">{child.name}</h3>
                                  <div className="flex flex-wrap items-center gap-2 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      {child.email}
                                    </span>
                                    {child.studentId && (
                                      <>
                                        <span>•</span>
                                        <span className="font-mono text-xs">#{child.studentId}</span>
                                      </>
                                    )}
                                    {child.gradeName && (
                                      <>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                          <GraduationCap className="h-3 w-3" />
                                          {child.gradeName}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                              {child.phoneNumber && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                                  <Phone className="h-3 w-3" />
                                  <span>{child.phoneNumber}</span>
                                </div>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Badge className={child.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                                {child.status === "active" ? "نشط" : "قيد الانتظار"}
                              </Badge>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleRemoveChild(child._id, child.name)}
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── ربط طالب موجود ────────────────────────────────────── */}
          <TabsContent value="existing">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>البحث عن طالب</Label>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="ابحث بالاسم أو البريد الإلكتروني..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pr-10"
                    />
                  </div>
                </div>

                {availableStudents === undefined ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-[#1a7a8a]" />
                  </div>
                ) : availableStudents.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-lg">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400">لا يوجد طلاب متاحون للربط</p>
                    <p className="text-xs text-gray-300 mt-1">يمكنك تسجيل طفل جديد من التبويب التالي</p>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto space-y-2 border border-gray-200 rounded-lg p-2">
                    {availableStudents.map((student: any) => (
                      <button
                        key={student._id}
                        onClick={() => setSelectedStudentId(student._id)}
                        className={`w-full text-right p-3 rounded-lg border-2 transition-all ${
                          selectedStudentId === student._id
                            ? "border-[#1a7a8a] bg-[#e0f5f7]"
                            : "border-gray-100 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[#001f24] flex items-center gap-2">
                              <User className="h-4 w-4 text-gray-400" />
                              {student.name}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {student.email}
                              </span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" />
                                {student.gradeName || "بدون صف"}
                              </span>
                              {student.studentId && (
                                <>
                                  <span>•</span>
                                  <span>رقم: {student.studentId}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {selectedStudentId === student._id && (
                            <Check className="h-5 w-5 text-[#1a7a8a] shrink-0 mr-2" />
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> {errors.submit}
                  </div>
                )}

                <Button
                  onClick={handleSelectExisting}
                  disabled={isSubmitting || !selectedStudentId}
                  className="w-full bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
                >
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  ربط الطالب
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── تسجيل طفل جديد ────────────────────────────────────── */}
          <TabsContent value="new">
            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label>اسم الطفل <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="أدخل اسم الطفل"
                      className={errors.name ? "border-red-500 pr-10" : "pr-10"}
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>البريد الإلكتروني <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="student@example.com"
                      className={errors.email ? "border-red-500 pr-10" : "pr-10"}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>رقم الهاتف</Label>
                  <div className="relative">
                    <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      placeholder="05XXXXXXXX"
                      className="pr-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>تاريخ الميلاد <span className="text-red-500">*</span></Label>
                    <div className="relative">
                      <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                        className={errors.birthDate ? "border-red-500 pr-10" : "pr-10"}
                      />
                    </div>
                    {errors.birthDate && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.birthDate}
                      </p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>الجنس <span className="text-red-500">*</span></Label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white ${
                        errors.gender ? "border-red-500" : "border-[#c0c8c9]"
                      }`}
                    >
                      <option value="">اختر</option>
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                    {errors.gender && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.gender}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>الصف الدراسي <span className="text-red-500">*</span></Label>
                  <select
                    value={formData.gradeId}
                    onChange={(e) => setFormData({ ...formData, gradeId: e.target.value, groupId: "" })}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white ${
                      errors.gradeId ? "border-red-500" : "border-[#c0c8c9]"
                    }`}
                  >
                    <option value="">اختر الصف</option>
                    {grades?.map((g: any) => (
                      <option key={g._id} value={g._id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  {errors.gradeId && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.gradeId}
                    </p>
                  )}
                </div>

                {formData.gradeId && groups && groups.length > 0 && (
                  <div className="space-y-2">
                    <Label>المجموعة (اختياري)</Label>
                    <select
                      value={formData.groupId}
                      onChange={(e) => setFormData({ ...formData, groupId: e.target.value })}
                      className="w-full px-3 py-2.5 border border-[#c0c8c9] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1a7a8a] bg-white"
                    >
                      <option value="">بدون مجموعة</option>
                      {groups.map((g: any) => (
                        <option key={g._id} value={g._id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>العنوان</Label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="العنوان الكامل (اختياري)"
                      rows={2}
                      className="w-full border border-[#c0c8c9] rounded-lg pr-10 pl-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#1a7a8a]"
                    />
                  </div>
                </div>

                {errors.submit && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> {errors.submit}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setActiveTab("list");
                      resetForm();
                    }}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleRegisterNew}
                    disabled={isSubmitting}
                    className="flex-1 bg-[#001f24] hover:bg-[#03363d] text-white gap-2"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    تسجيل الطفل
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}